/**
 * Router
 * ======
 *
 * Lightweight router in charge of handling url changes. It provides methods
 * to regenerate the view paramters, and a lightweight history manager. If you
 * use the method `lemon.router.initialize`, it creates a singleton
 * `lemon.router.instance` which you can reuse in different parts of your
 * application.
 *
 * @author Michael Ortali <mortali@theorchard.com>
 */

goog.provide('lemon.router');

goog.require('lemon.util');


/**
 * @constructor
 */
lemon.Router = function() {
    /**
     * All the routes.
     *
     * @type {Array.<Object>}
     */
    this.routes = [];

    /**
     * Main application view.
     *
     * @type {lemon.View}
     */
    this.appView = null;
};


_.extend(lemon.Router.prototype,
/** @lends {lemon.Router.prototype} */{
    /**
     * Star the router.
     *
     * Starting the router attaches the listener on the popstate of window (to
     * track when the browser initiate a history.go or history.back), and save
     * the application view.
     *
     * @param {lemon.View} appView The main application view.
     */
    start: function(appView) {
        this.appView = appView;
        this.navigate(window.location.href, this.appView);
        $(window).on('popstate', _.bind(this.onPopState, this));
    },

    /**
     * Reverse the url to a View.
     *
     * Based on a url, find the view that corresponds and retrieve all the
     * parameters for this specific view.
     *
     * @param {string} url The url to reverse.
     * @return {Object} The description of the view that needs to be loaded.
     */
    reverse: function(url) {
        var route = _.find(this.routes, function(route) {
            return url.match(route.rule);
        });

        if (route) {
            return route.prepare(url);
        }

        return null;
    },

    /**
     * Add a route.
     *
     * @param {Object} route The route object (from Flask)
     */
    add: function(route) {
        this.routes.push(new lemon.Route(route));
    },

    /**
     * Navigate to a url.
     *
     * @return {boolean} If the history is handled.
     */
    navigate: function(url, view) {
        if (window.history && window.history.pushState) {
            var treeConfig = lemon.util.deepCopy(view.getConfig(true));
            window.history.pushState(treeConfig, window.document.title, url);
            return true;
        } else {
            window.location.href = url;
            return false;
        }
    },

    /**
     * Handler for popstate events.
     *
     * @param {jQuery.Event} evt The jQuery event.
     */
    onPopState: function(evt) {
        evt = evt.originalEvent || evt;
        if (!evt.state || !evt.state.children || !evt.state.children[0]) {
            return;
        }

        this.appView.onNavigate(new jQuery.Event('navigate', {
            'view': evt.state.children[0]
        }));
    }
});


/**
 * Route
 *
 * @constructor
 */
lemon.Route = function(route) {
    /**
     * Name of the view.
     * @type {string}
     */
    this.view = route['view'];

    /**
     * Rule of the url.
     * @type {RegExp}
     */
    this.rule = lemon.router.createRule(route['rule']);

    /**
     * Keys of the url.
     * @type {Array.<string>}
     */
    this.keys = route['keys'] || [];

    /**
     * Params of the `lemon.View`.
     * @type {Object}
     */
    this.params = route['params'] || {};

    /**
     * Fetch parameter of `lemon.View`.
     * @type {Object}
     */
    this.fetch = route['fetch'];
};


_.extend(lemon.Route.prototype,
/** @lends {lemon.Route.prototype} */{
    /**
     * Populate the params with replacements.
     *
     * To recreate the view options, some properties of the view needs to be
     * changed and replaced. For instance: /artist/<name>/ passes to fetch the
     * `artist=<name>`. `<name>` needs to be replaced. This method handles this
     * replacement.
     *
     * @param {Object} params The params object.
     * @param {Object} replacements The replacements.
     * @return {Object} the params
     */
    populate: function(params, replacements) {
        var clone = {};

        _.map(params, function(value, key) {
            if (_.isString(value)) {
                if (replacements[value]) {
                    clone[key] = replacements[value];
                } else {
                    clone[key] = value;
                }
            } else {
                clone[key] = this.populate(value, replacements);
            }
        }, this);

        return clone;
    },

    /**
     * Clone of the Route.
     *
     * Only a few parameters are cloned (view, params, and fetch). Note: this
     * is not a deep clone.
     */
    clone: function() {
        return {
            'path': this.view,
            'params': this.params,
            'fetch': this.fetch
        };
    },

    /**
     * Prepare the route.
     */
    prepare: function(url) {
        var matches = url.match(this.rule);
        if (!matches) {
            return;
        }

        var values = /** @type {Array} */ (_.rest(matches));
        var replacements = _.object(this.keys, values);
        return this.populate(this.clone(), replacements);
    }
});


/**
 * @return {lemon.Router}
 */
lemon.router.instance = (function() {
    var router = null;

    return function() {
        if (!router) {
            router = new lemon.Router();
        }
        return router;
    };
})();


/**
 * @type {string}
 * @const
 */
lemon.router.EXCEPTION_BAD_URL = 'The url does not match the route.';


/**
 * Create Rule Regex.
 *
 * The Flask route is not a regex (just a string), this method turns the rule
 * into a regex we can use later on.
 *
 * @param {string} rule The Flask route.
 * @return {RegExp} the Regex rule.
 */
lemon.router.createRule = function(rule) {
    return new RegExp('^' + rule.replace(/<(.*?)>/g, '(.+)') + '$');
};


/**
 * Initialize the router.
 *
 * @param {Array} routes The list of (flask) routes.
 */
lemon.router.initialize = function(routes, appView) {
    var router = lemon.router.instance();

    _.each(routes, function(route) {
        router.add(route);
    });

    if (appView) {
        router.start(appView);
    }
};
