#!/bin/sh
# needs deliver gem, see https://github.com/KrauseFx/deliver
# needs grunt buildIPA
BASEDIR=`pwd`
cp $BASEDIR/../app/target/*.ipa /tmp/Flynn.ipa
cd $BASEDIR/../etc/release/ios && deliver run /tmp/Flynn.ipa