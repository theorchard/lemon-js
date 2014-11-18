/**
 * Karma Test Library for Lemon Views
 * ==================================
 *
 * Writting tests for views can be a bit lengthy and can require a lot of
 * manual work. This library automates the creation of the view, and bundle
 * all the automated tests (which are part of the yml files.)
 *
 * Example of library usage:
 *
 *     ```js
 *     goog.require('lemon.tests');
 *
 *     goog.require('app.ViewName');
 *     goog.require('app.ViewName.yml');
 *
 *     describe('ViewName', function() {
 *         var tests = lemon.tests.init(app.ViewName, app.ViewName.yml);
 *
 *         tests.describe('Test 1', null, function(view) {
 *             it('can handle child events', function() {
 *                 // Something
 *             })
 *         });
 *     });
 *
 * If you have 5 tests mentioned in the yml file, you will see the following
 * scenario:
 *
 * - Run all the 5 tests of the yml file.
 * - Run the test "Test 1" within the successful test of the yml file.
 *
 * If 4 tests out of 5 are successful, it means that 9 tests will have ran.
 *
 * The `describe` methods takes 3 arguments:
 *
 *     description (string): The description of the test.
 *     excluded_tests (Array.<string>): The list of all the automated tests
 *         that should not run this test.
 *     fn (Function): The function that contains the test. The first parameter
 *         is the generated view (in case it needs to be used.) This view is
 *         available in the dom for the duration of the test (then removed.)
 */

goog.provide('lemon.tests');


/**
 * @constructor
 */
lemon.tests.TestSuite = function(viewClass, viewConfig) {
    this.viewClass = viewClass;
    this.viewConfig = viewConfig;
    this.run();
};


_.extend(lemon.tests.TestSuite.prototype,
/** @lends {lemon.tests.TestCase.prototype} */{
    /**
     * Create a view from a view configuration.
     *
     * The method for this specific view is altered so it can be client side
     * rendered.
     *
     * @params {Object} view The view configuration contains "params" and "api"
     *      which are both required (even if empty.)
     */
    createView: function(view) {
        var view = new this.viewClass({params: view.params, api: view.api});
        view.render = function() {
            var tpl = lemon.tests.environment.getTemplate(this.getPath());
            var html = tpl.render({params: this.params, fetch: this.fetch});
            var $html = $('<div>' + html + '</div>');
            this.setElement($html);
        };
        return view;
    },

    /**
     * Run a test suite.
     *
     * @param {Function} fn Optional function callback. If defined, the test
     *     will continue.
     * @param {Array.<string>?} exclude The list of all the states to exclude.
     * @param {boolean} successOnly Only run the automated tests that are
     *     flagged as successful.
     */
    run: function(fn, exclude, successOnly) {
        var self = this;
        exclude = exclude || [];
        _.each(this.viewConfig.tests, function(test, name) {
            if (_.contains(exclude, name) ||
                    (successOnly && test.success === false)) {
                return;
            }

            // `it` cannot include other `it`. In the case of the manual
            // tests that needs to run within the automated tests, the `it`
            // should become a `describe`.
            var method = it;
            if (fn) {
                method = describe;
            }

            method('State: ' + test.title, function() {
                var view = self.createView(test);
                if (test.success !== false) {
                    view.render();
                } else {
                    assert.throw(view.render, Error);
                }

                if (fn) {
                    $('body').append(view.$el);
                    fn(view);
                    if (method == describe) {
                        after(view.remove.bind(view));
                    } else {
                        view.remove();
                    }
                }
            });
        });
    },

    /**
     * Describe a test.
     *
     * @param {string} description The description of the test.
     * @param {Array.<string>?} exclude The list of tests to exclude.
     * @param {Function} fn The callback function.
     */
    describe: function(description, exclude, fn) {
        var self = this;

        describe('Scenario: ' + description, function() {
            self.run(fn, exclude || [], true);
        });
    },
});


/**
 * Initialize a test suite.
 *
 * @param {constructor} viewClass The constructor.
 * @param {Object} viewConfig The configuration file.
 */
lemon.tests.init = function(viewClass, viewConfig) {
    return new lemon.tests.TestSuite(viewClass, viewConfig)
};


/**
 * Template loader.
 *
 * @type {nunjucks.WebLoader}
 */
lemon.tests.loader = new nunjucks.WebLoader(window.tests.viewPath);


/**
 * Template environment.
 *
 * @type {nunjucks.Environment}
 */
lemon.tests.environment = new nunjucks.Environment(lemon.tests.loader);
