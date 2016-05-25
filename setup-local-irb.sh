#!/bin/bash
mkdir -p ../libs
cd ../libs
if cd mixpanel-platform; then git pull && cd ..; else git clone git@github.com:mixpanel/mixpanel-platform.git; fi
cd ../irb
ln -s ../libs libs
