# This script is run by Jenkins. See https://jenkins.gcp.corp.mixpanel.org/job/IRB/

npm install
npm run lint
npm run build
npm run benchmark
