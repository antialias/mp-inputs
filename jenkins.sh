#!/bin/bash
set -o errexit -o pipefail -o nounset -o xtrace
# This script is run by Jenkins. See https://jenkins.gcp.corp.mixpanel.org/job/IRB/

function github_status {
    set +o xtrace
    echo "setting github status to ${1}"
    curl "https://api.github.com/repos/mixpanel-platform/irb/statuses/${GIT_COMMIT}" \
        -H "Authorization: Bearer $(cat /etc/secrets/github-status/token)" \
        -H "Content-type: application/json" \
        -X POST -d @- <<EOF || true
{
    "context": "jenkins",
    "description": "build ${1}",
    "state": "${1}",
    "target_url": "${BUILD_URL}"
}
EOF
    set -o xtrace
}

function on_exit {
    EC=$?
    if [ $EC = 0 ]; then
        github_status success
    else
        github_status failure
    fi
    exit $EC
}
trap on_exit EXIT
github_status pending

# set up
wget -qO - https://deb.nodesource.com/setup_4.x | bash -
apt-get install -y nodejs

# run
npm install
npm run lint
npm run build
npm test
npm run benchmark
