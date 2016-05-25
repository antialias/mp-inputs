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
// checkout mixpanel platform into a directory of your choosing
mkdir path/to/libs
cd path/to/libs
git clone git@github.com:mixpanel/mixpanel-platform.git

// build mixpanel-platform
cd path/to/libs/mixpanel-platform
npm run build

// create symlink to platform in irb
cd path/to/irb
npm run build
cd build-development
ln -s path/to/libs libs

// start webpack dev server
npm run serve
```

Deploy:
```
// from analytics repo on dev box
fab stage_and_deploy_platform_app:irb,branch=<your branch>
```
