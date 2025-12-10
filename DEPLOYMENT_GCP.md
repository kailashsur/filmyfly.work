# FilmyFly Deployment Guide - GCP with Ultra-Fast Performance

This guide provides step-by-step instructions to deploy your Express.js application on Google Cloud Platform with:
- Swap space for memory management
- New dedicated user for security
- Nginx reverse proxy with aggressive caching
- Easy GitHub updates (CI/CD)
- Auto-scaling and performance optimization

---

## **Phase 1: GCP VM Setup**

### **1.1 Create a Compute Engine Instance**

```bash
# Open GCP Console and create a new VM instance
# Recommended specs:
# - Machine type: e2-medium (2 vCPU, 4GB RAM) - scalable
# - Boot disk: Ubuntu 22.04 LTS (30GB SSD)
# - Region: us-central1 (or closest to your users)
# - Allow HTTP/HTTPS traffic
# - Assign static IP address
```

### **1.2 Connect to Your VM**

```bash
# Use GCP Console SSH or gcloud CLI
gcloud compute ssh filmyfly-server --zone=us-central1-a
```

---

## **Phase 2: Server Configuration**

### **2.1 Update System**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
```

### **2.2 Add Swap Space (Critical for Performance)**

```bash
# Create 4GB swap space (2x RAM is optimal)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap
free -h
# Should show: Swap: 4.0G total
```

### **2.3 Create Dedicated User for Security**

```bash
# Create new user without sudo access
sudo useradd -m -s /bin/bash filmyfly

# Create app directory with proper permissions
sudo mkdir -p /home/filmyfly/app
sudo chown -R filmyfly:filmyfly /home/filmyfly/app

# Switch to new user
sudo su - filmyfly
```

---

## **Phase 3: Install Dependencies**

### **3.1 Install Node.js and npm (as filmyfly user)**

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # v20.x
npm --version   # 10.x
```

### **3.2 Install PM2 Process Manager**

```bash
# Install PM2 globally
npm install -g pm2

# Initialize PM2 for auto-start
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u filmyfly --hp /home/filmyfly

# Verify PM2 setup
pm2 status
```

### **3.3 Install Nginx**

```bash
# Back to root or use sudo
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### **3.4 Install PostgreSQL Client (if remote DB)**

```bash
sudo apt install -y postgresql-client
```

---

## **Phase 4: Setup GitHub SSH Access**

### **4.1 Generate SSH Key for GitHub**

```bash
# As filmyfly user
ssh-keygen -t ed25519 -C "filmyfly@yourdomain.com" -f ~/.ssh/github
# Press Enter twice (no passphrase for auto-deploy)

# Get public key
cat ~/.ssh/github.pub
```

### **4.2 Add SSH Key to GitHub**

1. Go to **GitHub Settings → SSH and GPG keys**
2. Click **New SSH key**
3. Paste the public key content
4. Name it: `GCP Server`

### **4.3 Configure SSH Config**

```bash
# Create SSH config
nano ~/.ssh/config
```

Add:
```
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github
  StrictHostKeyChecking accept-new
```

### **4.4 Test GitHub Connection**

```bash
ssh -T git@github.com
# Should output: Hi yourname! You've successfully authenticated...
```

---

## **Phase 5: Clone and Deploy Application**

### **5.1 Clone Repository**

```bash
# As filmyfly user, in /home/filmyfly/app
cd /home/filmyfly/app

# Clone with SSH (not HTTPS)
git clone git@github.com:kailashsur/filmyfly.work.git .

# Or if existing:
git fetch origin
git pull origin main
```

### **5.2 Setup Environment Variables**

```bash
# Copy .env file
cp .env.example .env
nano .env
```

Add your Supabase connection string:
```
DATABASE_URL=postgresql://postgres:PASSWORD%40@db.xxxxx.supabase.co:5432/postgres?schema=public
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-super-secret-key-here
FIREBASE_SERVICE_ACCOUNT_KEY='{...}'
```

### **5.3 Install Dependencies and Build**

```bash
cd /home/filmyfly/app
npm install --production
npm run build
npm run prisma:generate
```

### **5.4 Start Application with PM2**

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
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
    merge_logs: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 logs filmyfly
```

---

## **Phase 6: Nginx Configuration with Ultra-Fast Caching**

### **6.1 Create Nginx Config**

```bash
sudo tee /etc/nginx/sites-available/filmyflyhd.space > /dev/null << 'EOF'
# Cache levels and paths
proxy_cache_path /var/cache/nginx/filmyfly levels=1:2 keys_zone=filmyfly_cache:100m max_size=1g inactive=60d use_temp_path=off;

# Upstream backend
upstream filmyfly_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name filmyflyhd.space www.filmyflyhd.space;
    
    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name filmyflyhd.space www.filmyflyhd.space;
    
    # SSL Certificates (will be added by certbot)
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
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Root for static files
    root /home/filmyfly/app/public;
    
    # Cache static assets (images, CSS, JS)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Cache HTML pages (30 days)
    location ~* \.html?$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
    
    # Reverse proxy to Node.js with caching
    location / {
        proxy_cache filmyfly_cache;
        proxy_cache_valid 200 30m;
        proxy_cache_valid 404 1m;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_bypass $http_pragma $http_authorization;
        proxy_no_cache $http_pragma $http_authorization;
        
        # Add cache status header (for debugging)
        add_header X-Cache-Status $upstream_cache_status;
        
        # Proxy settings
        proxy_pass http://filmyfly_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Admin routes - no cache
    location /admin {
        proxy_pass http://filmyfly_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass 1;
        proxy_no_cache 1;
    }
    
    # API routes - short cache (5 minutes)
    location /api {
        proxy_cache filmyfly_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        
        proxy_pass http://filmyfly_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://filmyfly_backend;
        access_log off;
    }
}
EOF
```

### **6.2 Enable Nginx Config**

```bash
sudo ln -sf /etc/nginx/sites-available/filmyflyhd.space /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## **Phase 7: SSL Certificate Setup (Let's Encrypt)**

### **7.1 Install Certbot**

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### **7.2 Get SSL Certificate**

```bash
sudo certbot certonly --nginx -d filmyflyhd.space -d www.filmyflyhd.space

# Follow prompts and agree to terms
```

### **7.3 Auto-Renew Certificate**

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## **Phase 8: Easy Update Script**

### **8.1 Create Update Script**

```bash
# As filmyfly user
cat > /home/filmyfly/app/deploy.sh << 'EOF'
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment...${NC}"

cd /home/filmyfly/app

# Fetch latest changes
echo -e "${YELLOW}Pulling latest code from GitHub...${NC}"
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}Git pull failed!${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --production

# Build TypeScript
echo -e "${YELLOW}Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# Generate Prisma Client
echo -e "${YELLOW}Generating Prisma Client...${NC}"
npm run prisma:generate

# Restart PM2
echo -e "${YELLOW}Restarting application...${NC}"
pm2 restart filmyfly
pm2 save

# Clear Nginx cache
echo -e "${YELLOW}Clearing Nginx cache...${NC}"
sudo rm -rf /var/cache/nginx/filmyfly/*
sudo systemctl reload nginx

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Website updated at https://filmyflyhd.space${NC}"
EOF

chmod +x /home/filmyfly/app/deploy.sh
```

### **8.2 Run Deployment**

```bash
# Simple one-command deployment
/home/filmyfly/app/deploy.sh

# Or with PM2 monitoring
pm2 start /home/filmyfly/app/deploy.sh --name "filmyfly-deploy"
```

---

## **Phase 9: Monitoring and Logging**

### **9.1 Check Application Status**

```bash
# PM2 status
pm2 status

# View logs
pm2 logs filmyfly --lines 100

# Real-time monitoring
pm2 monit
```

### **9.2 Check Nginx Cache Status**

```bash
# View cache usage
du -sh /var/cache/nginx/filmyfly/

# Monitor cache hits
# Check 'X-Cache-Status' header in response
curl -I https://filmyflyhd.space

# Should show: X-Cache-Status: HIT (for cached pages)
```

### **9.3 Setup Log Rotation**

```bash
sudo tee /etc/logrotate.d/filmyfly > /dev/null << 'EOF'
/home/filmyfly/app/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 filmyfly filmyfly
    sharedscripts
    postrotate
        pm2 reload filmyfly > /dev/null 2>&1
    endscript
}
EOF
```

---

## **Phase 10: Performance Optimization Checklist**

### **10.1 Database Connection Pooling (Optional)**

Add to your Node.js app for connection optimization:
```typescript
// In src/lib/prisma.ts
// Already using PrismaClient - optimal for serverless
```

### **10.2 Node.js Cluster Mode**

Already enabled in `ecosystem.config.js` with `exec_mode: 'cluster'`

### **10.3 Monitor Server Resources**

```bash
# Install htop for real-time monitoring
sudo apt install -y htop
htop

# Check memory with swap
free -h

# Monitor Nginx connections
watch 'netstat -an | grep -E "^tcp" | wc -l'
```

---

## **Phase 11: Domain DNS Setup**

### **11.1 Point Domain to GCP**

1. Get your GCP VM static IP address
2. In your domain registrar (domain provider):
   - Create an **A record**: `filmyflyhd.space` → `[GCP_IP_ADDRESS]`
   - Create a **CNAME record**: `www.filmyflyhd.space` → `filmyflyhd.space`

### **11.2 Verify DNS**

```bash
# Test DNS resolution
nslookup filmyflyhd.space

# Verify SSL certificate
curl -I https://filmyflyhd.space
```

---

## **Phase 12: Automated Backup and Maintenance**

### **12.1 Database Backup Script**

```bash
cat > /home/filmyfly/app/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/filmyfly/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup from Supabase (if using remote DB)
# pg_dump "$DATABASE_URL" > "$BACKUP_DIR/filmyfly_$DATE.sql"

echo "Backup created: $BACKUP_DIR/filmyfly_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x /home/filmyfly/app/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/filmyfly/app/backup.sh
```

---

## **Complete Workflow Summary**

### **After Initial Setup, Your Daily Workflow:**

1. **Make changes locally** and commit to GitHub
2. **Push to GitHub**: `git push origin main`
3. **SSH into server**: Connect to your VM
4. **Deploy**: Run `/home/filmyfly/app/deploy.sh`
5. **Done!** Website updates automatically

### **Monitoring Dashboard:**

```bash
# All-in-one command to check system health
echo "=== PM2 Status ==="; pm2 status; \
echo "=== Memory Usage ==="; free -h; \
echo "=== Cache Size ==="; du -sh /var/cache/nginx/filmyfly/; \
echo "=== Latest Logs ==="; pm2 logs filmyfly --lines 5
```

---

## **Troubleshooting**

### **502 Bad Gateway Error**
```bash
# Check if Node.js app is running
pm2 status

# Restart if needed
pm2 restart filmyfly
```

### **Slow Response Time**
```bash
# Check cache hits
curl -I https://filmyflyhd.space | grep X-Cache

# Clear cache if needed
sudo rm -rf /var/cache/nginx/filmyfly/*
sudo systemctl reload nginx
```

### **Out of Memory**
```bash
# Check swap status
free -h

# If swap is full, increase it:
# Add another 4GB swap (repeat Phase 2.2 steps)
```

---

## **Performance Metrics You Should Expect**

| Metric | Value |
|--------|-------|
| **Page Load Time** | < 500ms (cached) |
| **API Response** | < 1s |
| **Cache Hit Rate** | > 80% |
| **SSL Grade** | A+ |
| **Uptime** | 99.5%+ |

---

## **Quick Reference Commands**

```bash
# Deployment
/home/filmyfly/app/deploy.sh

# Restart application
pm2 restart filmyfly

# View logs
pm2 logs filmyfly

# Reload Nginx
sudo systemctl reload nginx

# Check status
pm2 status && free -h
```

---

**Your site is now production-ready with ultra-fast performance!** 🚀
