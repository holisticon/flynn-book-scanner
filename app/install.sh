#!/usr/bin/env bash

die() {
   [[ $# -gt 1 ]] && {
        exit_status=$1
        shift
    }
    local -i frame=0; local info=
    while info=$(caller $frame)
    do
        local -a f=( $info )
        [[ $frame -gt 0 ]] && {
            printf >&2 "ERROR in \"%s\" %s:%s\n" "${f[1]}" "${f[2]}" "${f[0]}"
        }
        (( frame++ )) || :; #ignore increment errors (i.e., errexit is set)
    done

    printf >&2 "ERROR: $*\n"

    exit ${exit_status:-1}
}

#trap 'die $? "*** bootstrap failed. ***"' ERR

set -o nounset -o pipefail

sudo apt-get update
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password password root'
sudo debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password root'
sudo apt-get install -y vim curl python-software-properties
sudo apt-get update

########
# CouchDB
########
sudo apt-get -y install couchdb
sed -i "s/^bind_address = 127.0.0.1/bind_address = 0.0.0.0/" /etc/couchdb/default.ini
sudo curl -X PUT http://127.0.0.1:5984/_config/httpd/bind_address -d '"0.0.0.0"'
sudo curl -X PUT http://127.0.0.1:5984/flynn
sudo /etc/init.d/couchdb restart

########
# LDAP
########

sudo apt-get -y install debconf-utils

installnoninteractive(){
  DEBIAN_FRONTEND=noninteractive apt-get install -q -y $*
}

installnoninteractive slapd ldap-utils


########
# Apache Webserver
########
installnoninteractive apache2
sudo a2enmod authnz_ldap
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
cat /vagrant/couchdb_apache.template > /etc/apache2/sites-enabled/000-default
sudo service apache2 restart
