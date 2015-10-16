#!/bin/sh
npm install -g protractor
webdriver-manager update
echo ""
echo "# Executing https://raw.github.com/embarkmobile/android-sdk-installer"
echo ""

curl -L https://raw.github.com/embarkmobile/android-sdk-installer/version-2/android-sdk-installer \
  | bash /dev/stdin --install=build-tools-22.0.1,android-22,sys-img-armeabi-v7a-android-22 \
  && source ~/.android-sdk-installer/env

echo ""
echo "# Creating AVD"
echo ""

echo no | android create avd --force -n test -t android-22 --abi armeabi-v7a
emulator -avd test -no-skin -no-audio -no-window &
