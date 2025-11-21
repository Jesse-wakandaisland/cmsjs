#!/bin/bash

# Start PocketBase server
# This script checks if PocketBase is installed and starts it

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
PB_DIR="$PROJECT_DIR/pocketbase"
PB_EXECUTABLE="$PB_DIR/pocketbase"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PocketBase is installed
if [ ! -f "$PB_EXECUTABLE" ]; then
  echo -e "${RED}❌ PocketBase not found${NC}"
  echo ""
  echo "Please install PocketBase first:"
  echo "  npm run install:pocketbase"
  echo ""
  echo "Or manually download from:"
  echo "  https://pocketbase.io/docs/"
  echo "  Extract to: $PB_DIR"
  exit 1
fi

# Make sure it's executable
chmod +x "$PB_EXECUTABLE"

echo -e "${GREEN}🚀 Starting PocketBase (CMS.js Backend)...${NC}"
echo ""
echo -e "  ${YELLOW}Admin UI:${NC}     http://127.0.0.1:8090/_/"
echo -e "  ${YELLOW}API:${NC}          http://127.0.0.1:8090/api/"
echo -e "  ${YELLOW}Data Dir:${NC}     $PB_DIR/pb_data"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

cd "$PB_DIR"
exec ./pocketbase serve \
  --http="127.0.0.1:8090" \
  --dir="$PB_DIR/pb_data" \
  --migrationsDir="$PB_DIR/pb_migrations" \
  --hooksDir="$PB_DIR/pb_hooks"
