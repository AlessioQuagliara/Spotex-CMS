#!/bin/bash
# Generate Diffie-Hellman parameters for SSL

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DH_FILE="/etc/nginx/dhparam.pem"
DH_SIZE="${DH_SIZE:-2048}"

echo -e "${YELLOW}=== Generating DH Parameters ===${NC}\n"
echo "Size: $DH_SIZE bits"
echo "Output: $DH_FILE"
echo ""

if [ -f "$DH_FILE" ]; then
    echo -e "${YELLOW}DH parameters file already exists${NC}"
    read -p "Overwrite? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi
fi

echo -e "${YELLOW}This will take several minutes...${NC}\n"

openssl dhparam -out "$DH_FILE" "$DH_SIZE"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ DH parameters generated successfully${NC}"
    echo "File: $DH_FILE"
    ls -lh "$DH_FILE"
else
    echo -e "\n${RED}✗ Failed to generate DH parameters${NC}"
    exit 1
fi
