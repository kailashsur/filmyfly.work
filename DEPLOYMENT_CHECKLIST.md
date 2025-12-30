# 📋 FilmyFly GCP Deployment Checklist

## Pre-Deployment (Local Machine)

- [ ] Code is committed to GitHub
- [ ] All environment variables documented
- [ ] Tests pass locally
- [ ] `.env` is in `.gitignore` (never commit secrets!)
- [ ] Build runs successfully: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## GCP VM Setup (One-Time)

- [ ] **VM Created**
  - [ ] Machine type: e2-medium (2 vCPU, 4GB RAM)
  - [ ] OS: Ubuntu 22.04 LTS
  - [ ] Disk: 30GB SSD
  - [ ] Region: us-central1 (or closest to users)
  - [ ] Static IP assigned

- [ ] **Network & Security**
  - [ ] Allow HTTP traffic (port 80)
  - [ ] Allow HTTPS traffic (port 443)
  - [ ] SSH access enabled

- [ ] **SSH Connection**
  - [ ] Can connect via `gcloud compute ssh`
  - [ ] Or via GCP Console browser SSH

---

## Automated Setup (Run Once)

- [ ] **Download and run setup script**
  ```bash
  bash setup-gcp.sh
  ```

- [ ] **Setup automatically handles:**
  - [ ] System updates
  - [ ] 4GB swap space created
  - [ ] Dedicated `filmyfly` user created
  - [ ] Node.js 20 installed
  - [ ] PM2 installed and configured
  - [ ] Nginx installed
  - [ ] PostgreSQL client installed
  - [ ] GitHub SSH key generated
  - [ ] Repository cloned
  - [ ] Dependencies installed
  - [ ] Application built
  - [ ] PM2 configured for auto-start
  - [ ] Nginx caching configured

---

## Post-Setup Configuration

- [ ] **GitHub SSH Key Added**
  - [ ] SSH public key copied from setup output
  - [ ] Added to GitHub Settings → SSH Keys
  - [ ] Tested: `ssh -T git@github.com`

- [ ] **Domain & DNS**
  - [ ] GCP static IP obtained
  - [ ] A record: `filmyflyhd.space` → `[IP]`
  - [ ] CNAME record: `www.filmyflyhd.space` → `filmyflyhd.space`
  - [ ] DNS propagated (wait 5-30 min)
  - [ ] Verified: `nslookup filmyflyhd.space`

- [ ] **SSL Certificate**
  - [ ] Certbot installed (via setup script)
  - [ ] Certificate obtained: `sudo certbot certonly --nginx ...`
  - [ ] Accepts LetEncrypt terms
  - [ ] Certificate located: `/etc/letsencrypt/live/filmyflyhd.space/`
  - [ ] Auto-renewal enabled: `sudo systemctl enable certbot.timer`

- [ ] **Environment Configuration**
  - [ ] `.env` file created on server
  - [ ] `DATABASE_URL` set correctly
  - [ ] `SESSION_SECRET` set to strong value
  - [ ] Firebase keys added (if using)
  - [ ] File permissions: `chmod 600 .env`

---

## Application Verification

- [ ] **Application Running**
  - [ ] PM2 status shows "online": `pm2 status`
  - [ ] Check logs: `pm2 logs filmyfly --lines 20`
  - [ ] Response time acceptable

- [ ] **Web Accessibility**
  - [ ] HTTP → HTTPS redirect works
  - [ ] HTTPS connection succeeds
  - [ ] SSL certificate valid (green lock)
  - [ ] SSL grade A+ via SSL Labs
  - [ ] Home page loads

- [ ] **Caching Working**
  - [ ] Response header shows cache: `curl -I https://filmyflyhd.space`
  - [ ] First request: `X-Cache-Status: MISS`
  - [ ] Second request: `X-Cache-Status: HIT`
  - [ ] Cache size growing: `du -sh /var/cache/nginx/filmyfly/`

- [ ] **Performance**
  - [ ] Load time < 1s (first visit)
  - [ ] Load time < 200ms (cached)
  - [ ] Cache hit rate > 80%

---

## Monitoring & Maintenance

- [ ] **Logging Setup**
  - [ ] Application logs: `/home/filmyfly/app/logs/`
  - [ ] Nginx logs: `/var/log/nginx/`
  - [ ] Log rotation configured

- [ ] **Backups**
  - [ ] Database backup script tested
  - [ ] Backup location: `/home/filmyfly/backups/`
  - [ ] Cron job scheduled for daily backups (optional)

- [ ] **Monitoring**
  - [ ] Can check status: `pm2 status`
  - [ ] Can view logs: `pm2 logs filmyfly`
  - [ ] Health check works: `/health` endpoint responsive
  - [ ] Memory/swap monitoring set up

---

## Deployment Workflow Ready

- [ ] **Deploy Script**
  - [ ] Located: `/home/filmyfly/app/deploy.sh`
  - [ ] Is executable: `chmod +x`
  - [ ] Tested once successfully

- [ ] **Update Process**
  - [ ] Push changes to GitHub
  - [ ] SSH to server
  - [ ] Run: `/home/filmyfly/app/deploy.sh`
  - [ ] Takes ~2-3 minutes

---

## Security Checklist

- [ ] **Secrets & Credentials**
  - [ ] `.env` file NOT in Git
  - [ ] `.env` permissions: `600` (owner read/write only)
  - [ ] SSH key on server has proper permissions: `700` for directory, `600` for keys
  - [ ] No sensitive data in logs

- [ ] **User Permissions**
  - [ ] `filmyfly` user is non-sudo
  - [ ] Only necessary services are running
  - [ ] Root user not used for app operations

- [ ] **Firewall & Network**
  - [ ] Only needed ports open (80, 443, 22)
  - [ ] SSH uses key-based auth (not password)
  - [ ] Rate limiting could be added (optional)

- [ ] **Updates**
  - [ ] System updates schedule set (weekly auto-updates)
  - [ ] Node.js security patches monitored
  - [ ] SSL certificates auto-renew (certbot.timer)

---

## Optional Enhancements (Post-Deployment)

- [ ] **CI/CD Pipeline**
  - [ ] GitHub Actions workflow created
  - [ ] Auto-deploy on push to main branch

- [ ] **Advanced Monitoring**
  - [ ] PM2 Plus (paid, for advanced monitoring)
  - [ ] Email alerts for crashes
  - [ ] Performance monitoring dashboard

- [ ] **Additional Swap**
  - [ ] If memory issues occur, add more swap
  - [ ] Current: 4GB (sufficient for most cases)

- [ ] **Database Optimization**
  - [ ] Query optimization if slow
  - [ ] Index review on frequently queried fields
  - [ ] Connection pooling tuning

- [ ] **CDN Integration (Optional)**
  - [ ] CloudFlare for additional caching
  - [ ] Faster global content delivery
  - [ ] DDoS protection

---

## Troubleshooting Reference

If any step fails, check:

1. **Setup script failed**
   - Run individual steps manually
   - Check system logs: `journalctl -xe`

2. **Application won't start**
   - Check logs: `pm2 logs filmyfly`
   - Verify `.env` file exists with correct values
   - Check database connection: `psql $DATABASE_URL`

3. **SSL certificate fails**
   - Ensure domain DNS is pointing to server
   - Ensure HTTP port 80 is accessible
   - Check certbot logs: `sudo journalctl -u certbot.service`

4. **Deployment script fails**
   - Check GitHub SSH access: `ssh -T git@github.com`
   - Verify repo URL is correct
   - Check git logs: `git log --oneline`

5. **Slow performance**
   - Check cache status: `curl -I https://filmyflyhd.space | grep X-Cache`
   - Clear cache if needed: `sudo rm -rf /var/cache/nginx/filmyfly/*`
   - Monitor resources: `free -h`, `htop`

---

## Deployment Dates

- **Initial Setup Date:** _______________
- **First Deployment Date:** _______________
- **Last Maintenance Date:** _______________
- **Certificate Renewal Date:** _______________

---

## Contact & Support

- **Server Admin:** _______________________
- **GitHub Repo:** kailashsur/filmyfly.work
- **Domain:** filmyflyhd.space
- **Backup Contact:** _______________________

---

**Status:** ✅ Ready for Production

**Date Completed:** _______________

**Sign-off:** _______________

---

For detailed instructions, see:
- [DEPLOYMENT_GCP.md](./DEPLOYMENT_GCP.md) - Full guide
- [QUICK_START_GCP.md](./QUICK_START_GCP.md) - Quick reference
