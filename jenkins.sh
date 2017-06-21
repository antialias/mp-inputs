#!/bin/bash
set -o errexit -o pipefail -o nounset -o xtrace
# This script is run by Jenkins. See https://jenkins.gcp.corp.mixpanel.org/job/IRB/

# Install yarn (TODO: migrate to Docker builds already containing yarn)
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn

export SAUCE_USERNAME=mixpanel
export SAUCE_ACCESS_KEY=`cat /etc/secrets/saucelabs/access-key`

# run
yarn install
yarn run lint
yarn run build
yarn test
yarn run benchmark
