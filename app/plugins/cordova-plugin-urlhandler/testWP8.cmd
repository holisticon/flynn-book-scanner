set "cmd=%cd%"
cd ..  
rmdir /q /s cordova-test-app
git clone https://github.com/hypery2k/cordova-demo-app.git cordova-test-app
cd cordova-test-app
npm install
bower install
grunt build
cordova platform add wp8
cordova build wp8
cordova plugin add ../cordova-urlhandler-plugin/  --variable URL_SCHEME=mycoolapp
grunt build 
cordova build wp8
echo "Changing back to plugin directy: "%cw%
cd %cwd%