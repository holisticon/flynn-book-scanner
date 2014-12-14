flynn book scanner
==================

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/holisticon/flynn-book-scanner?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://travis-ci.org/holisticon/flynn-book-scanner.png?branch=master)](https://travis-ci.org/holisticon/flynn-book-scanner)

## Introduction
flynn is a book scanning app which saves the added books on a couchdb.


![iPhone Sample](https://github.com/holisticon/flynn-book-scanner/raw/master/docs/screenshots/iPhone_sample.png)

## Getting started
See below steps to get starting working with flynn:

### Setup a development environment

Preparation steps:

* Install Android Developer Tools
* Install Android target 19 SDK or higher (the Android newest SDK)
* Install Apache Ant

Global steps:

* Install nodejs (0.10.x+) + npm
* Install ruby
* `sudo gem install compass`
* Install Cordova
* `sudo npm install -g cordova`
* `sudo npm install -g ios-deploy`
* Install build tools
* `sudo npm install -g grunt-cli`
* `sudo npm install -g bower`

Steps in project directory `./flynn-book-scanner`:

* `cd app`
* `npm install`
* `bower install`
* `grunt`
# `grunt server` (open chrome with `open /Applications/Google\ Chrome.app --args --disable-web-security` to http://127.0.0.1:9000/#/)

### Setup a development environment

Steps in project directory `./flynn-book-scanner`:
* `cd app`
* `grunt`

For debugging in project directory `./flynn-book-scanner`:
* `cd app`
* `./node_modules/karma/bin/karma start`

open browser at http://localhost:8080

For windows phone support within an VM: http://blogs.msdn.com/b/interoperability/archive/2012/12/21/how-to-develop-for-windows-phone-8-on-your-mac.aspx


### Building & Deployment
* `cd app`
* `grunt`
* For first build on android run `android update project --path platforms/android/ -s` to set ADT project settings
* `cordova build android` or `cordova build ios`


For running on an android device execute:

* `cordova run android -d`

Please refer to the cordova setup guide regarding the android emulator configuration:
http://cordova.apache.org/docs/en/3.5.0/guide_platforms_android_index.md.html#Android%20Platform%20Guide

Install HAXM for better emulator speed: https://software.intel.com/en-us/android/articles/intel-hardware-accelerated-execution-manager

## Sponsoring
This project is sponsored and supported by [Holisticon AG](http://www.holisticon.de/cms/About/Startseite)

## License
This project is released under the revised BSD License (s. LICENSE).
