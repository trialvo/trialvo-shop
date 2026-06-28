#!/bin/bash
# ═══════════════════════════════════════════════════════
# Trialvo Shop — Post-Deploy Cleanup Script
# Run after docker compose up to reclaim disk space
# ═══════════════════════════════════════════════════════

echo "📊 Before cleanup:"
docker system df

echo ""
echo "🧹 Cleaning up..."

# Remove Docker build cache (biggest savings — removes Rust compiler artifacts)
docker builder prune -f 2>/dev/null

# Remove dangling images (old builder layers, rust:1.88 base, etc.)
docker image prune -f 2>/dev/null

# Remove unused volumes not attached to any container
docker volume prune -f 2>/dev/null

echo ""
echo "📊 After cleanup:"
docker system df

echo ""
echo "✅ Cleanup complete!"
