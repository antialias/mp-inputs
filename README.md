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

Serve on `localhost:8080` using Webpack dev server (will auto-refresh on file changes):
```
./setup-local-irb.sh  # run once, will checkout local platform lib into irb/../libs
npm run serve
```

Deploy:
```
// from analytics repo on dev box
fab stage_and_deploy_platform_app:irb,branch=<your branch>
```
