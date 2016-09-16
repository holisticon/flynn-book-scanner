#!/usr/bin/env node

// Set support for all orienations in iOS .plist - workaround for this cordova bug: https://issues.apache.org/jira/browse/CB-8953
var fs = require('fs'),
  plist = require('plist'),
  xmlParser = new require('xml2js').Parser(),
  plistPath = '',
  configPath = 'config.xml';
// Construct plist path.
if (fs.existsSync(configPath)) {
  var configContent = fs.readFileSync(configPath);
  // Callback is synchronous.
  xmlParser.parseString(configContent, function (err, result) {
    var name = result.widget.name;
    plistPath = 'platforms/ios/' + name + '/' + name + '-Info.plist';
  });
}
// Change plist and write.
if (fs.existsSync(plistPath)) {
  var pl = plist.parse(fs.readFileSync(plistPath, 'utf8'));
  configure(pl);
  fs.writeFileSync(plistPath, plist.build(pl).toString());
}

function configure(plist) {
  var iPhoneOrientations = [
    'UIInterfaceOrientationPortrait',
    'UIInterfaceOrientationLandscapeRight',
    'UIInterfaceOrientationPortrait',
    'UIInterfaceOrientationPortraitUpsideDown'
  ];
  var iPadOrientations = [
    'UIInterfaceOrientationLandscapeLeft',
    'UIInterfaceOrientationLandscapeRight',
    'UIInterfaceOrientationPortrait',
    'UIInterfaceOrientationPortraitUpsideDown'
  ];
  plist["UISupportedInterfaceOrientations"] = iPhoneOrientations;
  plist["UISupportedInterfaceOrientations~ipad"] = iPadOrientations;
}
