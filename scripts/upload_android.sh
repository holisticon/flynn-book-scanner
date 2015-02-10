#!/bin/sh
# needs python bindings, see https://github.com/google/google-api-python-client
# needs grunt buildAPK
BASEDIR=`pwd`
cp $BASEDIR/../app/target/*.apk /tmp/Flynn.apk
cd $BASEDIR/../etc/release/android && $BASEDIR/../scripts/upload_apk.py --package_name --apk_file