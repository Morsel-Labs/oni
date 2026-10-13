#!/bin/sh
# Usage: sh scripts/build-client.sh path/to/oni-fighter.html
# Copies the game into public/index.html and loads the server shim before the game's scripts.
set -e
[ -f "$1" ] || { echo "Give the path to oni-fighter.html"; exit 1; }
node -e "const fs=require('fs');let t=fs.readFileSync(process.argv[1],'utf8');if(!t.includes('/shim.js')){const i=t.indexOf('<script');t=t.slice(0,i)+'<script src=\"/shim.js\"></script>\n'+t.slice(i);}fs.writeFileSync('public/index.html',t);console.log('public/index.html ready')" "$1"
