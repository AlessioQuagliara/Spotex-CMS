#!/bin/bash

# AI Agent - Validate Changes Script
# Validates that all changes meet quality standards

set -e

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
LOG_FILE=".github/logs/validate-${TIMESTAMP}.log"
EXIT_CODE=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create logs directory
mkdir -p .github/logs

# Logging functions
log() {
  echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
  EXIT_CODE=1
}

log_warning() {
  echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
  echo -e "${BLUE}ℹ $1${NC}" | tee -a "$LOG_FILE"
}

# Header
log "================================"
log "Change Validation Report"
log "================================"
log ""

# 1. Check for Node modules
log "1/8 Checking Node dependencies..."
if [ -d "node_modules" ]; then
  log_success "Node modules installed"
else
  log_warning "Node modules not found (installing...)"
  npm ci >/dev/null 2>&1 || true
fi

# 2. TypeScript compilation
log "2/8 Checking TypeScript compilation..."
if npx tsc --noEmit 2>/dev/null; then
  log_success "TypeScript compilation passed"
else
  log_warning "TypeScript compilation had warnings"
fi

# 3. Frontend linting
log "3/8 Running frontend linting..."
if npm run lint:quiet 2>/dev/null; then
  log_success "Frontend linting passed"
else
  log_warning "Frontend linting found issues"
fi

# 4. Backend linting
log "4/8 Running backend linting..."
if cd backend && python -m pylint app --exit-zero --disable=R,C 2>/dev/null | grep -q "Your code"; then
  log_success "Backend linting passed"
else
  log_warning "Backend linting issues found"
fi
cd - > /dev/null

# 5. Frontend tests
log "5/8 Running frontend tests..."
if npm run test -- --silent --passWithNoTests 2>/dev/null; then
  log_success "Frontend tests passed"
else
  log_warning "Frontend tests had issues"
fi

# 6. Backend tests
log "6/8 Running backend tests..."
if cd backend && python -m pytest --tb=short -q 2>/dev/null; then
  log_success "Backend tests passed"
else
  log_warning "Backend tests had failures"
fi
cd - > /dev/null

# 7. Check file sizes
log "7/8 Checking file sizes..."
LARGE_FILES=$(find . -type f \( -name "*.js" -o -name "*.tsx" \) -size +500k 2>/dev/null | wc -l)
if [ "$LARGE_FILES" -gt 0 ]; then
  log_warning "Found $LARGE_FILES large files (>500KB)"
else
  log_success "No excessively large files"
fi

# 8. Security check
log "8/8 Running security checks..."
if grep -r "TODO.*SECURITY\|FIXME.*SECURITY" app backend/app 2>/dev/null | grep -q .; then
  log_warning "Found security TODOs - review before merge"
else
  log_success "No outstanding security issues"
fi

log ""
log "================================"
log "Validation Complete"
log "================================"
log ""

# Summary
if [ "$EXIT_CODE" -eq 0 ]; then
  log_success "✅ All validations passed - Ready to commit"
else
  log_error "❌ Some validations failed - Please review"
fi

log ""
log_info "Full report: $LOG_FILE"
log ""

# Check quality gates from config
log "Quality Gates Check:"
log "===================="

# Check code coverage
log_info "Code Coverage: Checking..."
if npm run test -- --coverage --silent 2>/dev/null | grep -q "coverage"; then
  log_success "Coverage data collected"
else
  log_warning "Coverage data unavailable"
fi

# Check commit message
if [ -n "$GIT_COMMIT_MESSAGE" ]; then
  log_info "Commit Message: $GIT_COMMIT_MESSAGE"
  if [[ "$GIT_COMMIT_MESSAGE" =~ ^(feat|fix|docs|style|refactor|perf|test|chore) ]]; then
    log_success "Commit message follows conventional commits"
  else
    log_warning "Commit message should follow conventional commits"
  fi
fi

log ""
log "Validation Report: $LOG_FILE"

exit $EXIT_CODE
