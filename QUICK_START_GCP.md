# FilmyFly GCP Deployment - Quick Reference Guide

## 🚀 One-Time Setup (Complete Installation)

Run this script **ONCE** to setup everything:

```bash
# On GCP VM (as root or with sudo)
curl -fsSL https://raw.githubusercontent.com/kailashsur/filmyfly.work/main/scripts/setup-gcp.sh | bash
```

Or manually:

```bash
bash setup-gcp.sh
```

**What it does:**
- ✅ Updates system and adds 4GB swap
- ✅ Creates dedicated `filmyfly` user
- ✅ Installs Node.js 20, PM2, Nginx
- ✅ Configures GitHub SSH access
- ✅ Clones your repository
- ✅ Installs dependencies and builds app
- ✅ Sets up Nginx caching (ultra-fast)
- ✅ Configures PM2 for auto-restart

**Time required:** ~5-10 minutes

---

## 📝 After Setup: Add Domain DNS

1. **Get your GCP VM IP:**
   ```bash
   gcloud compute instances list
   # Or check in GCP Console → Compute Engine → VM Instances
   ```

2. **Update DNS Records** (in your domain provider):
   - **A Record**: `filmyflyhd.space` → `[YOUR_GCP_IP]`
   - **CNAME Record**: `www.filmyflyhd.space` → `filmyflyhd.space`

3. **Get SSL Certificate:**
   ```bash
   sudo certbot certonly --nginx -d filmyflyhd.space -d www.filmyflyhd.space
   ```
   - Follow prompts and enter your email
   - Certificate auto-renews automatically

4. **Verify everything is working:**
   ```bash
   curl -I https://filmyflyhd.space
   ```

---

## 🔄 Deploy Updates (After Pushing to GitHub)

### Fastest Way (One Command):

```bash
/home/filmyfly/app/deploy.sh
```

**What it does:**
1. Pulls latest code from GitHub
2. Installs dependencies
3. Builds TypeScript
4. Restarts app
5. Clears cache for fresh content

**Time required:** ~2-3 minutes

---

## 📊 Monitor Your Application

### Check Status:
```bash
pm2 status
```

### View Real-Time Logs:
```bash
pm2 logs filmyfly
```

### View Last 50 Lines:
```bash
pm2 logs filmyfly --lines 50
```

### Real-Time Dashboard:
```bash
pm2 monit
```

### System Health Check:
```bash
bash /home/filmyfly/app/scripts/health-check.sh
```

---

## 🔧 Common Commands

### Restart Application:
```bash
pm2 restart filmyfly
```

### Stop Application:
```bash
pm2 stop filmyfly
```

### Start Application:
```bash
pm2 start ecosystem.config.js
```

### Reload Nginx:
```bash
sudo systemctl reload nginx
```

### Clear Nginx Cache:
```bash
sudo rm -rf /var/cache/nginx/filmyfly/*
sudo systemctl reload nginx
```

### Check Memory Usage:
```bash
free -h
# Swap should show 4G
```

### Check Swap Status:
```bash
swapon --show
```

---

## 🎯 Performance Optimization Checklist

✅ **Swap Space** - 4GB configured (prevents crashes)  
✅ **Nginx Caching** - 30 days for static, 30 min for pages  
✅ **Gzip Compression** - CSS/JS compressed automatically  
✅ **PM2 Cluster Mode** - Multiple processes for better CPU usage  
✅ **Connection Pooling** - Prisma handles connection optimization  
✅ **SSL/TLS 1.3** - Fast, secure connections  
✅ **Static Asset Caching** - 1 year cache for images/CSS/JS  

---

## 📈 Expected Performance Metrics

| Metric | Target |
|--------|--------|
| **Page Load Time** | < 500ms (cached) |
| **TTFB** | < 200ms |
| **Cache Hit Rate** | > 80% |
| **Uptime** | 99.5%+ |
| **Memory Usage** | < 500MB (with swap) |
| **CPU Usage** | < 50% (average) |

---

## 🐛 Troubleshooting

### Application Not Running
```bash
pm2 status
pm2 logs filmyfly  # Check errors
pm2 restart filmyfly
```

### 502 Bad Gateway
```bash
# App might be down or restarting
pm2 logs filmyfly
# Wait 10 seconds, then refresh page
```

### Out of Memory
```bash
free -h
# If swap is low, increase it:
sudo fallocate -l 4G /swapfile2
sudo swapon /swapfile2
```

### Slow Response Time
```bash
# Check cache status
curl -I https://filmyflyhd.space | grep X-Cache
# X-Cache-Status: HIT = cached (fast)
# X-Cache-Status: MISS = first load

# Clear cache if needed
sudo rm -rf /var/cache/nginx/filmyfly/*
sudo systemctl reload nginx
```

### SSL Certificate Not Renewing
```bash
sudo certbot renew --dry-run  # Test renewal
sudo certbot renew            # Force renewal if needed
sudo systemctl restart nginx
```

---

## 📚 Detailed Guides

For complete step-by-step documentation, see:
- **[DEPLOYMENT_GCP.md](./DEPLOYMENT_GCP.md)** - Full deployment guide
- **[README.md](./README.md)** - Project documentation

---

## 🔐 Security Best Practices

✅ Never commit `.env` file to Git  
✅ Use strong SESSION_SECRET in `.env`  
✅ Keep Node.js updated: `sudo apt update && sudo apt upgrade`  
✅ Monitor logs regularly for errors  
✅ Use SSH keys for GitHub (not HTTPS)  
✅ Keep SSL certificates renewed (automatic)  

---

## 📞 Support & Resources

### View Application Logs:
```bash
pm2 logs filmyfly --lines 100
```

### View Nginx Access Logs:
```bash
sudo tail -f /var/log/nginx/access.log
```

### View Nginx Error Logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check Uptime:
```bash
pm2 describe filmyfly
```

---

## 💾 Backup Your Database

### Backup to Local File:
```bash
# If using Supabase remote DB
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Automatic Daily Backup (Optional):
```bash
# Add to crontab
crontab -e

# Add this line to backup daily at 2 AM:
0 2 * * * pg_dump $DATABASE_URL > /home/filmyfly/backups/db_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

---

## 🚀 Quick Start Summary

1. **Create GCP VM** → Ubuntu 22.04 LTS, e2-medium, 30GB SSD
2. **Run setup script** → `bash setup-gcp.sh`
3. **Add SSH key to GitHub** (during setup)
4. **Configure DNS** → Point domain to GCP IP
5. **Get SSL cert** → `sudo certbot certonly --nginx ...`
6. **Deploy updates** → Push to GitHub, run `deploy.sh`

**Your site is live in < 15 minutes!** 🎉

---

## 🎬 Workflow After Deployment

### When You Want to Update Your Website:

1. **Make changes locally** on your computer
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Update features"
   git push origin main
   ```

3. **SSH to your GCP server:**
   ```bash
   gcloud compute ssh filmyfly-server --zone=us-central1-a
   ```

4. **Run deployment:**
   ```bash
   /home/filmyfly/app/deploy.sh
   ```

5. **Done!** Your changes are live within 2-3 minutes ✓

---

**Deployment Date:** [Fill with actual date]  
**Domain:** filmyflyhd.space  
**Server:** GCP Compute Engine  
**Database:** Supabase PostgreSQL  
**Uptime:** ___________
