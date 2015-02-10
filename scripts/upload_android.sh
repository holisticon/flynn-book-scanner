#!/bin/sh
# needs python bindings, see https://github.com/google/google-api-python-client
# needs grunt buildAPK
BASEDIR=`pwd`
cp $BASEDIR/../app/target/*.apk /tmp/Flynn.apk
cat ~/dev/play_upload.json > $BASEDIR/../scripts/client_secrets.json
cd $BASEDIR/../etc/release/android && $BASEDIR/../scripts/upload_apk.py de.holisticon.app.flynn /tmp/Flynn.apk