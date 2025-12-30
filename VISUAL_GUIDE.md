# 📸 FilmyFly GCP Deployment - Visual Step-by-Step Guide

## Overview: What You're Building

```
Your Local Computer
       ↓ (git push)
   GitHub Repo (Private)
       ↓ (SSH Pull)
   GCP Server (Ubuntu)
       ├─ Node.js Application (Port 3000)
       ├─ Nginx Reverse Proxy (Ports 80/443)
       └─ Swap Space (Memory Buffer)
           ↓
   Supabase Database
```

---

## Step-by-Step Deployment Process

### **STEP 1: Create GCP Virtual Machine** (5 minutes)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Go to: https://console.cloud.google.com                 │
│ 2. Select or Create a Project                              │
│ 3. Go to: Compute Engine → VM Instances                    │
│ 4. Click: "CREATE INSTANCE"                                │
│                                                             │
│ Configuration:                                             │
│ ├─ Instance name: filmyfly-server                          │
│ ├─ Machine type: e2-medium (2 vCPU, 4GB RAM)              │
│ ├─ Boot disk: Ubuntu 22.04 LTS                            │
│ ├─ Boot disk size: 30 GB (SSD)                            │
│ ├─ Region: us-central1 (your choice)                      │
│ ├─ Firewall:                                              │
│ │  ✓ Allow HTTP traffic                                   │
│ │  ✓ Allow HTTPS traffic                                  │
│ └─ Click: CREATE                                           │
│                                                             │
│ ⏱️  Wait 2-3 minutes for VM to start...                   │
└─────────────────────────────────────────────────────────────┘
```

### **STEP 2: Reserve Static IP Address** (2 minutes)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. In Compute Engine → VM Instances                        │
│ 2. Click on your VM (filmyfly-server)                      │
│ 3. Go to: Networking tab                                  │
│ 4. Under "External IP" → Click the dropdown               │
│ 5. Select: "Reserve static address"                       │
│ 6. Name: filmyfly-static-ip                               │
│ 7. Click: RESERVE                                          │
│                                                             │
│ Result: Your IP is now permanent                          │
│ Example: 35.192.245.123                                   │
│                                                             │
│ 💾 Save this IP - you'll need it for DNS!                │
└─────────────────────────────────────────────────────────────┘
```

### **STEP 3: Connect to Your Server** (2 minutes)

```
Option A: GCP Cloud Shell (Easiest)
┌─────────────────────────────────────┐
│ 1. Click SSH button next to VM name │
│ 2. A terminal opens in browser      │
│ 3. You're logged in as default user │
│                                     │
│ Then run:                           │
│ sudo su                             │
│ (become root for setup)             │
└─────────────────────────────────────┘

Option B: Local Terminal (If you prefer)
┌─────────────────────────────────────────┐
│ gcloud compute ssh filmyfly-server \    │
│   --zone=us-central1-a                  │
└─────────────────────────────────────────┘
```

### **STEP 4: Run Automated Setup Script** (10 minutes)

```
┌───────────────────────────────────────────────────────────────┐
│ On your GCP VM terminal, run:                                 │
│                                                               │
│ bash setup-gcp.sh                                            │
│                                                               │
│ This script will:                                            │
│ ✓ Update system packages                                     │
│ ✓ Add 4GB swap space                                         │
│ ✓ Create 'filmyfly' user                                     │
│ ✓ Install Node.js 20                                         │
│ ✓ Install PM2 (app manager)                                  │
│ ✓ Install Nginx (web server)                                 │
│ ✓ Install Certbot (SSL)                                      │
│ ✓ Generate GitHub SSH key                                    │
│ ✓ Clone your repo                                            │
│ ✓ Install dependencies                                       │
│ ✓ Build the app                                              │
│ ✓ Start the application                                      │
│                                                               │
│ During setup, you'll see:                                    │
│ ✓ A GitHub SSH public key                                    │
│ ✓ Copy it and add to GitHub SSH keys                        │
│                                                               │
│ ⏱️  Takes ~10 minutes                                        │
│                                                               │
│ Watch for messages:                                          │
│ [1/12] Updating system...                                   │
│ [2/12] Creating swap...                                     │
│ ... (continues through all 12 steps)                        │
│ [12/12] Configuring PM2 and Nginx...                        │
│                                                               │
│ When done: ✅ Setup Completed!                              │
└───────────────────────────────────────────────────────────────┘
```

### **STEP 5: Add SSH Key to GitHub** (3 minutes)

```
During setup, you'll see output like:

┌─────────────────────────────────────────────┐
│ ✓ GitHub SSH key generated                  │
│ Add this SSH key to GitHub Settings         │
│ https://github.com/settings/keys            │
│                                             │
│ Copy the key below:                         │
│                                             │
│ ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... │
│ filmyfly@filmyflyhd.space                   │
└─────────────────────────────────────────────┘

Now do this:

1. Open: https://github.com/settings/keys
2. Click: "New SSH key"
3. Title: GCP Server
4. Key type: Authentication Key
5. Paste the SSH key
6. Click: Add SSH key
7. Back to terminal, press Enter to continue
```

### **STEP 6: Configure Domain DNS** (Immediate, takes 5-30 min to propagate)

```
┌─────────────────────────────────────────────────────────────┐
│ After setup completes, you need to point your domain        │
│                                                             │
│ 1. Get your GCP static IP                                  │
│    └─ From Compute Engine → VM Instances → External IP    │
│    └─ Example: 35.192.245.123                             │
│                                                             │
│ 2. Go to your domain registrar                             │
│    (GoDaddy, Namecheap, domain.com, etc.)                 │
│                                                             │
│ 3. Find DNS Management                                     │
│                                                             │
│ 4. Add/Edit DNS Records:                                   │
│                                                             │
│    ┌──────────────────────────────────────┐                │
│    │ Type  │ Name                  │ Value │                │
│    ├──────────────────────────────────────┤                │
│    │ A     │ filmyflyhd.space      │ IP   │  ← Your IP    │
│    │ CNAME │ www                   │ @    │                │
│    └──────────────────────────────────────┘                │
│                                                             │
│ 5. Save changes                                            │
│ 6. Wait 5-30 minutes for DNS to propagate                 │
│ 7. Test: ping filmyflyhd.space                            │
│                                                             │
│ ✅ When ping works, DNS is ready!                          │
└─────────────────────────────────────────────────────────────┘
```

### **STEP 7: Get SSL Certificate** (2 minutes)

```
Back on your GCP server terminal:

┌─────────────────────────────────────────────────────────────┐
│ $ sudo certbot certonly --nginx \                          │
│     -d filmyflyhd.space \                                  │
│     -d www.filmyflyhd.space                                │
│                                                             │
│ Follow the prompts:                                        │
│ ├─ Email: your-email@example.com                          │
│ ├─ Agree to terms: Y                                      │
│ ├─ Share email: Y or N (optional)                         │
│ └─ Wait for verification...                               │
│                                                             │
│ Success message:                                          │
│ Congratulations! Your certificate is saved at:            │
│ /etc/letsencrypt/live/filmyflyhd.space/                   │
│                                                             │
│ Auto-renewal configured: Yes ✓                            │
└─────────────────────────────────────────────────────────────┘
```

### **STEP 8: Verify Everything Works** (5 minutes)

```
┌─────────────────────────────────────────────────────────────┐
│ Test 1: Check application is running                       │
│ $ pm2 status                                               │
│                                                             │
│ Should show:                                               │
│ ┌────────────────────────────────────┐                     │
│ │ id  │ name    │ status  │ ↺ │ CPU  │ MEM   │            │
│ ├────────────────────────────────────┤                     │
│ │ 0   │ filmyfly│ online  │ 0 │ 0%   │ 50MB  │            │
│ │ 1   │ filmyfly│ online  │ 0 │ 0%   │ 48MB  │            │
│ └────────────────────────────────────┘                     │
│                                                             │
│ Test 2: Check website loads                               │
│ $ curl https://filmyflyhd.space                            │
│ Should return HTML content (no errors)                     │
│                                                             │
│ Test 3: Open browser                                       │
│ https://filmyflyhd.space                                   │
│ Should see your website with green lock icon ✓             │
│                                                             │
│ Test 4: Check cache is working                            │
│ $ curl -I https://filmyflyhd.space | grep X-Cache         │
│                                                             │
│ First time:  X-Cache-Status: MISS                          │
│ Next time:   X-Cache-Status: HIT  (fast!)                  │
│                                                             │
│ Test 5: Check system resources                            │
│ $ free -h                                                  │
│                                                             │
│ Should show:                                               │
│ Swap: 4.0G total (you have backup memory)                 │
│                                                             │
│ ✅ All tests pass = You're live!                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Now Your Website is LIVE! 🎉

```
filmyflyhd.space is online and running!

┌─────────────────────────────────────┐
│  Your Deployment Summary:           │
├─────────────────────────────────────┤
│  Domain: filmyflyhd.space           │
│  Server: GCP e2-medium              │
│  Location: us-central1              │
│  Cache: Ultra-fast (30min pages)   │
│  SSL: Let's Encrypt (auto-renew)   │
│  Uptime: 99.5%+ expected            │
│  Memory: 4GB + 4GB swap            │
│  Performance: < 200ms cached        │
└─────────────────────────────────────┘
```

---

## Your New Workflow: How to Update Website

### When you want to make changes:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│ 1. Make changes on your local computer                      │
│    Edit your files in VS Code, etc.                         │
│                                                              │
│ 2. Commit to Git                                            │
│    $ git add .                                              │
│    $ git commit -m "Update features"                        │
│                                                              │
│ 3. Push to GitHub                                           │
│    $ git push origin main                                   │
│                                                              │
│ 4. SSH to your server (3 options):                         │
│                                                              │
│    Option A: GCP Cloud Shell                               │
│    ├─ Go to https://console.cloud.google.com              │
│    ├─ Click SSH on your VM                                │
│    └─ You're connected                                     │
│                                                              │
│    Option B: Local terminal                                │
│    └─ $ gcloud compute ssh filmyfly-server                │
│                                                              │
│    Option C: Use any SSH client                            │
│    └─ $ ssh -i yourkey.pem [user]@[IP]                   │
│                                                              │
│ 5. Run deployment script (ONE COMMAND!)                    │
│    $ /home/filmyfly/app/deploy.sh                          │
│                                                              │
│    This automatically:                                     │
│    ├─ Pulls latest code                                    │
│    ├─ Installs dependencies                                │
│    ├─ Builds TypeScript                                    │
│    ├─ Restarts the app                                     │
│    ├─ Clears cache                                         │
│    └─ Reloads Nginx                                        │
│                                                              │
│ 6. Done! ✅                                                 │
│    Your changes are LIVE in 2-3 minutes                    │
│                                                              │
│ 7. Verify deployment                                       │
│    $ pm2 status              (check app is running)        │
│    $ pm2 logs filmyfly       (check for errors)            │
│    Open https://filmyflyhd.space (see your changes)       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Example deployment:

```
$ /home/filmyfly/app/deploy.sh

╔════════════════════════════════════════════════════════════╗
║  FilmyFly Deployment Starting...                           ║
╚════════════════════════════════════════════════════════════╝

[1/5] Pulling latest code from GitHub...
From github.com:kailashsur/filmyfly.work
 * branch            main       -> FETCH_HEAD
   abc1234..def5678  main       -> origin/main
✓ Code updated

[2/5] Installing dependencies...
npm notice...
added XX packages
✓ Dependencies installed

[3/5] Building TypeScript...
Successfully compiled 45 files
✓ Build successful

[4/5] Restarting application and clearing cache...
[PM2] Restarting app...
✓ Application restarted

[5/5] Clearing Nginx cache...
rm: removing directory '/var/cache/nginx/filmyfly/*'
✓ Nginx reloaded

╔════════════════════════════════════════════════════════════╗
║  Deployment Completed Successfully! ✓                     ║
║  Website: https://filmyflyhd.space                        ║
╚════════════════════════════════════════════════════════════╝

Application Status:
id│name    │status │↺ │CPU│MEM
0 │filmyfly│online │0 │0% │50MB
1 │filmyfly│online │0 │1% │49MB

Recent Logs (last 10 lines):
[PM2] Restarting filmyfly
[PM2] App [filmyfly:0] exited with code 0
[PM2] App [filmyfly:0] started successfully
[PM2] App [filmyfly:1] exited with code 0
[PM2] App [filmyfly:1] started successfully
```

---

## Quick Reference: Commands You'll Use

```
┌─────────────────────────────────────────────────────┐
│ DEPLOYMENT                                          │
├─────────────────────────────────────────────────────┤
│ Deploy updates:  /home/filmyfly/app/deploy.sh      │
│ Check status:    pm2 status                         │
│ View logs:       pm2 logs filmyfly                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ MANAGEMENT                                          │
├─────────────────────────────────────────────────────┤
│ Restart app:     pm2 restart filmyfly               │
│ Stop app:        pm2 stop filmyfly                  │
│ Start app:       pm2 start ecosystem.config.js      │
│ Reload Nginx:    sudo systemctl reload nginx        │
│ Clear cache:     sudo rm -rf /var/cache/nginx/*     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ MONITORING                                          │
├─────────────────────────────────────────────────────┤
│ Memory usage:    free -h                            │
│ Disk usage:      df -h                              │
│ Real-time dash:  pm2 monit                          │
│ Health check:    bash scripts/health-check.sh       │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting Quick Guide

```
┌────────────────────────────────────────────────────────┐
│ Problem: Website shows "502 Bad Gateway"               │
├────────────────────────────────────────────────────────┤
│ Solution:                                              │
│ $ pm2 logs filmyfly          (see what's wrong)       │
│ $ pm2 restart filmyfly        (restart the app)       │
│ Wait 10 seconds, then refresh browser                 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Problem: Very slow loading (>5 seconds)                │
├────────────────────────────────────────────────────────┤
│ Solution:                                              │
│ $ sudo rm -rf /var/cache/nginx/filmyfly/*            │
│ $ sudo systemctl reload nginx                         │
│ This clears the cache for a fresh load                │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Problem: Server runs out of memory                      │
├────────────────────────────────────────────────────────┤
│ Solution:                                              │
│ $ free -h                     (check swap usage)      │
│ Swap is your backup - should be working               │
│ If still out: Increase instance size (e2-standard)   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Problem: SSL certificate shows error                   │
├────────────────────────────────────────────────────────┤
│ Solution:                                              │
│ $ sudo certbot renew                (renew cert)      │
│ Wait 1-2 minutes, refresh browser                     │
│ (Auto-renewal happens daily, you shouldn't need this) │
└────────────────────────────────────────────────────────┘
```

---

## Success Checklist

After deployment, verify:

```
✅ GCP VM created and running
✅ Static IP assigned and saved
✅ DNS records configured (A and CNAME)
✅ DNS propagated (ping works)
✅ SSL certificate installed
✅ Website accessible at https://filmyflyhd.space
✅ Displays green lock icon (secure)
✅ Pages load in < 1 second
✅ PM2 shows "online" status
✅ Cache hit rate > 80%
✅ Nginx serving without errors
✅ Database connection working
✅ Application logs show no errors
✅ Email verified for SSL auto-renewal
✅ Swap space is 4GB

🎉 You're LIVE! Congratulations! 🎉
```

---

**Total Setup Time: ~30-45 minutes**

From creating VM to full production deployment!

That's it! Your website is now live, fast, and production-ready! 🚀
