#!/bin/bash
# Security Vulnerability Scanner
# Comprehensive security testing suite

set -e

echo "🔒 CMS Security Scanner"
echo "======================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track findings
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0

# 1. Dependency Vulnerability Scanning
echo "📦 Scanning Dependencies for Vulnerabilities..."
echo "----------------------------------------------"

# Backend Python dependencies
if [ -f "backend/requirements.txt" ]; then
    echo "🐍 Checking Python packages..."
    cd backend
    
    # Install safety if not present
    pip install safety --quiet || true
    
    # Run safety check
    if safety check --json > /tmp/safety-report.json 2>/dev/null; then
        echo "${GREEN}✅ No known vulnerabilities in Python packages${NC}"
    else
        VULNERABILITIES=$(cat /tmp/safety-report.json)
        if [ ! -z "$VULNERABILITIES" ]; then
            CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
            echo "${RED}❌ Vulnerabilities found in Python packages:${NC}"
            cat /tmp/safety-report.json | jq '.vulnerabilities[] | "\(.package): \(.vulnerability)"'
        fi
    fi
    
    cd ..
fi

# Frontend npm dependencies
if [ -f "frontend/admin/package.json" ]; then
    echo ""
    echo "📦 Checking npm packages (Admin)..."
    cd frontend/admin
    
    npm audit --json > /tmp/npm-audit-admin.json 2>/dev/null || true
    
    CRITICAL=$(cat /tmp/npm-audit-admin.json | jq '.metadata.vulnerabilities.critical // 0')
    HIGH=$(cat /tmp/npm-audit-admin.json | jq '.metadata.vulnerabilities.high // 0')
    MODERATE=$(cat /tmp/npm-audit-admin.json | jq '.metadata.vulnerabilities.moderate // 0')
    
    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + CRITICAL))
        HIGH_ISSUES=$((HIGH_ISSUES + HIGH))
        echo "${RED}❌ Found $CRITICAL critical and $HIGH high vulnerabilities${NC}"
        echo "Run 'npm audit fix' to resolve"
    else
        echo "${GREEN}✅ No critical vulnerabilities in npm packages${NC}"
    fi
    
    cd ../..
fi

# 2. Static Code Analysis
echo ""
echo "🔍 Running Static Code Analysis..."
echo "----------------------------------------------"

# Bandit for Python
if [ -f "backend/app/main.py" ]; then
    echo "🐍 Scanning Python code with Bandit..."
    cd backend
    
    pip install bandit --quiet || true
    
    if bandit -r app -f json -o /tmp/bandit-report.json 2>/dev/null; then
        echo "${GREEN}✅ No security issues found in Python code${NC}"
    else
        HIGH_COUNT=$(cat /tmp/bandit-report.json | jq '[.results[] | select(.issue_severity == "HIGH")] | length')
        MEDIUM_COUNT=$(cat /tmp/bandit-report.json | jq '[.results[] | select(.issue_severity == "MEDIUM")] | length')
        
        if [ "$HIGH_COUNT" -gt 0 ]; then
            HIGH_ISSUES=$((HIGH_ISSUES + HIGH_COUNT))
            echo "${RED}❌ Found $HIGH_COUNT high severity issues:${NC}"
            cat /tmp/bandit-report.json | jq '.results[] | select(.issue_severity == "HIGH") | "\(.filename):\(.line_number) - \(.issue_text)"'
        fi
        
        if [ "$MEDIUM_COUNT" -gt 0 ]; then
            MEDIUM_ISSUES=$((MEDIUM_ISSUES + MEDIUM_COUNT))
            echo "${YELLOW}⚠️  Found $MEDIUM_COUNT medium severity issues${NC}"
        fi
    fi
    
    cd ..
fi

# ESLint security plugin for JavaScript
if [ -f "frontend/admin/package.json" ]; then
    echo ""
    echo "📦 Scanning JavaScript code..."
    cd frontend/admin
    
    # Install eslint-plugin-security if needed
    npm install --no-save eslint-plugin-security --silent 2>/dev/null || true
    
    # Run ESLint with security rules
    npx eslint . --ext .js,.jsx,.ts,.tsx --format json > /tmp/eslint-report.json 2>/dev/null || true
    
    ERROR_COUNT=$(cat /tmp/eslint-report.json | jq '[.[] | .errorCount] | add // 0')
    WARNING_COUNT=$(cat /tmp/eslint-report.json | jq '[.[] | .warningCount] | add // 0')
    
    if [ "$ERROR_COUNT" -gt 0 ]; then
        HIGH_ISSUES=$((HIGH_ISSUES + ERROR_COUNT))
        echo "${RED}❌ Found $ERROR_COUNT security errors in JavaScript${NC}"
    elif [ "$WARNING_COUNT" -gt 0 ]; then
        echo "${YELLOW}⚠️  Found $WARNING_COUNT warnings in JavaScript${NC}"
    else
        echo "${GREEN}✅ No security issues in JavaScript code${NC}"
    fi
    
    cd ../..
fi

# 3. Secrets Detection
echo ""
echo "🔑 Scanning for Exposed Secrets..."
echo "----------------------------------------------"

# Check for common secret patterns
echo "🔍 Checking for hardcoded secrets..."

# Patterns to search for
PATTERNS=(
    "password\s*=\s*['\"][^'\"]{8,}['\"]"
    "api[_-]?key\s*=\s*['\"][^'\"]+['\"]"
    "secret[_-]?key\s*=\s*['\"][^'\"]+['\"]"
    "aws[_-]?access[_-]?key"
    "private[_-]?key"
    "token\s*=\s*['\"][^'\"]{20,}['\"]"
)

SECRETS_FOUND=0

for pattern in "${PATTERNS[@]}"; do
    MATCHES=$(grep -rEi "$pattern" backend/ frontend/ --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=__pycache__ 2>/dev/null || true)
    
    if [ ! -z "$MATCHES" ]; then
        SECRETS_FOUND=$((SECRETS_FOUND + 1))
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
        echo "${RED}❌ Potential secret found: $pattern${NC}"
        echo "$MATCHES" | head -3
    fi
done

if [ "$SECRETS_FOUND" -eq 0 ]; then
    echo "${GREEN}✅ No exposed secrets detected${NC}"
fi

# 4. Docker Security
echo ""
echo "🐳 Docker Security Scan..."
echo "----------------------------------------------"

if command -v docker &> /dev/null; then
    # Scan Docker images
    if [ -f "backend/Dockerfile" ]; then
        echo "🔍 Scanning backend Dockerfile..."
        
        # Check for common issues
        if grep -q "FROM.*:latest" backend/Dockerfile; then
            MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
            echo "${YELLOW}⚠️  Using 'latest' tag in base image (not recommended)${NC}"
        fi
        
        if ! grep -q "USER" backend/Dockerfile; then
            HIGH_ISSUES=$((HIGH_ISSUES + 1))
            echo "${RED}❌ Running as root user (security risk)${NC}"
        fi
        
        echo "${GREEN}✅ Basic Dockerfile checks complete${NC}"
    fi
else
    echo "${YELLOW}⚠️  Docker not installed, skipping container scans${NC}"
fi

# 5. SSL/TLS Configuration
echo ""
echo "🔐 SSL/TLS Configuration Check..."
echo "----------------------------------------------"

if [ -f "nginx/nginx.conf" ]; then
    echo "🔍 Checking nginx SSL configuration..."
    
    if grep -q "ssl_protocols" nginx/nginx.conf; then
        if grep -q "TLSv1 " nginx/nginx.conf || grep -q "TLSv1.1" nginx/nginx.conf; then
            HIGH_ISSUES=$((HIGH_ISSUES + 1))
            echo "${RED}❌ Weak TLS protocols enabled (TLSv1.0/1.1)${NC}"
        else
            echo "${GREEN}✅ Strong TLS protocols configured${NC}"
        fi
    else
        MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
        echo "${YELLOW}⚠️  No SSL protocols specified${NC}"
    fi
fi

# 6. OWASP Top 10 Checks
echo ""
echo "🛡️  OWASP Top 10 Security Checks..."
echo "----------------------------------------------"

# SQL Injection check
echo "🔍 Checking for SQL injection vulnerabilities..."
SQL_PATTERNS=$(grep -rE "execute\(.*\+.*\)" backend/ --include="*.py" 2>/dev/null || true)
if [ ! -z "$SQL_PATTERNS" ]; then
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    echo "${RED}❌ Potential SQL injection found (string concatenation in queries)${NC}"
else
    echo "${GREEN}✅ No obvious SQL injection vulnerabilities${NC}"
fi

# XSS check
echo "🔍 Checking for XSS vulnerabilities..."
XSS_PATTERNS=$(grep -rE "dangerouslySetInnerHTML|innerHTML\s*=" frontend/ --include="*.tsx" --include="*.jsx" 2>/dev/null || true)
if [ ! -z "$XSS_PATTERNS" ]; then
    HIGH_ISSUES=$((HIGH_ISSUES + 1))
    echo "${YELLOW}⚠️  Potential XSS vulnerability (dangerouslySetInnerHTML usage)${NC}"
else
    echo "${GREEN}✅ No obvious XSS vulnerabilities${NC}"
fi

# CSRF check
echo "🔍 Checking for CSRF protection..."
if grep -rq "csrf" backend/ --include="*.py"; then
    echo "${GREEN}✅ CSRF protection appears to be implemented${NC}"
else
    MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
    echo "${YELLOW}⚠️  No obvious CSRF protection found${NC}"
fi

# 7. Authentication Security
echo ""
echo "🔑 Authentication Security..."
echo "----------------------------------------------"

# Check for weak password hashing
if grep -rq "md5\|sha1" backend/ --include="*.py"; then
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    echo "${RED}❌ Weak password hashing algorithm detected (MD5/SHA1)${NC}"
else
    echo "${GREEN}✅ No weak password hashing detected${NC}"
fi

# Check for bcrypt usage
if grep -rq "bcrypt" backend/ --include="*.py"; then
    echo "${GREEN}✅ Using bcrypt for password hashing${NC}"
else
    MEDIUM_ISSUES=$((MEDIUM_ISSUES + 1))
    echo "${YELLOW}⚠️  bcrypt not found - verify password hashing${NC}"
fi

# 8. Generate Report
echo ""
echo "📊 Security Scan Summary"
echo "========================"
echo ""
echo "Critical Issues: $CRITICAL_ISSUES"
echo "High Issues: $HIGH_ISSUES"
echo "Medium Issues: $MEDIUM_ISSUES"
echo ""

# Save detailed report
REPORT_FILE="security-report-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "CMS Security Scan Report"
    echo "========================"
    echo "Date: $(date)"
    echo ""
    echo "Summary:"
    echo "- Critical Issues: $CRITICAL_ISSUES"
    echo "- High Issues: $HIGH_ISSUES"
    echo "- Medium Issues: $MEDIUM_ISSUES"
    echo ""
    echo "See terminal output for details."
} > "$REPORT_FILE"

echo "📄 Detailed report saved to: $REPORT_FILE"
echo ""

# Exit with error if critical or high issues found
if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    echo "${RED}❌ CRITICAL issues found - immediate action required!${NC}"
    exit 1
elif [ "$HIGH_ISSUES" -gt 0 ]; then
    echo "${YELLOW}⚠️  HIGH severity issues found - please review${NC}"
    exit 1
else
    echo "${GREEN}✅ No critical security issues detected${NC}"
    exit 0
fi
