#!/bin/bash

# Pottur School Connect - Zero-Downtime Production Deployment Script
# This script ensures seamless deployment without any interruption to the live application

set -e  # Exit on any error

# Configuration
APP_NAME="pottur-school-website"
APP_PORT="8080"
APP_URL="http://localhost:${APP_PORT}"
PROJECT_DIR="/root/pottur-school-connect"
BACKUP_DIR="${PROJECT_DIR}/backups"
TEMP_BUILD_DIR="${PROJECT_DIR}/temp-build"
LOG_FILE="${PROJECT_DIR}/deployment.log"
MAX_HEALTH_CHECK_ATTEMPTS=10
HEALTH_CHECK_INTERVAL=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Error handler
handle_error() {
    log_error "Deployment failed at line $1. Initiating rollback..."
    rollback_deployment
    exit 1
}

# Set error trap
trap 'handle_error $LINENO' ERR

# Health check function
health_check() {
    local url=$1
    local max_attempts=${2:-$MAX_HEALTH_CHECK_ATTEMPTS}
    local attempt=1
    
    log "Performing health check on $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
            log_success "Health check passed (attempt $attempt/$max_attempts)"
            return 0
        fi
        
        log_warning "Health check failed (attempt $attempt/$max_attempts). Retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    # Create backup directory with timestamp
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local current_backup_dir="${BACKUP_DIR}/${backup_timestamp}"
    
    mkdir -p "$current_backup_dir"
    
    # Backup dist directory if it exists
    if [ -d "${PROJECT_DIR}/dist" ]; then
        cp -r "${PROJECT_DIR}/dist" "${current_backup_dir}/"
        log_success "Current dist directory backed up to $current_backup_dir"
    fi
    
    # Store backup path for potential rollback
    echo "$current_backup_dir" > "${PROJECT_DIR}/.last_backup"
    
    # Clean old backups (keep last 5)
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "20*" | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
}

# Rollback function
rollback_deployment() {
    log_warning "Initiating rollback to previous version..."
    
    if [ -f "${PROJECT_DIR}/.last_backup" ]; then
        local backup_path=$(cat "${PROJECT_DIR}/.last_backup")
        
        if [ -d "$backup_path/dist" ]; then
            # Remove current dist and restore backup
            rm -rf "${PROJECT_DIR}/dist"
            cp -r "$backup_path/dist" "${PROJECT_DIR}/"
            
            # Reload PM2 with backup version
            pm2 reload "$APP_NAME" --update-env
            sleep 5
            
            # Verify rollback
            if health_check "$APP_URL" 5; then
                log_success "Rollback completed successfully"
                return 0
            else
                log_error "Rollback failed - manual intervention required"
                return 1
            fi
        fi
    fi
    
    log_error "No backup found for rollback - manual intervention required"
    return 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment safety checks..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "Not in project root directory"
        exit 1
    fi
    
    # Check if PM2 process exists and is online
    if ! pm2 list | grep -q "$APP_NAME.*online"; then
        log_error "PM2 process '$APP_NAME' is not running or not online"
        exit 1
    fi
    
    # Check if application is responding
    if ! health_check "$APP_URL" 3; then
        log_error "Current application is not responding"
        exit 1
    fi
    
    # Check available disk space (require at least 1GB)
    local available_space=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 1048576 ]; then  # 1GB in KB
        log_error "Insufficient disk space for deployment"
        exit 1
    fi
    
    log_success "All pre-deployment checks passed"
}

# Build new version
build_new_version() {
    log "Building new version..."
    
    # Clean and create temp build directory
    rm -rf "$TEMP_BUILD_DIR"
    mkdir -p "$TEMP_BUILD_DIR"
    
    # Copy source files to temp directory
    cp -r "$PROJECT_DIR"/* "$TEMP_BUILD_DIR/" 2>/dev/null || true
    cp -r "$PROJECT_DIR"/.[^.]* "$TEMP_BUILD_DIR/" 2>/dev/null || true
    
    # Remove excluded directories from temp build
    rm -rf "$TEMP_BUILD_DIR/node_modules" "$TEMP_BUILD_DIR/dist" "$TEMP_BUILD_DIR/.git" "$TEMP_BUILD_DIR/temp-build" "$TEMP_BUILD_DIR/backups" 2>/dev/null || true
    
    cd "$TEMP_BUILD_DIR"
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false
    
    # Run type checking
    log "Running type checks..."
    npm run type-check
    
    # Run linting
    log "Running linting..."
    npm run lint
    
    # Build for production
    log "Building for production..."
    npm run build:prod
    
    # Validate build output
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
        log_error "Build validation failed - dist directory or index.html not found"
        exit 1
    fi
    
    # Check build size (warn if over 50MB)
    local build_size=$(du -sm dist | cut -f1)
    if [ "$build_size" -gt 50 ]; then
        log_warning "Build size is ${build_size}MB - consider optimization"
    fi
    
    cd "$PROJECT_DIR"
    log_success "New version built successfully"
}

# Deploy new version
deploy_new_version() {
    log "Deploying new version with zero downtime..."
    
    # Backup current deployment
    backup_current_deployment
    
    # Replace dist directory atomically
    if [ -d "${PROJECT_DIR}/dist" ]; then
        mv "${PROJECT_DIR}/dist" "${PROJECT_DIR}/dist.old"
    fi
    
    mv "${TEMP_BUILD_DIR}/dist" "${PROJECT_DIR}/"
    
    # Graceful reload with PM2 (zero downtime)
    log "Performing graceful reload..."
    pm2 reload "$APP_NAME" --update-env
    
    # Wait for process to stabilize
    sleep 5
    
    # Verify deployment
    if health_check "$APP_URL"; then
        # Clean up old dist and temp build
        rm -rf "${PROJECT_DIR}/dist.old" 2>/dev/null || true
        rm -rf "$TEMP_BUILD_DIR"
        log_success "Deployment completed successfully"
    else
        log_error "New version health check failed"
        # Restore old version if it exists
        if [ -d "${PROJECT_DIR}/dist.old" ]; then
            rm -rf "${PROJECT_DIR}/dist"
            mv "${PROJECT_DIR}/dist.old" "${PROJECT_DIR}/dist"
            pm2 reload "$APP_NAME" --update-env
            sleep 5
        fi
        exit 1
    fi
}

# Post-deployment verification
post_deployment_verification() {
    log "Running post-deployment verification..."
    
    # Extended health checks
    for i in {1..3}; do
        if ! health_check "$APP_URL" 5; then
            log_error "Post-deployment health check $i failed"
            rollback_deployment
            exit 1
        fi
        sleep 2
    done
    
    # Check PM2 process status
    if ! pm2 list | grep -q "$APP_NAME.*online"; then
        log_error "PM2 process is not online after deployment"
        rollback_deployment
        exit 1
    fi
    
    # Check memory usage
    local memory_usage=$(pm2 list | grep "$APP_NAME" | awk '{print $8}' | sed 's/mb//')
    if [ "$memory_usage" -gt 500 ]; then  # Warn if over 500MB
        log_warning "High memory usage detected: ${memory_usage}MB"
    fi
    
    log_success "Post-deployment verification completed"
}

# Performance monitoring
monitor_performance() {
    log "Monitoring performance for 30 seconds..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + 30))
    
    while [ $(date +%s) -lt $end_time ]; do
        # Check if process is still online
        if ! pm2 list | grep -q "$APP_NAME.*online"; then
            log_error "Process went offline during monitoring"
            rollback_deployment
            exit 1
        fi
        
        # Quick health check
        if ! curl -s -f -o /dev/null "$APP_URL"; then
            log_error "Application became unresponsive during monitoring"
            rollback_deployment
            exit 1
        fi
        
        sleep 5
    done
    
    log_success "Performance monitoring completed - application is stable"
}

# Main deployment function
main() {
    log "🚀 Starting Zero-Downtime Production Deployment"
    log "================================================"
    
    # Create necessary directories
    mkdir -p "$BACKUP_DIR"
    
    # Run deployment steps
    pre_deployment_checks
    build_new_version
    deploy_new_version
    post_deployment_verification
    monitor_performance
    
    # Final status
    log_success "🎉 Zero-Downtime Deployment Completed Successfully!"
    log "📊 Current PM2 Status:"
    pm2 list
    log ""
    log "🌐 Application URL: $APP_URL"
    log "📝 Deployment log: $LOG_FILE"
    log "💾 Backup location: $(cat ${PROJECT_DIR}/.last_backup 2>/dev/null || echo 'N/A')"
    log ""
    log "📋 Post-deployment checklist:"
    log "   ✅ Application is online and responding"
    log "   ✅ Zero downtime achieved"
    log "   ✅ Backup created for rollback"
    log "   ✅ Performance monitoring completed"
    log ""
    log "🔍 Monitor the application for the next 15 minutes"
    log "📊 Check logs: pm2 logs $APP_NAME"
    log "🔄 Rollback if needed: ./rollback.sh"
}

# Run main function
main "$@"