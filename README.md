Insights
========

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
npm run standalone
```
then navigate to [http://localhost:8080/index-dev.html?api_key=PROJECT_API_KEY&api_secret=PROJECT_API_SECRET](http://localhost:8080/index-dev.html?api_key=PROJECT_API_KEY&api_secret=PROJECT_API_SECRET)

Deploy:
```
// from analytics repo on dev box
fab stage_and_deploy_platform_app:irb,branch=<your branch>
```

## Benchmarks
Run: `npm run benchmark`

API secrets must be defined in `/etc/secrets/irb/project-secrets.json`. Query definitions are in `benchmark/queries.js`. Results are output to console and tracked to Mixpanel Project 983955 (IRB).
