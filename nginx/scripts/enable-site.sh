#!/bin/bash
# Enable nginx site configuration

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <site-name>${NC}"
    echo -e "${YELLOW}Available sites:${NC}"
    ls -1 /etc/nginx/sites-available/ 2>/dev/null || ls -1 nginx/sites-available/
    exit 1
fi

SITE=$1
AVAILABLE="/etc/nginx/sites-available/$SITE"
ENABLED="/etc/nginx/sites-enabled/$SITE"

# Check if site exists
if [ ! -f "$AVAILABLE" ]; then
    echo -e "${RED}Site configuration not found: $AVAILABLE${NC}"
    exit 1
fi

# Create sites-enabled directory if not exists
mkdir -p /etc/nginx/sites-enabled

# Create symlink
if [ -L "$ENABLED" ]; then
    echo -e "${YELLOW}Site already enabled: $SITE${NC}"
else
    ln -s "$AVAILABLE" "$ENABLED"
    echo -e "${GREEN}✓ Enabled site: $SITE${NC}"
fi

# Test nginx configuration
echo -e "${YELLOW}Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Configuration is valid${NC}"
    
    # Reload nginx
    echo -e "${YELLOW}Reloading nginx...${NC}"
    nginx -s reload
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${RED}✗ Configuration test failed${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    rm -f "$ENABLED"
    exit 1
fi
