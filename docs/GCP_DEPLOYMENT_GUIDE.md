# FilmyFly GCP Deployment Guide
## Complete Step-by-Step Deployment with Domain & Optimizations

**Domain**: filmyflyhd.space  
**Technology**: Node.js + Express + PostgreSQL (Supabase) + Nginx + PM2

---

## TABLE OF CONTENTS
1. [GCP Instance Setup](#gcp-instance-setup)
2. [Initial Server Configuration](#initial-server-configuration)
3. [Swap Space Setup](#swap-space-setup)
4. [Create App User](#create-app-user)
5. [Node.js Installation](#nodejs-installation)
6. [Clone & Setup Project](#clone--setup-project)
7. [PM2 Configuration](#pm2-configuration)
8. [Nginx Setup](#nginx-setup)
9. [SSL/HTTPS with Let's Encrypt](#ssllhttps-with-lets-encrypt)
10. [Domain DNS Configuration](#domain-dns-configuration)
11. [Monitoring & Performance](#monitoring--performance)

---

## GCP INSTANCE SETUP

### Step 1.1: Create a Compute Engine Instance

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Compute Engine > Instances**
3. Click **Create Instance** with these settings:

```
Name:                filmyfly-backend
Region:              us-central1 (or closer to your users)
Zone:                us-central1-a
Machine Type:        e2-medium (2 vCPU, 4GB RAM) - MINIMUM
                     OR e2-standard-4 (4 vCPU, 16GB RAM) - RECOMMENDED
Boot Disk:           Ubuntu 22.04 LTS, 30GB SSD
Network:             Default VPC
Firewall:            Allow HTTP & HTTPS
Service Account:     Create or select default
```

4. Click **Create**

### Step 1.2: Configure Firewall Rules

In **VPC Network > Firewall Rules**, create these rules:

```
Rule 1: Allow HTTP (Port 80)
  Priority: 1000
  Direction: Ingress
  Allowed: TCP 80

Rule 2: Allow HTTPS (Port 443)
  Priority: 1000
  Direction: Ingress
  Allowed: TCP 443

Rule 3: Allow SSH (Port 22)
  Priority: 1000
  Direction: Ingress
  Allowed: TCP 22
```

---

## INITIAL SERVER CONFIGURATION

### Step 2.1: SSH into Your Instance

```bash
# From GCP Console > Compute Instances > SSH button
# Or from terminal:
gcloud compute ssh filmyfly-backend --zone=us-central1-a
```

### Step 2.2: Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential python3
```

### Step 2.3: Set Timezone

```bash
sudo timedatectl set-timezone UTC
# Or your timezone: Asia/Kolkata, America/New_York, etc.
timedatectl
```

---

## SWAP SPACE SETUP (ULTRA-FAST PERFORMANCE)

### Step 3.1: Create Swap Space

```bash
# Create 4GB swap file (adjust as needed)
sudo fallocate -l 4G /swapfile

# Set correct permissions
sudo chmod 600 /swapfile

# Make it swap
sudo mkswap /swapfile

# Enable swap
sudo swapon /swapfile

# Verify
swapon --show
free -h
```

### Step 3.2: Make Swap Persistent

```bash
# Add to fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swappiness (lower = prefer RAM)
sudo sysctl vm.swappiness=30
echo 'vm.swappiness=30' | sudo tee -a /etc/sysctl.conf

# Apply
sudo sysctl -p
```

### Step 3.3: Performance Tuning

```bash
# Increase file descriptors
echo '* soft nofile 65535' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65535' | sudo tee -a /etc/security/limits.conf

# Enable TCP optimization
sudo sysctl -w net.core.somaxconn=65535
echo 'net.core.somaxconn=65535' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## CREATE APP USER

### Step 4.1: Create Dedicated User

```bash
# Create user
sudo useradd -m -s /bin/bash filmyfly

# Add to sudo group
sudo usermod -aG sudo filmyfly

# Switch to new user
su - filmyfly

# Verify
whoami  # Should output: filmyfly
```

### Step 4.2: Setup SSH Keys (Optional but Recommended)

```bash
# As filmyfly user
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
nano ~/.ssh/authorized_keys
# Paste your public key, then Ctrl+X, Y, Enter

chmod 600 ~/.ssh/authorized_keys
```

---

## NODE.JS INSTALLATION

### Step 5.1: Install Node.js via NVM (Recommended)

```bash
# Download NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
source ~/.bashrc

# Install Node.js LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node -v  # v20.x.x
npm -v   # 10.x.x
```

### Step 5.2: Install Global Tools

```bash
npm install -g pm2 typescript

# Verify PM2
pm2 -v
```

---

## CLONE & SETUP PROJECT

### Step 6.1: Clone Repository

```bash
cd ~
git clone https://github.com/kailashsur/filmyfly.work.git
cd filmyfly.work

# Or if private repo, use SSH:
# git clone git@github.com:kailashsur/filmyfly.work.git
```

### Step 6.2: Install Dependencies

```bash
npm install

# This will also run: prisma generate
```

### Step 6.3: Configure Environment Variables

```bash
# Copy example
cp .env.example .env

# Edit .env
nano .env
```

**Essential .env variables:**

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD%40@db.lajxtwubejtajmzrexep.supabase.co:5432/postgres?schema=public

# Server
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-$(openssl rand -base64 32)

# Firebase credentials (copy from local .env)
FIREBASE_SERVICE_ACCOUNT_KEY='{...}'
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
# ... other Firebase vars
```

**Generate secure SESSION_SECRET:**
```bash
openssl rand -base64 32
```

### Step 6.4: Build TypeScript

```bash
npm run build

# Verify build
ls -la dist/
```

### Step 6.5: Test Locally

```bash
npm run start

# Should see: Server is running on http://localhost:3000
# Press Ctrl+C to stop
```

---

## PM2 CONFIGURATION

### Step 7.1: Create PM2 Configuration

```bash
nano ~/filmyfly.work/ecosystem.config.js
```

**Add this content:**

```javascript
module.exports = {
  apps: [
    {
      name: 'filmyfly-backend',
      script: 'dist/app.js',
      cwd: '/home/filmyfly/filmyfly.work',
      instances: 'max',        // Use all CPU cores
      exec_mode: 'cluster',    // Enable clustering
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/filmyfly/.pm2/logs/filmyfly-error.log',
      out_file: '/home/filmyfly/.pm2/logs/filmyfly-out.log',
      log_file: '/home/filmyfly/.pm2/logs/filmyfly-combined.log',
      time: true,
      max_memory_restart: '500M',
      
      // Auto-restart on file changes
      watch: false,  // Set to true in development
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // Graceful reload
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
    }
  ],
  
  deploy: {
    production: {
      user: 'filmyfly',
      host: 'YOUR_GCP_INSTANCE_IP',
      ref: 'origin/main',
      repo: 'https://github.com/kailashsur/filmyfly.work.git',
      path: '/home/filmyfly/filmyfly.work',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

### Step 7.2: Start with PM2

```bash
cd ~/filmyfly.work

# Start app
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup startup (auto-restart on reboot)
pm2 startup
# Copy and run the command it outputs

# Verify
pm2 list
pm2 logs filmyfly-backend
```

### Step 7.3: PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs filmyfly-backend --lines 100

# Restart
pm2 restart filmyfly-backend

# Reload (zero-downtime)
pm2 reload filmyfly-backend

# Stop
pm2 stop filmyfly-backend
```

---

## NGINX SETUP

### Step 8.1: Install Nginx

```bash
sudo apt install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### Step 8.2: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/filmyflyhd.space
```

**Add this configuration:**

```nginx
# Upstream Node.js servers
upstream filmyfly_backend {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name filmyflyhd.space www.filmyflyhd.space;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name filmyflyhd.space www.filmyflyhd.space;
    
    # SSL Certificates (will be added after Let's Encrypt setup)
    ssl_certificate /etc/letsencrypt/live/filmyflyhd.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/filmyflyhd.space/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Logging
    access_log /var/log/nginx/filmyflyhd.space_access.log combined buffer=32k flush=5s;
    error_log /var/log/nginx/filmyflyhd.space_error.log warn;
    
    # Root directory
    root /home/filmyfly/filmyfly.work/public;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;
    
    # Client limits
    client_max_body_size 100M;
    
    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_buffering off;
    
    # Static files (cache for 7 days)
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # EJS files and views
    location ~ /views/ {
        deny all;
    }
    
    # API and main routes
    location / {
        proxy_pass http://filmyfly_backend;
    }
}
```

### Step 8.3: Enable Site Configuration

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/filmyflyhd.space \
           /etc/nginx/sites-enabled/filmyflyhd.space

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL/HTTPS WITH LET'S ENCRYPT

### Step 9.1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx

# Create directory for Let's Encrypt verification
sudo mkdir -p /var/www/letsencrypt
sudo chown www-data:www-data /var/www/letsencrypt
```

### Step 9.2: Create SSL Certificate

```bash
# Before running this, ensure your domain points to this server's IP
sudo certbot certonly --webroot \
  -w /var/www/letsencrypt \
  -d filmyflyhd.space \
  -d www.filmyflyhd.space \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Verify certificate
sudo certbot certificates
```

### Step 9.3: Auto-Renewal

```bash
# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

### Step 9.4: Update Nginx & Restart

```bash
# Verify Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Test SSL
curl -I https://filmyflyhd.space
```

---

## DOMAIN DNS CONFIGURATION

### Step 10.1: Get Your Server IP

```bash
# From GCP Console > Compute Engine > Instances
# Copy your external IP address
# Example: 34.67.123.45

# Or from terminal:
curl -s https://api.ipify.org
```

### Step 10.2: Update DNS Records

**Go to your domain registrar (GoDaddy, Namecheap, etc.):**

1. **A Record (IPv4)**
   ```
   Type: A
   Host: @
   Points to: YOUR_GCP_INSTANCE_IP (e.g., 34.67.123.45)
   TTL: 3600
   ```

2. **A Record for www**
   ```
   Type: A
   Host: www
   Points to: YOUR_GCP_INSTANCE_IP
   TTL: 3600
   ```

3. **CNAME Record (Alternative)**
   ```
   Type: CNAME
   Host: www
   Points to: filmyflyhd.space
   TTL: 3600
   ```

### Step 10.3: Verify DNS Propagation

```bash
# Check DNS (may take 15-30 minutes to propagate)
nslookup filmyflyhd.space
dig filmyflyhd.space

# Expected output:
# filmyflyhd.space.  3600  IN  A  YOUR_GCP_INSTANCE_IP
```

---

## MONITORING & PERFORMANCE

### Step 11.1: Monitor Application

```bash
# Real-time PM2 monitoring
pm2 monit

# View logs
pm2 logs filmyfly-backend --lines 50 --err

# Application status
pm2 status
```

### Step 11.2: Monitor System Resources

```bash
# Install htop
sudo apt install -y htop

# Monitor
htop

# Check disk space
df -h

# Check memory
free -h

# Check swap usage
swapon --show
```

### Step 11.3: Monitor Nginx

```bash
# View Nginx logs
sudo tail -f /var/log/nginx/filmyflyhd.space_access.log
sudo tail -f /var/log/nginx/filmyflyhd.space_error.log

# Check Nginx status
sudo systemctl status nginx

# Monitor connections
sudo netstat -tulpn | grep nginx
```

### Step 11.4: Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/filmyfly

# Add this:
/var/log/nginx/filmyflyhd.space_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}

/home/filmyfly/.pm2/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
}
```

---

## PERFORMANCE OPTIMIZATION

### Step 11.5: Database Connection Pooling

**Update your app to use connection pooling:**

```typescript
// In your Prisma config or app initialization
// Already configured via Supabase

// Monitor connections:
psql -h db.lajxtwubejtajmzrexep.supabase.co -U postgres
# SELECT count(*) as connection_count FROM pg_stat_activity;
```

### Step 11.6: Redis Caching (Optional)

```bash
# Install Redis
sudo apt install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping  # Should return PONG
```

### Step 11.7: Upload Large Files (if needed)

Increase Nginx file upload limit in your config:

```nginx
client_max_body_size 1000M;  # 1GB limit
```

---

## DEPLOYMENT CHECKLIST

- [ ] GCP instance created and configured
- [ ] Swap space (4GB) created and enabled
- [ ] System updated and optimized
- [ ] App user (filmyfly) created
- [ ] Node.js v20 LTS installed
- [ ] Project cloned and dependencies installed
- [ ] `.env` file configured with correct credentials
- [ ] TypeScript compiled to `dist/`
- [ ] PM2 ecosystem config created
- [ ] PM2 app started and verified
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained from Let's Encrypt
- [ ] Domain DNS records updated
- [ ] Domain resolves to server IP
- [ ] HTTPS working and redirects from HTTP
- [ ] Application accessible at https://filmyflyhd.space
- [ ] PM2 logs reviewed
- [ ] Monitoring setup complete
- [ ] Automatic SSL renewal configured
- [ ] PM2 startup configured

---

## TROUBLESHOOTING

### App not starting?
```bash
pm2 logs filmyfly-backend
npm run build
pm2 restart filmyfly-backend
```

### Domain not resolving?
```bash
nslookup filmyflyhd.space
# Wait 15-30 minutes for DNS propagation
# Check your registrar's DNS settings
```

### SSL certificate issues?
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
curl -I https://filmyflyhd.space
```

### High memory usage?
```bash
# Restart app
pm2 restart filmyfly-backend

# Check logs
pm2 logs filmyfly-backend

# Increase memory restart limit in ecosystem.config.js
# max_memory_restart: '1000M'
```

### Database connection errors?
```bash
# Verify .env DATABASE_URL
# Test connection manually
psql $DATABASE_URL

# Restart app to reload env vars
pm2 restart filmyfly-backend
```

---

## USEFUL COMMANDS REFERENCE

```bash
# === PM2 Commands ===
pm2 start ecosystem.config.js           # Start app
pm2 restart filmyfly-backend            # Restart
pm2 reload filmyfly-backend             # Zero-downtime reload
pm2 stop filmyfly-backend               # Stop app
pm2 delete filmyfly-backend             # Remove from PM2
pm2 logs                                # View all logs
pm2 monit                               # Monitor

# === Nginx Commands ===
sudo systemctl start nginx              # Start
sudo systemctl stop nginx               # Stop
sudo systemctl restart nginx            # Restart
sudo systemctl reload nginx             # Reload (no downtime)
sudo nginx -t                           # Test config
sudo tail -f /var/log/nginx/error.log   # View errors

# === Git Deployment ===
cd ~/filmyfly.work
git pull origin main
npm install
npm run build
pm2 reload filmyfly-backend

# === System Commands ===
htop                                    # Monitor
df -h                                   # Disk space
free -h                                 # Memory
uptime                                  # Server uptime
```

---

## NEXT STEPS

1. **Monitor Performance**: Check app logs and system resources daily
2. **Setup CDN**: Consider CloudFlare for faster content delivery
3. **Database Backups**: Setup automated backups via Supabase
4. **Analytics**: Integrate monitoring (Sentry, NewRelic, DataDog)
5. **CI/CD**: Setup GitHub Actions for automated deployment
6. **Rate Limiting**: Add rate limiting to API endpoints

---

**Need help?** Check logs with: `pm2 logs filmyfly-backend`

Good luck with your deployment! 🚀
