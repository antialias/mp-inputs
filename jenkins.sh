#!/bin/bash
set -o errexit -o pipefail -o nounset -o xtrace
# This script is run by Jenkins. See https://jenkins.gcp.corp.mixpanel.org/job/IRB/

# set up
wget -qO - https://deb.nodesource.com/setup_4.x | bash -
apt-get install -y nodejs

export SAUCE_USERNAME=mixpanel
export SAUCE_ACCESS_KEY=`cat /etc/secrets/saucelabs/access-key`

# run
npm install
npm run lint
npm run build
npm test
npm run benchmark
