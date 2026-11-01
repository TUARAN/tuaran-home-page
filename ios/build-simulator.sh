#!/bin/sh
# Build the 2aran iOS app for the simulator. Requires full Xcode, not only Command Line Tools.
set -eu
cd "$(dirname "$0")"
xcodebuild \
  -project Tuaran.xcodeproj \
  -scheme Tuaran \
  -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath .derived \
  CODE_SIGNING_ALLOWED=NO \
  build
