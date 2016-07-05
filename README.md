Interactive Report Builder
==========================

Install Node packages:
```
npm install
```

Build for development as a platform app running within Mixpanel on your dev box (will watch for file changes):
```
npm start
```

Run locally using Webpack dev server (will auto-refresh on file changes):
```
./setup-local-irb.sh  # run once, will checkout local platform lib into irb/../libs
npm run serve
```
then navigate to [http://localhost:8080/index-dev.html?api_key=PROJECT_API_KEY&api_secret=PROJECT_API_SECRET](http://localhost:8080/index-dev.html?api_key=PROJECT_API_KEY&api_secret=PROJECT_API_SECRET)

Deploy:
```
// from analytics repo on dev box
fab stage_and_deploy_platform_app:irb,branch=<your branch>
```

## Benchmarks
Run: `npm run benchmark`

API secrets must be defined in the (gitignored) file `benchmark/project-secrets.js`. Query definitions are in `benchmark/queries.js`. Results are output to console and tracked to Mixpanel Project 983955 (IRB).
