#!/usr/bin/env bash
#
# CAPTCHA Shield v4.0 — Static Export Build Script
#
# Builds the project for GitHub Pages (output: "export").
# API routes are incompatible with static export, so they are
# temporarily moved aside during the build and restored afterwards.
#
# Usage:
#   ./scripts/build-static.sh
#   # or via npm:
#   npm run build:pages

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$PROJECT_ROOT/src/app/api"
API_BACKUP="$PROJECT_ROOT/.api-routes-backup"

echo "🏗️  CAPTCHA Shield v4.0 — Static Export Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Clean previous build artifacts
if [ -d "$PROJECT_ROOT/docs" ]; then
  echo "🧹 Cleaning previous docs/ output..."
  rm -rf "$PROJECT_ROOT/docs"
fi

# Temporarily move API routes out of the app directory
# (They are incompatible with output: "export")
if [ -d "$API_DIR" ]; then
  echo "📦 Temporarily moving API routes aside (incompatible with static export)..."
  mv "$API_DIR" "$API_BACKUP"
fi

# Ensure API dir is restored on exit (even if build fails)
restore_api_routes() {
  if [ -d "$API_BACKUP" ]; then
    echo "📦 Restoring API routes..."
    mv "$API_BACKUP" "$API_DIR"
  fi
}
trap restore_api_routes EXIT

# Run the build with GITHUB_PAGES=1
echo "🔨 Building with GITHUB_PAGES=1..."
GITHUB_PAGES=1 npx next build

# Create .nojekyll to prevent GitHub Pages from ignoring files starting with _
touch "$PROJECT_ROOT/docs/.nojekyll"
echo "📄 Created docs/.nojekyll"

# Copy v4 CDN assets if they exist
if [ -d "$PROJECT_ROOT/public/v4" ]; then
  mkdir -p "$PROJECT_ROOT/docs/v4"
  cp -r "$PROJECT_ROOT/public/v4/"* "$PROJECT_ROOT/docs/v4/" 2>/dev/null || true
  echo "📦 Copied public/v4/ → docs/v4/"
fi

# Verify the output
if [ -f "$PROJECT_ROOT/docs/index.html" ]; then
  echo "✅ Build successful! docs/index.html exists."
  echo "   Size: $(wc -c < "$PROJECT_ROOT/docs/index.html") bytes"
else
  echo "⚠️  Build completed but docs/index.html not found."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Static export build complete!"
