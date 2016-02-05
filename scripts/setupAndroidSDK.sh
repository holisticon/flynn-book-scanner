echo ""
echo "# Executing https://raw.github.com/embarkmobile/android-sdk-installer"
echo ""
sudo apt-get install -qq libstdc++6:i386 lib32z1
curl -L https://raw.github.com/embarkmobile/android-sdk-installer/version-2/android-sdk-installer \
  | bash /dev/stdin --install=build-tools-22.0.1,android-22,sys-img-armeabi-v7a-android-22,extra-android-support,extra-google-google_play_services,extra-google-m2repository,extra-android-m2repository \
  && source ~/.android-sdk-installer/env

echo ""
echo "# Creating AVD"
echo ""

echo no | android create avd --force -n test -t android-22 --abi armeabi-v7a
emulator -avd test -no-skin -no-audio -no-window > /dev/null 2>&1 &
