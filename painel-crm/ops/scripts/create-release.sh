#!/usr/bin/env bash
set -euo pipefail

# create-release.sh — Creates a GitHub release from the current main branch.
# Usage: ./ops/scripts/create-release.sh [patch|minor|major]
#
# Requirements: git, gh (GitHub CLI), npm

BUMP_TYPE="${1:-patch}"

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Usage: $0 [patch|minor|major]"
  exit 1
fi

# Ensure we're on main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "❌ Must be on 'main' branch (currently on '$BRANCH')"
  exit 1
fi

# Ensure working tree is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Working tree is not clean. Commit or stash changes first."
  exit 1
fi

# Pull latest
git pull origin main --ff-only

# Get current version from root package.json
ROOT_PKG="painel-crm/package.json"
CURRENT_VERSION=$(node -p "require('./$ROOT_PKG').version")
echo "📦 Current version: v$CURRENT_VERSION"

# Compute next version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
case "$BUMP_TYPE" in
  patch) PATCH=$((PATCH + 1)) ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
esac
NEXT_VERSION="$MAJOR.$MINOR.$PATCH"
echo "🚀 Next version: v$NEXT_VERSION"

# Update version in package.json files
node -e "
  const fs = require('fs');
  const files = [
    '$ROOT_PKG',
    'painel-crm/packages/backend/package.json',
  ];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const pkg = JSON.parse(fs.readFileSync(f, 'utf8'));
    pkg.version = '$NEXT_VERSION';
    fs.writeFileSync(f, JSON.stringify(pkg, null, 2) + '\n');
    console.log('  ✅ Updated ' + f);
  }
"

# Commit version bump
git add -A
git commit -m "chore(release): v$NEXT_VERSION"

# Create annotated tag
git tag -a "v$NEXT_VERSION" -m "Release v$NEXT_VERSION"

# Push commit and tag
git push origin main --follow-tags

# Generate changelog from last tag
PREV_TAG=$(git tag --sort=-creatordate | head -2 | tail -1)
if [[ -n "$PREV_TAG" ]]; then
  CHANGELOG=$(git log "${PREV_TAG}..v${NEXT_VERSION}" --pretty=format:"- %s (%h)" --no-merges)
else
  CHANGELOG=$(git log --pretty=format:"- %s (%h)" --no-merges -20)
fi

# Create GitHub release
echo ""
echo "📝 Creating GitHub Release..."
gh release create "v$NEXT_VERSION" \
  --title "v$NEXT_VERSION" \
  --notes "$CHANGELOG" \
  --latest

echo ""
echo "✅ Release v$NEXT_VERSION created successfully!"
echo "   https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/releases/tag/v$NEXT_VERSION"
