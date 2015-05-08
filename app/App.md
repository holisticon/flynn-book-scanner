# Setup a development environment

Preparation steps:

* Install Android Developer Tools
* Install Android target 19 SDK or higher (the Android newest SDK)
* Install Apache Ant

Global steps:


* Install nodejs and npm (http://nodejs.org/download/)
* Install ruby
  * ```bash
  $ sudo gem install compass
  ```
* Install Cordova
  * ```bash
  $ sudo npm install -g cordova
  ```
* Install build tools
  * ````bash
  $ sudo npm install -g bower grunt-cli
  ```
  * optional, used for icon and splash screen generation. See [NPM package description](https://www.npmjs.com/package/cordova-media-gen) for more details.
  ```bash
  $ sudo npm install -g cordova-media-gen
  ```

Steps in project directory `app`:

* ```bash
  $ cd app
  ```
* ```bash
  $ npm install
  ```
* ```bash
  $ bower install
  ```
* ```bash
  $ grunt
  ```

# Setup a development environment

Steps in project directory `app`:
* ```bash
  $ cd app
  ```
* ```bash
  $ grunt server
  ```
* open chrome with disabled security:
  ```bash
  $ open /Applications/Google\ Chrome.app --args --disable-web-security`
  or:
  $ /usr/bin/google-chrome --disable-web-security
  ```

For debugging in project directory `app`:

* ```bash
  $ cd app
  ```
* ```bash
  $ ./node_modules/karma/bin/karma start
  ```
* open browser at http://localhost:8080

For windows phone support within an VM: http://blogs.msdn.com/b/interoperability/archive/2012/12/21/how-to-develop-for-windows-phone-8-on-your-mac.aspx


# Building & Deployment
* `cd app`
* `grunt`
* For first build on android run `android update project --path platforms/android/ -s` to set ADT project settings
* `cordova build android` or `cordova build ios`


For updating icons and splash screen (in app/etc/). Update the files in media and run

* `cordova-media-gen`

For running on an android device execute:

* `cordova run android -d`

Please refer to the cordova setup guide regarding the android emulator configuration:
http://cordova.apache.org/docs/en/3.5.0/guide_platforms_android_index.md.html#Android%20Platform%20Guide

Install HAXM for better emulator speed: https://software.intel.com/en-us/android/articles/intel-hardware-accelerated-execution-manager

# Release

* `./scripts/release_notes.sh 58` (use environment parameter!)
* `cd app`
* `grunt build`
* `cordova build`

## License
This project is released under the revised BSD License (s. LICENSE).
