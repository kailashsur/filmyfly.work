#!/bin/bash

################################################################################
# FilmyFly Log Rotation Setup
# Automatically rotates and compresses logs to save disk space
# Keeps logs organized and prevents disk from filling up
################################################################################

APP_DIR="/home/filmyfly/app"

echo "Setting up log rotation..."

# Create logs directory if it doesn't exist
mkdir -p $APP_DIR/logs

# Create logrotate configuration
sudo tee /etc/logrotate.d/filmyfly > /dev/null << 'EOF'
# FilmyFly Application Logs
/home/filmyfly/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0640 filmyfly filmyfly
    sharedscripts
    postrotate
        pm2 reload filmyfly > /dev/null 2>&1 || true
    endscript
}
EOF

# Create Nginx log rotation
sudo tee /etc/logrotate.d/filmyfly-nginx > /dev/null << 'EOF'
# FilmyFly Nginx Logs
/var/log/nginx/filmyfly*.log {
    daily
    rotate 30
    missingok
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
EOF

echo "✓ Log rotation configured"
echo "Logs will be:"
echo "  - Rotated daily"
echo "  - Compressed after 1 day"
echo "  - Kept for 30 days"
echo "  - Stored in /home/filmyfly/app/logs/"
