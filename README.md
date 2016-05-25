Interactive Report Builder
==========================

Install Node packages:
```
npm install
```

Build for development within Mixpanel Platform (will watch for file changes):
```
npm start
```

Run locally using Webpack dev server (will auto-refresh on file changes):
```
./setup-local-irb.sh  # run once, will checkout local platform lib into irb/../libs
npm run serve
```
Navigate to:
```
http://localhost:8080/index-dev.html?api_key=<your project’s api key>&api_secret=<your project’s api secret>
```

Deploy:
```
// from analytics repo on dev box
fab stage_and_deploy_platform_app:irb,branch=<your branch>
```
