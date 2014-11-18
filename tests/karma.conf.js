/**
 * Unit testing Lemon
 * ===================
 *
 * To simplify our testing environment, we use a combinaison of several
 * libraries: Karma (test suite runner), Mocha (test framework), and PhantomJs.
 *
 * The karma configuration is assembling our different dependencies (google
 * closure, backbone, jquery and underscore), and is fetching our different
 * directories to find our views and libraries.
 *
 * To run the tests::
 *
 *      ./node_modules/karma/bin/karma run tests/karma.conf.js \
 *          --browsers PhantomJs
 */

// Paths
var bowerPath = 'bower_components/';
var closurePath = bowerPath + 'closurelibrary/closure/goog/';
var lemon = 'lemon/**.js';
var lemonTests = 'tests/**/*.js';


// Preprocessing some of the data (dependencies mostly.)
var preprocessors = {};
preprocessors[lemonTests] = ['closure'];
preprocessors[lemon] = ['closure', 'coverage'];
preprocessors[closurePath + 'base.js'] = ['closure-deps'];

var karmaConfig = {
    basePath: '../',
    browsers: ['PhantomJS'],
    frameworks: ['mocha', 'chai', 'closure', 'sinon-chai', 'nunjucks'],

    files: [
        // Global vars.
        'tests/config.js',

        // closure base
        closurePath + 'base.js',

        // Additional dependencies.
        bowerPath + 'jquery/index.js',
        bowerPath + 'underscore/index.js',
        bowerPath + 'backbone/index.js',

        // included files - tests
        lemonTests,

        // source files - these are only watched and served
        {pattern: lemon, included: false},

        // external deps
        {pattern: closurePath + 'deps.js', included: false, served: false},

        // Serve templates
        {pattern: 'tests/fixtures/TestView/TestView.nunjucks', included: false, served: true}
    ],

    preprocessors: preprocessors,

    reporters: [
        'mocha',
        'coverage',
        'coveralls',
        'junit'],

    junitReporter: {
        outputFile: 'build/jsunit.xml',
        suite: ''
    },

    // Add coverage
    coverageReporter: {
        type : 'lcovonly',
        dir: 'coverage/',
        subdir: '.',
        file: 'lcov.info'
    }
};


module.exports = function(config) {
    config.set(karmaConfig);
};
