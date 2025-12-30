#!/bin/bash

################################################################################
# FilmyFly Automated Deployment Script for GCP
# Run this ONCE to setup everything from scratch
# Usage: bash setup.sh
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="filmyflyhd.space"
APP_USER="filmyfly"
APP_HOME="/home/$APP_USER"
APP_DIR="$APP_HOME/app"
REPO_URL="git@github.com:kailashsur/filmyfly.work.git"

# Print header
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  FilmyFly - GCP Automated Deployment Setup                ║${NC}"
echo -e "${BLUE}║  Domain: $DOMAIN${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: System Update
echo -e "${YELLOW}[1/12] Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y
echo -e "${GREEN}✓ System updated${NC}\n"

# Step 2: Add Swap Space
echo -e "${YELLOW}[2/12] Creating 4GB swap space...${NC}"
if ! grep -q "^/swapfile" /etc/fstab; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab > /dev/null
    echo -e "${GREEN}✓ Swap space created (4GB)${NC}\n"
else
    echo -e "${GREEN}✓ Swap already configured${NC}\n"
fi

# Step 3: Create App User
echo -e "${YELLOW}[3/12] Creating dedicated user '$APP_USER'...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    sudo useradd -m -s /bin/bash $APP_USER
    sudo mkdir -p $APP_DIR
    sudo chown -R $APP_USER:$APP_USER $APP_HOME
    echo -e "${GREEN}✓ User '$APP_USER' created${NC}\n"
else
    echo -e "${GREEN}✓ User '$APP_USER' already exists${NC}\n"
fi

# Step 4: Install Node.js
echo -e "${YELLOW}[4/12] Installing Node.js 20.x...${NC}"
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}✓ Node.js installed$(node --version)${NC}\n"
else
    echo -e "${GREEN}✓ Node.js already installed $(node --version)${NC}\n"
fi

# Step 5: Install PM2
echo -e "${YELLOW}[5/12] Installing PM2 process manager...${NC}"
if ! sudo npm list -g pm2 &>/dev/null; then
    sudo npm install -g pm2
    sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u $APP_USER --hp $APP_HOME
    echo -e "${GREEN}✓ PM2 installed and configured${NC}\n"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}\n"
fi

# Step 6: Install Nginx
echo -e "${YELLOW}[6/12] Installing Nginx...${NC}"
if ! command -v nginx &>/dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo -e "${GREEN}✓ Nginx installed and started${NC}\n"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}\n"
fi

# Step 7: Install Certbot
echo -e "${YELLOW}[7/12] Installing Certbot for SSL...${NC}"
if ! command -v certbot &>/dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✓ Certbot installed${NC}\n"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}\n"
fi

# Step 8: Install PostgreSQL Client
echo -e "${YELLOW}[8/12] Installing PostgreSQL client...${NC}"
if ! command -v psql &>/dev/null; then
    sudo apt install -y postgresql-client
    echo -e "${GREEN}✓ PostgreSQL client installed${NC}\n"
else
    echo -e "${GREEN}✓ PostgreSQL client already installed${NC}\n"
fi

# Step 9: Setup GitHub SSH Key
echo -e "${YELLOW}[9/12] Setting up GitHub SSH access...${NC}"
sudo -u $APP_USER bash << EOF
if [ ! -f ~/.ssh/github ]; then
    mkdir -p ~/.ssh
    ssh-keygen -t ed25519 -C "filmyfly@$DOMAIN" -f ~/.ssh/github -N ""
    
    # Setup SSH config
    cat > ~/.ssh/config << 'SSHCONFIG'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github
  StrictHostKeyChecking accept-new
SSHCONFIG
    chmod 600 ~/.ssh/config
    
    echo ""
    echo -e "${GREEN}✓ GitHub SSH key generated${NC}"
    echo -e "${YELLOW}Add this SSH key to GitHub: https://github.com/settings/keys${NC}"
    echo -e "${YELLOW}Copy the key below:${NC}"
    cat ~/.ssh/github.pub
    echo ""
else
    echo -e "${GREEN}✓ GitHub SSH key already exists${NC}"
fi
EOF

echo ""
echo -e "${YELLOW}Press Enter to continue after adding SSH key to GitHub...${NC}"
read -p ""

# Step 10: Clone Repository
echo -e "${YELLOW}[10/12] Cloning repository...${NC}"
sudo -u $APP_USER bash << EOF
cd $APP_DIR
if [ ! -f ".git/config" ]; then
    git clone $REPO_URL .
    echo -e "${GREEN}✓ Repository cloned${NC}"
else
    git fetch origin
    git pull origin main
    echo -e "${GREEN}✓ Repository updated${NC}"
fi

# Create necessary directories
mkdir -p logs backups
EOF

# Step 11: Install Application Dependencies
echo -e "${YELLOW}[11/12] Installing application dependencies...${NC}"
sudo -u $APP_USER bash << EOF
cd $APP_DIR
npm install --production
npm run build
npm run prisma:generate
echo -e "${GREEN}✓ Dependencies installed and built${NC}"
EOF

# Step 12: Configure PM2 and Nginx
echo -e "${YELLOW}[12/12] Configuring PM2 and Nginx...${NC}"

# Create PM2 ecosystem file
sudo -u $APP_USER bash << 'EOF'
cat > $APP_DIR/ecosystem.config.js << 'PMCONFIG'
module.exports = {
  apps: [{
    name: 'filmyfly',
    script: 'dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
PMCONFIG
EOF

# Start PM2
sudo -u $APP_USER bash << EOF
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
EOF

# Configure Nginx
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << 'NGINXCONFIG'
# Cache configuration
proxy_cache_path /var/cache/nginx/filmyfly levels=1:2 keys_zone=filmyfly_cache:100m max_size=1g inactive=60d use_temp_path=off;

# Upstream backend
upstream filmyfly_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name filmyflyhd.space www.filmyflyhd.space;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name filmyflyhd.space www.filmyflyhd.space;
    
    # SSL will be configured by certbot
    ssl_certificate /etc/letsencrypt/live/filmyflyhd.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/filmyflyhd.space/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
    gzip_min_length 1000;
    gzip_comp_level 6;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Root for static files
    root /home/filmyfly/app/public;
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Reverse proxy with caching
    location / {
        proxy_cache filmyfly_cache;
        proxy_cache_valid 200 30m;
        proxy_cache_valid 404 1m;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        add_header X-Cache-Status $upstream_cache_status;
        
        proxy_pass http://filmyfly_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Admin routes - no cache
    location /admin {
        proxy_pass http://filmyfly_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass 1;
        proxy_no_cache 1;
    }
}
NGINXCONFIG

sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# Create deployment script
sudo -u $APP_USER bash << 'DEPLOYEOF'
cat > $APP_DIR/deploy.sh << 'DEPLOYSHELL'
#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting deployment...${NC}"

cd /home/filmyfly/app

# Git pull
echo -e "${YELLOW}Pulling latest code...${NC}"
git fetch origin
git pull origin main
[ $? -eq 0 ] || { echo -e "${RED}Git pull failed!${NC}"; exit 1; }

# Install & Build
echo -e "${YELLOW}Building application...${NC}"
npm install --production
npm run build
npm run prisma:generate

# Restart
echo -e "${YELLOW}Restarting application...${NC}"
pm2 restart filmyfly
pm2 save

# Clear cache
echo -e "${YELLOW}Clearing Nginx cache...${NC}"
sudo rm -rf /var/cache/nginx/filmyfly/*
sudo systemctl reload nginx

echo -e "${GREEN}Deployment completed! ✓${NC}"
DEPLOYSHELL

chmod +x $APP_DIR/deploy.sh
DEPLOYEOF

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Setup Completed! Next Steps:                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}1. Configure your domain DNS:${NC}"
echo "   - Get your GCP VM's static IP: gcloud compute instances list"
echo "   - Point A record to that IP"
echo ""
echo -e "${YELLOW}2. Setup SSL certificate:${NC}"
echo "   sudo certbot certonly --nginx -d filmyflyhd.space -d www.filmyflyhd.space"
echo ""
echo -e "${YELLOW}3. Check application status:${NC}"
echo "   pm2 status"
echo ""
echo -e "${YELLOW}4. View logs:${NC}"
echo "   pm2 logs filmyfly"
echo ""
echo -e "${YELLOW}5. To deploy updates:${NC}"
echo "   /home/filmyfly/app/deploy.sh"
echo ""
echo -e "${GREEN}Your site will be available at: https://$DOMAIN${NC}"
echo ""
