#!/bin/bash
# Disable nginx site configuration

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <site-name>${NC}"
    echo -e "${YELLOW}Enabled sites:${NC}"
    ls -1 /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites enabled"
    exit 1
fi

SITE=$1
ENABLED="/etc/nginx/sites-enabled/$SITE"

# Check if site is enabled
if [ ! -L "$ENABLED" ]; then
    echo -e "${YELLOW}Site not enabled: $SITE${NC}"
    exit 0
fi

# Remove symlink
rm -f "$ENABLED"
echo -e "${GREEN}✓ Disabled site: $SITE${NC}"

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
    exit 1
fi
