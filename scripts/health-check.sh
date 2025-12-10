#!/bin/bash

################################################################################
# FilmyFly System Health Check
# Check server status, memory, cache, and application health
# Usage: bash health-check.sh
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  FilmyFly System Health Check                              ║${NC}"
echo -e "${BLUE}║  Time: $(date '+%Y-%m-%d %H:%M:%S')                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Application Status
echo -e "${YELLOW}━━━ Application Status ━━━${NC}"
PM2_STATUS=$(pm2 status filmyfly 2>/dev/null)
if echo "$PM2_STATUS" | grep -q "online"; then
    echo -e "${GREEN}✓ Application: RUNNING${NC}"
    pm2 status filmyfly | grep filmyfly
else
    echo -e "${RED}✗ Application: NOT RUNNING${NC}"
fi
echo ""

# Check Memory Usage
echo -e "${YELLOW}━━━ Memory & Swap ━━━${NC}"
free -h
echo ""

# Check Disk Usage
echo -e "${YELLOW}━━━ Disk Usage ━━━${NC}"
df -h /home/filmyfly/app
echo ""

# Check Nginx Status
echo -e "${YELLOW}━━━ Nginx Status ━━━${NC}"
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx: RUNNING${NC}"
    ACTIVE_CONN=$(netstat -an 2>/dev/null | grep -c ESTABLISHED)
    echo "  Active connections: $ACTIVE_CONN"
else
    echo -e "${RED}✗ Nginx: NOT RUNNING${NC}"
fi
echo ""

# Check Cache Usage
echo -e "${YELLOW}━━━ Nginx Cache ━━━${NC}"
CACHE_SIZE=$(du -sh /var/cache/nginx/filmyfly 2>/dev/null | cut -f1)
echo "  Cache size: $CACHE_SIZE"
CACHE_FILES=$(find /var/cache/nginx/filmyfly -type f 2>/dev/null | wc -l)
echo "  Cached files: $CACHE_FILES"
echo ""

# Check Database Connection
echo -e "${YELLOW}━━━ Database Connectivity ━━━${NC}"
if curl -s http://127.0.0.1:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database: CONNECTED${NC}"
else
    echo -e "${RED}✗ Database: CHECK FAILED${NC}"
fi
echo ""

# Recent Errors
echo -e "${YELLOW}━━━ Recent Errors (if any) ━━━${NC}"
ERROR_COUNT=$(pm2 logs filmyfly --err 2>/dev/null | grep -i "error" | wc -l)
if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "${RED}⚠ Found $ERROR_COUNT errors${NC}"
    pm2 logs filmyfly --err --lines 5
else
    echo -e "${GREEN}✓ No errors found${NC}"
fi
echo ""

# Test Response Time
echo -e "${YELLOW}━━━ Response Time Test ━━━${NC}"
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://127.0.0.1:3000/)
echo "  Response time: ${RESPONSE_TIME}s"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Health Check Complete                                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
