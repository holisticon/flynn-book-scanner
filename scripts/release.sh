#!/bin/sh
# takes the current app version and increase it
# note if passed 'autocommit' it will build all app plattforms and to a commit
#  e.g. release.sh autocommit
# you can also pass a desired new version and combine it with autocommit
#  e.g. release.sh 1.2.0 autocommit

BASEDIR=$(dirname $0)
buildNo=$1
versionNumber=`grep "id=\"de.holisticon.flynn\" version" ${BASEDIR}/../app/config.xml | cut -f3 -d"=" | cut -f2 -d"\""`
if [ -z "$1" ] || [ $1 = "autocommit"  ]; then
	newVersionNumber=`echo $versionNumber | ( IFS=".$IFS" ; read a b c && echo $a.$b.$((c + 1)) )`
else
	newVersionNumber=$1
fi
sed -e "s/${versionNumber}/${newVersionNumber}/g" ${BASEDIR}/../app/src/config.json > ${BASEDIR}/../app/src/config.json.new 
mv ${BASEDIR}/../app/src/config.json.new ${BASEDIR}/../app/src/config.json
sed -e "s/\"version\": \".*\"/\"version\": \"${newVersionNumber}\"/g" ${BASEDIR}/../app/bower.json > ${BASEDIR}/../app/bower.json.new
mv ${BASEDIR}/../app/bower.json.new ${BASEDIR}/../app/bower.json
sed -e "s/\"version\": \".*\"/\"version\": \"${newVersionNumber}\"/g" ${BASEDIR}/../app/package.json > ${BASEDIR}/../app/package.json.new
mv ${BASEDIR}/../app/package.json.new ${BASEDIR}/../app/package.json
sed -e "s/version=\".*\"/version=\"${newVersionNumber}\"/g" ${BASEDIR}/../app/config.xml > ${BASEDIR}/../app/config.xml.new
mv ${BASEDIR}/../app/config.xml.new ${BASEDIR}/../app/config.xml

if [ ( -z "$1" && $1 = "autocommit") ] || [ ( -z "$2" && $2 = "autocommit")  ]; then
	echo "autocommitting new version"
	git add .
	git commit -m "new dev version ${newVersionNumber}"
fi
