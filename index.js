'use_strict';

/**
 * Lemon is a lightweight frontend framework inspired by AngularJS.
 */

var files = [
    __dirname + '/lemon/lemon.js',
    __dirname + '/lemon/views.js',
    __dirname + '/lemon/router.js',
    __dirname + '/lemon/app.js',
    __dirname + '/lemon/util.js']

module.exports = {
    dir: __dirname,
    bower: __dirname + '/bower_components/',
    files: files,
    tests: __dirname + '/lemon/tests.js',
    utils: require('./utils'),
};
