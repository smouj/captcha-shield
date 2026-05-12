#!/usr/bin/env bash
# ============================================================================
# CAPTCHA Shield v4.0 "Fortress" — Obfuscation Build Script
# ============================================================================
#
# Builds the production widget.js with minification and obfuscation.
#
# Usage:
#   bash scripts/obfuscate.sh           # Build with obfuscation
#   bash scripts/obfuscate.sh --skip-obfuscate  # Build without obfuscation (faster)
#   bash scripts/obfuscate.sh --check    # Check if tools are installed
#
# Output:
#   public/v4/widget.js  — Obfuscated, minified IIFE bundle
#
# Requirements:
#   - Node.js 18+ or Bun
#   - rollup, @rollup/plugin-terser, @rollup/plugin-node-resolve,
#     @rollup/plugin-typescript, rollup-obfuscator
#
# ============================================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_FILE="$PROJECT_DIR/public/v4/widget.js"
INPUT_FILE="$PROJECT_DIR/src/lib/v4/widget-entry.ts"
ROLLUP_CONFIG="$PROJECT_DIR/rollup.config.mjs"

SKIP_OBFUSCATE=false
CHECK_ONLY=false

# ─── Parse Arguments ──────────────────────────────────────────────────────────

for arg in "$@"; do
  case "$arg" in
    --skip-obfuscate)
      SKIP_OBFUSCATE=true
      ;;
    --check)
      CHECK_ONLY=true
      ;;
    --help|-h)
      echo "Usage: bash scripts/obfuscate.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-obfuscate   Build without obfuscation (faster, for development)"
      echo "  --check            Check if required tools are installed"
      echo "  --help             Show this help message"
      exit 0
      ;;
  esac
done

# ─── Color Output ─────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ─── Check Prerequisites ─────────────────────────────────────────────────────

info "Checking prerequisites..."

# Check for Node.js or Bun
if command -v bun &>/dev/null; then
  RUNTIME="bun"
  PKG_MANAGER="bun"
  ok "Using Bun runtime"
elif command -v node &>/dev/null; then
  RUNTIME="node"
  PKG_MANAGER="npm"
  ok "Using Node.js runtime (v$(node --version))"
else
  error "Neither 'bun' nor 'node' found. Please install one of them."
  exit 1
fi

# Check for rollup
if ! command -v rollup &>/dev/null && ! npx rollup --version &>/dev/null 2>&1; then
  warn "Rollup not found. Installing required packages..."

  if [ "$PKG_MANAGER" = "bun" ]; then
    bun add -d rollup @rollup/plugin-terser @rollup/plugin-node-resolve @rollup/plugin-typescript rollup-obfuscator javascript-obfuscator
  else
    npm install --save-dev rollup @rollup/plugin-terser @rollup/plugin-node-resolve @rollup/plugin-typescript rollup-obfuscator javascript-obfuscator
  fi
fi

# Verify rollup is available now
if [ "$PKG_MANAGER" = "bun" ]; then
  ROLLUP_CMD="bunx rollup"
else
  ROLLUP_CMD="npx rollup"
fi

if ! $ROLLUP_CMD --version &>/dev/null 2>&1; then
  error "Rollup is still not available after installation attempt."
  error "Please install manually: $PKG_MANAGER add -d rollup"
  exit 1
fi

ok "Rollup available ($($ROLLUP_CMD --version 2>/dev/null || echo 'version unknown'))"

# If check-only mode, exit here
if [ "$CHECK_ONLY" = true ]; then
  ok "All prerequisites are met."
  exit 0
fi

# ─── Validate Input Files ─────────────────────────────────────────────────────

if [ ! -f "$INPUT_FILE" ]; then
  error "Widget entry point not found: $INPUT_FILE"
  error "Make sure src/lib/v4/widget-entry.ts exists."
  exit 1
fi

if [ ! -f "$ROLLUP_CONFIG" ]; then
  error "Rollup configuration not found: $ROLLUP_CONFIG"
  error "Make sure rollup.config.mjs exists in the project root."
  exit 1
fi

ok "Input files validated"

# ─── Create Output Directory ──────────────────────────────────────────────────

mkdir -p "$(dirname "$OUTPUT_FILE")"
ok "Output directory ready: $(dirname "$OUTPUT_FILE")"

# ─── Build ─────────────────────────────────────────────────────────────────────

info "Starting production build..."
info "  Input:    $INPUT_FILE"
info "  Output:   $OUTPUT_FILE"
info "  Obfuscate: $([ "$SKIP_OBFUSCATE" = true ] && echo "NO (skipped)" || echo "YES")"

BUILD_START=$(date +%s%N 2>/dev/null || python3 -c "import time; print(int(time.time()*1e9))" 2>/dev/null || echo "0")

if [ "$SKIP_OBFUSCATE" = true ]; then
  # Build without obfuscation (faster, for development)
  info "Running Rollup without obfuscation..."

  $ROLLUP_CMD -c "$ROLLUP_CONFIG" --environment SKIP_OBFUSCATE:true 2>&1 || {
    # If the rollup config doesn't support the environment flag,
    # try a simpler build with just terser
    warn "Full config failed. Attempting simple minified build..."

    $ROLLUP_CMD -c "$ROLLUP_CONFIG" 2>&1 || {
      error "Rollup build failed. Check the configuration and try again."
      exit 1
    }
  }
else
  # Full production build with obfuscation
  info "Running Rollup with obfuscation (this may take a minute)..."

  $ROLLUP_CMD -c "$ROLLUP_CONFIG" 2>&1 || {
    error "Rollup build failed."
    error "Try running with --skip-obfuscate for a faster development build."
    exit 1
  }
fi

# ─── Verify Output ─────────────────────────────────────────────────────────────

if [ ! -f "$OUTPUT_FILE" ]; then
  error "Build completed but output file not found: $OUTPUT_FILE"
  exit 1
fi

OUTPUT_SIZE=$(wc -c < "$OUTPUT_FILE" | tr -d ' ')
OUTPUT_SIZE_KB=$(echo "scale=1; $OUTPUT_SIZE / 1024" | bc 2>/dev/null || echo "$(( OUTPUT_SIZE / 1024 ))")

ok "Build successful!"
info "  Output:     $OUTPUT_FILE"
info "  Size:       ${OUTPUT_SIZE_KB}KB ($OUTPUT_SIZE bytes)"

# Check if output looks reasonable (should be at least a few KB)
if [ "$OUTPUT_SIZE" -lt 1000 ]; then
  warn "Output file is suspiciously small ($OUTPUT_SIZE bytes). The build may have failed silently."
fi

# ─── Summary ──────────────────────────────────────────────────────────────────

BUILD_END=$(date +%s%N 2>/dev/null || python3 -c "import time; print(int(time.time()*1e9))" 2>/dev/null || echo "0")
if [ "$BUILD_START" != "0" ] && [ "$BUILD_END" != "0" ]; then
  BUILD_MS=$(( (BUILD_END - BUILD_START) / 1000000 ))
  info "  Build time: ${BUILD_MS}ms"
fi

echo ""
ok "CAPTCHA Shield v4.0 production widget built successfully!"
info "Deploy $OUTPUT_FILE to your CDN or web server."
info "Embed with: <script src=\"/v4/widget.js\"></script>"
