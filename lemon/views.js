/**
 * Views
 * =====
 *
 * The View defines the javascript interactions that are automatically attached
 * to the nunjucks views at rendering time. The views are extending the Backbone
 * View, and adding few additional features (such as event bubbling, publisher -
 * subscriber model among others.)
 *
 * The signature of the params provided to the view are the exact same signature
 * as the ones sent to the nunjucks view:
 *
 *     * **fetch** (`object`): the object that defines where the information
 *         need to be fetched from.
 *
 *     * **params** (`params`): options passed to the view, that defines how
 *         if should behave.
 *
 *     * **children** (`array`): All the children that are contained within
 *         this specific view.
 *
 * Creation of a new view is simple::
 *
 *     lemon.views.Name = lemon.views.register('Name',
 *         /** @lends {lemon.views.Name} *\/{
 *         // Code here.
 *     })
 *
 * @author Michael Ortali <mortali@theorchard.com>
 */

goog.provide('lemon.views');
goog.provide('lemon.View');

goog.require('lemon.router');


/**
 * @constructor
 * @extends {Backbone.View}
 * @param {Object} options The options of the view.
 */
lemon.View = Backbone.View.extend(/** @lends {lemon.View.prototype} */{

    /**
     * Generate the different parameters and attach the view.
     *
     * The view is responsible to manage the piece of HTML it is attached to
     * along with all the children that are under its responsibility. The
     * constructor is called, mostly, by the method `lemon.view.load`.
     *
     * @param {Object} options The options of the view. Some of the params
     *     includes:
     */
    constructor: function(options) {
        Backbone.View.prototype.constructor.call(this, options);

        options = options || {};
        this.setProperties(options);

        var $el = $('#' + options['id']);
        if ($el.length) {
            this.setElement($('#' + options['id']));
            this.$el.removeAttr('id');
        }
    },

    /**
     * Add a child.
     *
     * The parent should be aware of the children, and the children should also
     * know their parent. It allows children to bubble up events, and it allows
     * parents to ask children to do specific tasks.
     *
     * @param {lemon.View} child The child to add to the current view.
     */
    addChild: function(child) {
        this.children.push(child);
        child.parent = this;
    },

    /**
     * Remove child.
     *
     * @param {lemon.View} child The child to remove.
     */
    removeChild: function(child) {
        this.children = _.without(this.children, child);
        child.parent = null;
        child.remove();
    },

    /**
     * Set the main properties of the view.
     *
     * @param {Object} options The options of the view.
     */
    setProperties: function(options) {
        options = options || {};
        this.children = [];
        this.params = options['params'] || {};
        this.fetch = options['fetch'] || {};
        this['events'] = this['events'] || {};
        this['events']['click a'] = this.navigate;

        _.each(options['children'], function(child) {
            var view = lemon.views.initialize(child);
            this.addChild(view);
        }, this);
    },


    /**
     * Render a view.
     *
     * Rendering a view requires to call the server (GET method). The response
     * returns a json object with two main values:
     *
     *   * **html** (string): contains all the html requires to replace the
     *     current element.
     *
     *   * **tree** (json): represents the current view and all its children.
     * @return {jQuery.jqXHR}
     */
    render: function() {
        var callback = _.bind(Backbone.View.prototype.render, this);
        var ajaxOptions = {
            'url': '/view/',
            'type': 'POST',
            'data': JSON.stringify(this.getConfig()),
            'dataType': 'json'
        };

        var self = this;
        return $.ajax(ajaxOptions)
            .done(function(json, status, xhr) {
                self.replaceCurrentView(json, status, xhr);
            })
            .always(callback);
    },


    /**
     * Replace the current view with the new view from the xhr.
     *
     */
    replaceCurrentView: function(json) {
        var html = $(json['html']);
        this.$el.replaceWith(html);
        this.setElement(html);

        // Set the view configuration.
        this.setProperties(json['tree']);
    },


    /**
     * Return the configuration of the view.
     *
     * @param {Boolean} withChildren If the children need to be included in
     *      this list.
     * @return {Object} the Object representation of the current view.
     */
    getConfig: function(withChildren) {
        var config = {
            'path': this.name,
            'params': this.params,
            'fetch': this.fetch
        };

        if (withChildren && this.children) {
            config['children'] = _.map(this.children, function(child) {
                return child.getConfig(withChildren);
            });
        }

        return config;
    },

    /**
     * Navigate to a url.
     *
     * This method can be called from two different operations: as an event
     * handler (for clicks on links) or called directly by passing in the url
     * the browser should redirect the user to.
     *
     * @param {string|Object} link The url string or the event that contains
     *      the url the user should go to.
     * @param {boolean=} force If true, the user should be immediately
     *      redirected to this address.
     * @throws Error
     */
    navigate: function(link, force) {
        var url;
        if (typeof(link) === 'string') {
            url = /** @type {string} */ (link);
        } else if (link instanceof Object) {
            link.preventDefault();
            link.stopPropagation();
            url = /** @type {string} */($(link.target).attr('href'));
        } else {
            throw 'The url is not defined, the navigation is not possible.';
        }

        var view = lemon.router.instance().reverse(url);
        if (!view || force) {
            window.location.href = url;
            return;
        }

        var evt = new jQuery.Event('navigate', {
            target: this,
            view: view,
            url: url
        });

        this.triggerNavigate(evt);
    },

    /**
     * Trigger the navigate event.
     *
     * The triggering mechanism calls the `onNavigate` on the current View if
     * the event has not been prevented. If the event has been prevented, the
     * event bubbles up to the application view - which takes care of changing
     * the url if necessary.
     *
     * @param {jQuery.Event} evt The navigate event.
     */
    triggerNavigate: function(evt) {
        if (!evt.isDefaultPrevented()) {
            var appView = lemon.views.getMainView(this);
            var callback = lemon.router.instance().navigate;
            this.onNavigate(evt, _.bind(callback, null, evt['url'], appView));
        }

        if (this.parent) {
            this.parent.triggerNavigate(evt);
        } else if (!evt.isDefaultPrevented()) {
            window.location.href = evt['url'];
        }
    },

    /**
     * Event handler for navigation.
     *
     * @param {jQuery.Event} evt The jQuery event.
     * @param {Function=} callback Callback.
     * @override
     */
    onNavigate: goog.nullFunction
});


/**
 * All available views.
 */
lemon.views.all = {};


/**
 * Register a new view.
 *
 * @param {string} viewName The view name.
 * @param {Object} properties The additional view properties.
 */
lemon.views.register = function(viewName, properties) {
    properties = properties || {};
    properties.name = viewName;

    var view = lemon.View.extend(properties);
    lemon.views.all[viewName] = view;
    return view;
};


/**
 * Get the top of the tree.
 */
lemon.views.getMainView = function(view) {
    if (view.parent) {
        return lemon.views.getMainView(view.parent);
    } else {
        return view;
    }
};


/**
 * Initialize a view.
 *
 * @param {Object} view The json that describes the view. The path of the view
 *     defines which view will be instantiated.
 * @return {lemon.View} the View.
 */
lemon.views.initialize = function(view) {
    var viewName = view.path;
    return new /** @constructor */ (lemon.views.all[viewName])(view);
};
