flynn-book-scanner
==================

## Introduction
*tbd*

## Getting started
*tbd*

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
* `sudp npm install -g bower`

Steps in project directory `./flynn-book-scanner`:

* `npm install`
* `bower install`
* `grunt`

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