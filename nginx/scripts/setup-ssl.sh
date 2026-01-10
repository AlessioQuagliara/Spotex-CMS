#!/bin/bash
# Setup SSL certificates with Let's Encrypt for Spotex CMS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Spotex CMS SSL Setup ===${NC}\n"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}" 
   exit 1
fi

# Configuration
EMAIL="${SSL_EMAIL:-admin@spotex.com}"
STAGING="${STAGING:-0}"
DOMAINS="${DOMAINS:-api.spotex.com,dashboard.spotex.com}"

echo -e "${YELLOW}Configuration:${NC}"
echo "Email: $EMAIL"
echo "Domains: $DOMAINS"
echo "Staging: $STAGING"
echo ""

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing certbot...${NC}"
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Generate DH parameters if not exist
if [ ! -f /etc/nginx/dhparam.pem ]; then
    echo -e "${YELLOW}Generating DH parameters (this may take a while)...${NC}"
    openssl dhparam -out /etc/nginx/dhparam.pem 2048
fi

# Create webroot for ACME challenge
mkdir -p /var/www/certbot

# Function to obtain certificate
obtain_certificate() {
    local domain=$1
    local staging_flag=""
    
    if [ "$STAGING" = "1" ]; then
        staging_flag="--staging"
    fi
    
    echo -e "${YELLOW}Obtaining certificate for $domain...${NC}"
    
    certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        $staging_flag \
        -d "$domain" \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Certificate obtained for $domain${NC}"
    else
        echo -e "${RED}✗ Failed to obtain certificate for $domain${NC}"
        return 1
    fi
}

# Obtain wildcard certificate for *.spotex.com
obtain_wildcard_certificate() {
    local staging_flag=""
    
    if [ "$STAGING" = "1" ]; then
        staging_flag="--staging"
    fi
    
    echo -e "${YELLOW}Obtaining wildcard certificate for *.spotex.com...${NC}"
    echo -e "${YELLOW}Note: This requires DNS-01 challenge. You'll need to add TXT records.${NC}"
    
    certbot certonly \
        --manual \
        --preferred-challenges dns \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        $staging_flag \
        -d "*.spotex.com" \
        -d "spotex.com" \
        --non-interactive || {
        echo -e "${RED}Wildcard certificate requires manual DNS verification.${NC}"
        echo -e "${YELLOW}Run manually: certbot certonly --manual --preferred-challenges dns -d '*.spotex.com' -d 'spotex.com'${NC}"
    }
}

# Obtain certificates for each domain
IFS=',' read -ra DOMAIN_ARRAY <<< "$DOMAINS"
for domain in "${DOMAIN_ARRAY[@]}"; do
    obtain_certificate "$domain"
done

# Obtain wildcard certificate
obtain_wildcard_certificate

# Setup auto-renewal
echo -e "${YELLOW}Setting up auto-renewal...${NC}"

# Create renewal hook
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'EOF'
#!/bin/bash
nginx -t && nginx -s reload
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# Add cron job if not exists
if ! crontab -l | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook '/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh'") | crontab -
    echo -e "${GREEN}✓ Auto-renewal cron job added${NC}"
fi

# Test nginx configuration
echo -e "${YELLOW}Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
    
    echo -e "${YELLOW}Reloading nginx...${NC}"
    nginx -s reload
    echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
    echo -e "${RED}✗ Nginx configuration test failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}=== SSL Setup Complete ===${NC}"
echo -e "${YELLOW}Certificate locations:${NC}"
for domain in "${DOMAIN_ARRAY[@]}"; do
    echo "  - /etc/letsencrypt/live/$domain/"
done
echo -e "\n${YELLOW}Auto-renewal is configured to run daily at 3 AM${NC}"
echo -e "${YELLOW}Test renewal: certbot renew --dry-run${NC}"
