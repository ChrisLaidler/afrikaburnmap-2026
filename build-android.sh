#!/usr/bin/env bash
# Build the AfrikaBurn 2026 Android APK.
# Prerequisites: Node.js, npm, Android SDK (ANDROID_HOME set), Java 17+
set -e

echo "==> Installing npm dependencies..."
npm install

echo "==> Copying web assets to www/..."
mkdir -p www
for f in \
  index.html data.js sw.js manifest.json \
  project_details.js schedule_data.js old_wtf_details.js \
  2026_AfrikaBurnMap-scaled.jpg \
  2026_Site_map_highres.jpg \
  2026_Site_map_highres_overview.jpg \
  2026_Site_map_highres_mobile.jpg \
  2026_Site_map_highres_tiny.jpg \
  icon-32.png icon-180.png icon-192.png icon-512.png \
  favicon.ico favicon-16x16.png; do
  [ -f "$f" ] && cp "$f" www/
done

echo "==> Syncing Capacitor..."
npx cap sync android

echo "==> Building APK..."
cd android
./gradlew assembleDebug
cd ..

APK="android/app/build/outputs/apk/debug/app-debug.apk"
cp "$APK" AfrikaBurnMap2026.apk
echo ""
echo "✓ APK ready: AfrikaBurnMap2026.apk ($(du -h AfrikaBurnMap2026.apk | cut -f1))"
