/**
 * Application
 * ===========
 *
 * A single page application requires the application to know the different
 * views and the different urls it owns. The application is responsible to make
 * sure that any url request is either handled by the application, or by the
 * browser, enabling the "single page" behavior.
 *
 * The code to put at the bottom of the page::
 *
 *     <script>(function() { lemon.initialize([views], [routes])}());
 *
 * @author: Michael Ortali <hello@xethorn.net>
 */

goog.provide('lemon.app');

goog.require('lemon.views');
goog.require('lemon.router');


/**
 * Initialize the application.
 *
 * The application creates the views and the routes from the object provided,
 * it also initializes the history manager.
 *
 * @param {Array} views The list of all the views.
 * @param {Array} routes The list of all the routes available.
 */
lemon.app.initialize = function(views, routes) {
    var appView = lemon.views.initialize(views);
    lemon.router.initialize(routes, appView);
};


// Make this method available on `window`.
goog.exportSymbol('lemon.initialize', lemon.app.initialize);
