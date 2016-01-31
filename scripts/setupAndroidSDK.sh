echo ""
echo "# Executing https://raw.github.com/embarkmobile/android-sdk-installer"
echo ""

curl -L https://raw.github.com/embarkmobile/android-sdk-installer/version-2/android-sdk-installer \
  | bash /dev/stdin --install=build-tools-23.0.2,android-23,sys-img-armeabi-v7a-android-23 \
  && source ~/.android-sdk-installer/env

echo ""
echo "# Creating AVD"
echo ""

echo no | android create avd --force -n test -t android-23 --abi armeabi-v7a
emulator -avd test -no-skin -no-audio -no-window > /dev/null 2>&1 &
