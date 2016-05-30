#!/usr/bin/env node

// Adds simple release notes to config.json and appends build number
//  e.g. release_notes.js 42 -> uses 42 as build number

var args = process.argv.slice(2),
  fs = require('fs'),
  xml2js = require('xml2js'),
  xmlParser = new xml2js.Parser(),
  builder = new xml2js.Builder(),
  exec = require('child_process').exec;

var buildNo = args[0],
  configJSON = require(__dirname + '/../src/main/frontend/config.json'),
  configXML = fs.readFileSync(__dirname + '/../config.xml');


xmlParser.parseString(configXML, function (err, result) {
  var appId = result.widget.$.id;
  var version = result.widget.$.version;
  console.log('buildNo' + buildNo);
  console.log('appId' + appId);
  console.log('version' + version);
  result.widget.$['android-versionCode'] = buildNo;
  result.widget.$['ios-CFBundleVersion'] = buildNo;
  var xml = builder.buildObject(result);
  fs.writeFile(__dirname + '/../config.xml', xml, function (err) {
    if (err) throw err;
  });


  exec('git describe --tags --abbrev=0', function (err, tag) {
    if (err instanceof Error) {
      throw err;
    }
    exec('git log ' + tag.replace(/\n$/, '') + '..HEAD --oneline', function (err, releaseNotes) {
      if (err instanceof Error) {
        throw err;
      }
      fs.writeFile(__dirname + '/../src-gen/RELEASE_NOTES', releaseNotes.replace(/"/, ''), function (err) {
        if (err) throw err;
      });
      configJSON.info.version.value = version + '(' + buildNo + ')';
      configJSON.info.release_notes.value = releaseNotes.replace(/"/, '').replace(/\n/g, '<br>');
      fs.writeFile(__dirname + '/../src-gen/config.json', JSON.stringify(configJSON), function (err) {
        if (err) throw err;
      });

    });
  });
});

exec('which agvtool >/dev/null', function (err, tag) {
  if (err instanceof Error) {
    // ignore
  } else {
    exec('cd ' + __dirname + '/../platforms/ios &&  agvtool new-version -all ' + buildNo, function (err) {
      if (err instanceof Error) {
        if (err) throw err;
      }
    });
  }
});
