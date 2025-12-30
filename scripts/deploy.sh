#!/bin/bash

################################################################################
# FilmyFly Quick Deployment Script
# Pulls latest code, rebuilds, and restarts the application
# Run this after pushing changes to GitHub
# Usage: bash deploy.sh
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="/home/filmyfly/app"

echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  FilmyFly Deployment Starting...                           ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd $APP_DIR

# Step 1: Fetch latest code
echo -e "${YELLOW}[1/5] Pulling latest code from GitHub...${NC}"
git fetch origin main
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Git pull failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
npm install --production
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ npm install failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Build application
echo -e "${YELLOW}[3/5] Building TypeScript...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Step 4: Generate Prisma Client
echo -e "${YELLOW}[4/5] Generating Prisma Client...${NC}"
npm run prisma:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Step 5: Restart application
echo -e "${YELLOW}[5/5] Restarting application and clearing cache...${NC}"
pm2 restart filmyfly
pm2 save

# Clear Nginx cache for fresh content
sudo rm -rf /var/cache/nginx/filmyfly/*
sudo systemctl reload nginx

echo -e "${GREEN}✓ Application restarted${NC}"
echo ""

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Completed Successfully! ✓                     ║${NC}"
echo -e "${GREEN}║  Website: https://filmyflyhd.space                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show status
echo -e "${YELLOW}Application Status:${NC}"
pm2 status filmyfly
echo ""

# Show recent logs
echo -e "${YELLOW}Recent Logs (last 10 lines):${NC}"
pm2 logs filmyfly --lines 10
