#!/bin/bash
# Test nginx configuration

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Testing Nginx Configuration ===${NC}\n"

# Test configuration syntax
echo -e "${YELLOW}1. Checking syntax...${NC}"
if nginx -t 2>&1 | tee /tmp/nginx-test.log; then
    echo -e "${GREEN}✓ Syntax is valid${NC}\n"
else
    echo -e "${RED}✗ Syntax errors found${NC}\n"
    cat /tmp/nginx-test.log
    exit 1
fi

# Check for common issues
echo -e "${YELLOW}2. Checking for common issues...${NC}"

# Check SSL certificates
if grep -r "ssl_certificate" /etc/nginx/ | grep -v "#" > /tmp/ssl-certs.txt; then
    while IFS= read -r line; do
        cert_path=$(echo "$line" | awk '{print $2}' | tr -d ';')
        if [ -f "$cert_path" ]; then
            echo -e "${GREEN}✓ Certificate exists: $cert_path${NC}"
        else
            echo -e "${RED}✗ Certificate not found: $cert_path${NC}"
        fi
    done < /tmp/ssl-certs.txt
else
    echo -e "${YELLOW}⚠ No SSL certificates configured${NC}"
fi
echo ""

# Check upstream servers
echo -e "${YELLOW}3. Checking upstream servers...${NC}"
if grep -r "upstream" /etc/nginx/nginx.conf | grep -v "#"; then
    echo -e "${GREEN}✓ Upstream servers configured${NC}"
else
    echo -e "${YELLOW}⚠ No upstream servers found${NC}"
fi
echo ""

# Check cache directories
echo -e "${YELLOW}4. Checking cache directories...${NC}"
if grep -r "proxy_cache_path" /etc/nginx/nginx.conf | grep -v "#" > /tmp/cache-paths.txt; then
    while IFS= read -r line; do
        cache_path=$(echo "$line" | awk '{print $2}')
        if [ -d "$cache_path" ]; then
            echo -e "${GREEN}✓ Cache directory exists: $cache_path${NC}"
        else
            echo -e "${YELLOW}⚠ Cache directory not found: $cache_path (will be created on start)${NC}"
        fi
    done < /tmp/cache-paths.txt
else
    echo -e "${YELLOW}⚠ No cache paths configured${NC}"
fi
echo ""

# Check enabled sites
echo -e "${YELLOW}5. Enabled sites:${NC}"
if [ -d /etc/nginx/sites-enabled ]; then
    ls -l /etc/nginx/sites-enabled/ | grep "^l" | awk '{print "  - " $9}' || echo "  No sites enabled"
else
    echo -e "${YELLOW}  sites-enabled directory not found${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}=== Configuration Test Complete ===${NC}"
echo -e "${YELLOW}To reload nginx: nginx -s reload${NC}"
echo -e "${YELLOW}To restart nginx: systemctl restart nginx${NC}"

# Cleanup
rm -f /tmp/nginx-test.log /tmp/ssl-certs.txt /tmp/cache-paths.txt
