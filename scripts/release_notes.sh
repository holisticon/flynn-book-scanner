#!/bin/sh
# Adds simple release notes to config.json and appends build number
#  e.g. release_notes.sh 42 -> uses 42 as build number


BASEDIR=$(dirname $0)
buildNo=$1
versionNumber=`grep "id=\"de.holisticon.app.flynn\" version" ${BASEDIR}/../app/config.xml | cut -f3 -d"=" | cut -f2 -d"\""`
sed -e "s/version=\".*\"/version=\"${versionNumber}\" android-versionCode=\"${buildNo}\" ios-CFBundleVersion=\"${buildNo}\"/g" ${BASEDIR}/../app/config.xml > ${BASEDIR}/../app/config.xml.new
mv ${BASEDIR}/../app/config.xml.new ${BASEDIR}/../app/config.xml

git log `git describe --tags --abbrev=0`..HEAD --oneline  | sed 's/"//g' >  ${BASEDIR}/../app/src-gen/RELEASE_NOTES
releaseNotes_="$(perl -p -e 's/\n/<br>/'  ${BASEDIR}/../app/src-gen/RELEASE_NOTES)"
releaseNotes="$(perl -p -e 's/\n/<br>/'  ${BASEDIR}/../app/src-gen/RELEASE_NOTES)"

# update config.json
versionedConfig="$(jq  .info.version.value=.info.version.value+\""build${buildNo}"\" ${BASEDIR}/../app/src/config.json)"
echo $versionedConfig | jq  .info.release_notes.value=\""${releaseNotes}"\" > ${BASEDIR}/../app/src-gen/config.json