flynn-book-scanner
==================

## Introduction
flynn is a book scanning app which saves the added books on a couchdb.

## Getting started
See below steps to get starting working with flynn:

### Setup a development environment

Preparation steps:

* Install Android Developer Tools
* Install Android target 19 or higher (the Android newest SDK)
* Install Apache Ant

Global steps:

* Install nodejs (0.10.x+) + npm
* Install ruby
* `gem install compass`
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

open brower at http://localhost:8080

### Building Cordova
* `cordova platform add android`
* `cordova plugins add https://github.com/wildabeast/BarcodeScanner.git`
* `cordova build`

### Running on an Android device

* `cordova run android -d`

## Sponsoring
This project is sponsored and supported by [Holisticon AG](http://www.holisticon.de/cms/About/Startseite)

## License
This project is released under the revised BSD License (s. LICENSE).

## Build status

[![Build Status](https://travis-ci.org/holisticon/flynn-book-scanner.png?branch=master)](https://travis-ci.org/holisticon/flynn-book-scanner)