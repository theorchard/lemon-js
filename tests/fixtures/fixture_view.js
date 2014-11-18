goog.provide('lemon.fixtures.view');


goog.require('lemon.View');


/**
 * Create a simple view.
 *
 * The render method is altered so the different scenarios can be tested. If
 * one of the test mentions the render state to return `false`, the param
 * `fail` of the view should be set to true.
 *
 * Spy available: `view.renderSpy`, called everytime the method `render` is
 * called.
 *
 * @param {Object} options The view options
 * @return {lemon.View} the instance of the lemon view.
 */
lemon.fixtures.view.createView = function(options) {
    options = options || {};
    options['name'] = options['name'] || 'TestView';

    var view = lemon.View.extend({
        name: 'TestView',
        render: function() {
            view.renderSpy();
            if (this.params.fail) {
                return false;
            }
            return true;
        },
    });

    view.renderSpy = sinon.spy();
    return view;
};
