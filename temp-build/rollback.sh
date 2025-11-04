#!/bin/bash

# Pottur School Connect - Emergency Rollback Script
# This script provides quick rollback capability in case of deployment issues

set -e

# Configuration
APP_NAME="pottur-school-website"
APP_PORT="8080"
APP_URL="http://localhost:${APP_PORT}"
PROJECT_DIR="/root/pottur-school-connect"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_FILE="${PROJECT_DIR}/rollback.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Health check function
health_check() {
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f -o /dev/null "$APP_URL"; then
            log_success "Health check passed"
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# List available backups
list_backups() {
    log "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        ls -la "$BACKUP_DIR" | grep "^d" | awk '{print $9}' | grep -E "^20[0-9]{6}_[0-9]{6}$" | sort -r | head -10
    else
        log_error "No backup directory found"
        exit 1
    fi
}

# Rollback to specific backup
rollback_to_backup() {
    local backup_name=$1
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    if [ ! -d "$backup_path/dist" ]; then
        log_error "Backup not found: $backup_path"
        exit 1
    fi
    
    log "Rolling back to backup: $backup_name"
    
    # Backup current version before rollback
    local emergency_backup="${BACKUP_DIR}/emergency_$(date '+%Y%m%d_%H%M%S')"
    mkdir -p "$emergency_backup"
    if [ -d "${PROJECT_DIR}/dist" ]; then
        cp -r "${PROJECT_DIR}/dist" "$emergency_backup/"
        log "Current version backed up to: $emergency_backup"
    fi
    
    # Replace current dist with backup
    rm -rf "${PROJECT_DIR}/dist"
    cp -r "$backup_path/dist" "${PROJECT_DIR}/"
    
    # Reload PM2
    log "Reloading PM2 process..."
    pm2 reload "$APP_NAME" --update-env
    sleep 5
    
    # Verify rollback
    if health_check; then
        log_success "Rollback completed successfully"
        log "Application is now running the backup version: $backup_name"
    else
        log_error "Rollback verification failed"
        exit 1
    fi
}

# Rollback to last backup
rollback_to_last() {
    if [ -f "${PROJECT_DIR}/.last_backup" ]; then
        local last_backup_path=$(cat "${PROJECT_DIR}/.last_backup")
        local backup_name=$(basename "$last_backup_path")
        rollback_to_backup "$backup_name"
    else
        log_error "No last backup reference found"
        list_backups
        echo ""
        echo "Usage: $0 <backup_name>"
        exit 1
    fi
}

# Main function
main() {
    log "🔄 Starting Emergency Rollback Process"
    log "======================================"
    
    case "${1:-last}" in
        "list")
            list_backups
            ;;
        "last")
            rollback_to_last
            ;;
        *)
            rollback_to_backup "$1"
            ;;
    esac
    
    log_success "🎉 Rollback process completed!"
    log "📊 Current PM2 Status:"
    pm2 list
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [backup_name|last|list]"
    echo ""
    echo "Examples:"
    echo "  $0 last                    # Rollback to last backup"
    echo "  $0 list                    # List available backups"
    echo "  $0 20241024_143022         # Rollback to specific backup"
    exit 1
fi

main "$@"