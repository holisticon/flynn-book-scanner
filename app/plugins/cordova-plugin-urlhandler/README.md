# URL Handler Plugin for Apache Cordova

[![Build Status](https://travis-ci.org/hypery2k/cordova-urlhandler-plugin.svg?branch=master)](https://travis-ci.org/hypery2k/cordova-urlhandler-plugin) [![Build status](https://ci.appveyor.com/api/projects/status/2cu0u7g2mbglji2c?svg=true)](https://ci.appveyor.com/project/hypery2k/cordova-urlhandler-plugin) [![npm version](https://badge.fury.io/js/cordova-plugin-urlhandler.svg)](http://badge.fury.io/js/cordova-plugin-urlhandler) [![Dependency Status](https://david-dm.org/hypery2k/cordova-urlhandler-plugin.svg)](https://david-dm.org/hypery2k/cordova--urlhandler-plugin) [![devDependency Status](https://david-dm.org/hypery2k/cordova-urlhandler-plugin/dev-status.svg)](https://david-dm.org/hypery2k/cordova-urlhandler-plugin#info=devDependencies) 

 [![Bountysource](https://www.bountysource.com/badge/tracker?tracker_id=12837874)](https://www.bountysource.com/trackers/12837874-hypery2k-cordova-urlhandler-plugin?utm_source=12837874&utm_medium=shield&utm_campaign=TRACKER_BADGE) [![Flattr this git repo](http://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=mreinhardt&url=https://github.com/hypery2k/cordova-urlhandler-plugin&title=badges&language=&tags=github&category=software)

> launch your app by a link like this: `mycoolapp://` for iOS, Android and WP8 (Cordova 3.0.0+)

[![NPM](https://nodei.co/npm/cordova-plugin-urlhandler.png)](https://nodei.co/npm/cordova-plugin-urlhandler/)

*BEWARE*: For iOS you need Cordova-iOS 3.8.0 or higher `cordova platform add ios@3.8.0`

## Installation

```bash
$ cordova plugin add cordova-plugin-urlhandler --variable URL_SCHEME=mycoolapp
```
Replace `mycoolapp` by a nice scheme you want to have your app listen to:

## Usage

1a\. Your app can be launced by linking to it like this from a website or an email for example (all of these will work):
```html
<a href="mycoolapp://">Open my app</a>
<a href="mycoolapp://somepath">Open my app</a>
<a href="mycoolapp://somepath?foo=bar">Open my app</a>
<a href="mycoolapp://?foo=bar">Open my app</a>
```

`mycoolapp` is the value of URL_SCHEME you used while installing this plugin.

1b\. If you're trying to open your app from another PhoneGap app, use the InAppBrowser plugin and launch the receiving app like this, to avoid a 'protocol not supported' error:
```html
<button onclick="window.open('mycoolapp://', '_system')">Open the other app</button>
```

2\. When your app is launched by a URL, you probably want to do something based on the path and parameters in the URL. For that, you could implement the (optional) `handleOpenURL(url)` method, which receives the URL that was used to launch your app.
```javascript
function handleOpenURL(url) {
  console.log("received url: " + url);
}
```

If you want to alert the URL for testing the plugin, at least on iOS you need to wrap it in a timeout like this:
```javascript
function handleOpenURL(url) {
  setTimeout(function() {
    alert("received url: " + url);
  }, 0);
}
```
A more useful implementation would mean parsing the URL, saving any params to sessionStorage and redirecting the app to the correct page inside your app.
All this happens before the first page is loaded.

## URL Scheme hints
Please choose a URL_SCHEME which which complies to these restrictions:
- Don't use an already registered scheme (like `fb`, `twitter`, `comgooglemaps`, etc).
- Use only lowercase characters.
- Don't use a dash `-` because on Android it will become underscore `_`.
- Use only 1 word (no spaces).

TIP: test your scheme by installing the app on a device or simulator and typing yourscheme:// in the browser URL bar, or create a test HTML page with a link to your app to impress your buddies.

## Description

This plugin allows you to start your app by calling it with a URL like `mycoolapp://path?foo=bar`
](https://build.phonegap.com/plugins))

### iOS specifics
* Forget about [using config.xml to define a URL scheme](https://build.phonegap.com/docs/config-xml#url_schemes). This plugin adds 2 essential enhancements:
  - Uniform URL scheme with Android (for which there is no option to define a URL scheme via PhoneGap configuration at all).
  - You still need to wire up the Javascript to handle incoming events. This plugin assists you with that.
* Tested on iOS 7 and 8.

### Android specifics
* Unlike iOS, there is no way to use config.xml to define a scheme for your app. Now there is.
* Tested on Android 4.3, will most likely work with 2.2 and up.

## Development

### Running integration tests

execute the `runIntegrationTests.sh` script for a specific platform:

```
PLATFORM='android' ./runIntegrationTests.sh
```

```
PLATFORM='ios' ./runIntegrationTests.sh
```


## License

[The MIT License (MIT)](http://www.opensource.org/licenses/mit-license.html)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
