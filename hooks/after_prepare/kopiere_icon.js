#!/usr/bin/env node

var fs = require('fs');
var path = require('path');


var srcfile = "www/res/icons/android/icon-72-hdpi.png";
var destfile = "platforms/android/res/drawable/icon.png";
var destdir = path.dirname(destfile);

if (fs.existsSync(srcfile) && fs.existsSync(destdir)) {
    fs.createReadStream(srcfile).pipe(fs.createWriteStream(destfile));
}

