#!/bin/bash

# Simple Zero-Downtime Production Deployment Script
# This script deploys changes without interrupting the live application

set -e

# Configuration
APP_NAME="pottur-school-website"
APP_PORT="8080"
APP_URL="http://localhost:${APP_PORT}"
PROJECT_DIR="/root/pottur-school-connect"
BACKUP_DIR="${PROJECT_DIR}/backups"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"
}

# Health check function
health_check() {
    if curl -s -f -o /dev/null "$APP_URL"; then
        return 0
    else
        return 1
    fi
}

# Main deployment function
main() {
    log "🚀 Starting Simple Zero-Downtime Deployment"
    log "============================================"
    
    # Check if PM2 process is running
    if ! pm2 list | grep -q "$APP_NAME.*online"; then
        echo "❌ PM2 process '$APP_NAME' is not running"
        exit 1
    fi
    
    # Check if application is responding
    if ! health_check; then
        echo "❌ Application is not responding"
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
    
    # Create backup directory with timestamp
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_path="${BACKUP_DIR}/${backup_timestamp}"
    mkdir -p "$backup_path"
    
    # Backup current dist directory
    if [ -d "${PROJECT_DIR}/dist" ]; then
        cp -r "${PROJECT_DIR}/dist" "$backup_path/"
        log_success "Current version backed up to $backup_path"
        echo "$backup_path" > "${PROJECT_DIR}/.last_backup"
    fi
    
    # Build new version
    log "Building new version..."
    npm run build:prod
    
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
        echo "❌ Build failed - dist directory or index.html not found"
        exit 1
    fi
    
    log_success "Build completed successfully"
    
    # Deploy with zero downtime using PM2 reload
    log "Deploying with zero downtime..."
    pm2 reload "$APP_NAME" --update-env
    
    # Wait for process to stabilize
    sleep 5
    
    # Verify deployment
    if health_check; then
        log_success "🎉 Deployment completed successfully!"
        log "🌐 Application is running on $APP_URL"
        log "💾 Backup available at: $backup_path"
        
        # Show PM2 status
        echo ""
        pm2 list
        
        # Clean old backups (keep last 5)
        find "$BACKUP_DIR" -maxdepth 1 -type d -name "20*" | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
        
    else
        echo "❌ Deployment verification failed"
        
        # Rollback if backup exists
        if [ -d "$backup_path/dist" ]; then
            log_warning "Rolling back to previous version..."
            rm -rf "${PROJECT_DIR}/dist"
            cp -r "$backup_path/dist" "${PROJECT_DIR}/"
            pm2 reload "$APP_NAME" --update-env
            sleep 3
            
            if health_check; then
                log_success "Rollback completed successfully"
            else
                echo "❌ Rollback failed - manual intervention required"
            fi
        fi
        exit 1
    fi
}

# Run main function
main "$@"