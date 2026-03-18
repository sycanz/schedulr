#!/bin/bash

set -e
echo "Starting Firefox extension packaging..."

echo "Running build:scraper..."
npm run build:scraper

echo "Swapping manifest.json with manifest.firefox.json..."
if [ -f "manifest.json" ]; then
    cp manifest.json manifest.json.bak
fi
cp manifest.firefox.json manifest.json

echo "Zipping the extension..."
# We zip manifest.json, images/, and frontend/
zip -r schedulr-firefox.zip manifest.json images/ frontend/

echo "Restoring original manifest.json..."
if [ -f "manifest.json.bak" ]; then
    mv manifest.json.bak manifest.json
fi
