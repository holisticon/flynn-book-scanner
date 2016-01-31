#!/usr/bin/env bash

set -e

set -x


#DIR=$(cd `dirname $0` && pwd)

cd /vagrant

LDAP_PASSWORD=password
LDAP_OLCDB_NUMBER=1
LDAP_ROOTPW_COMMAND=replace
SUFFIX=dc=holisticon,dc=de
MANAGER=dc=Manager

SLAPPASS=`slappasswd -s $LDAP_PASSWORD`

TMP_MGR_DIFF_FILE=`mktemp -t manager_ldiff.$$.XXXXXXXXXX.ldif`
sed -e "s|\${MANAGER}|$MANAGER|"  -e "s|\${SUFFIX}|$SUFFIX|" -e "s|\${LDAP_OLCDB_NUMBER}|$LDAP_OLCDB_NUMBER|" -e "s|\${SLAPPASS}|$SLAPPASS|" -e "s|\${LDAP_ROOTPW_COMMAND}|$LDAP_ROOTPW_COMMAND|" manager.ldif >> $TMP_MGR_DIFF_FILE


ldapmodify -Y EXTERNAL -H ldapi:/// -f $TMP_MGR_DIFF_FILE

ldapadd -c -x -H ldap://localhost:389 -D "$MANAGER,$SUFFIX" -w $LDAP_PASSWORD -f default.ldif

# test query

ldapsearch -w $LDAP_PASSWORD -D$MANAGER,$SUFFIX -x -H ldap://localhost:389 -b $SUFFIX
