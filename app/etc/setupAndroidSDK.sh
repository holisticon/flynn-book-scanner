echo ""
echo "# Executing https://raw.github.com/embarkmobile/android-sdk-installer"
echo ""
sudo apt-get install -qq libstdc++6:i386 lib32z1
# Install base Android SDK and components
export LICENSES="android-sdk-license-c81a61d9|android-sdk-license-ed0d0a5b|android-sdk-license-5be876d5|mips-android-sysimage-license-15de68cc|intel-android-sysimage-license-1ea702d1"
export COMPONENTS=android-19,android-20,android-21,android-22,android-23,sys-img-armeabi-v7a-android-19,sys-img-armeabi-v7a-android-21,sys-img-armeabi-v7a-android-22,sys-img-armeabi-v7a-android-23,extra-android-support,addon-google_apis-google-19,google-apis-19,addon-google_apis-google-20,google-apis-20,addon-google_apis-google-21,google-apis-21,addon-google_apis-google-22,google-apis-22,addon-google_apis-google-23,google-apis-23,extra-google-google_play_services,extra-google-gcm,build-tools-19.1.0,build-tools-20.0.1,build-tools-21.0.1,build-tools-22.0.5,build-tools-23.0.2,extra-google-m2repository,extra-android-m2repository
curl -L https://raw.github.com/embarkmobile/android-sdk-installer/version-2/android-sdk-installer | bash /dev/stdin --install=$COMPONENTS --accept=$LICENSES
source ~/.android-sdk-installer/env
android list targets

echo ""
echo "# Creating AVD"
echo ""

echo no | android create avd --force -n test -t android-23 --abi armeabi-v7a
emulator -avd test -no-skin -no-audio -no-window > /dev/null 2>&1 &
