# This script is run by Jenkins. See https://jenkins.gcp.corp.mixpanel.org/job/IRB/

# set up
wget -qO - https://deb.nodesource.com/setup_4.x | bash -
apt-get install -y nodejs

# copy scrects from kubernetes into the project
cp /etc/secrets/irb/project-secrets.js benchmark/

# run
npm install
npm run lint
npm run build
npm run benchmark
