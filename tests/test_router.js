goog.require('lemon.router');

goog.require('lemon.fixtures.router');


var fixtures = lemon.fixtures.router;


describe('Creating a Route', function() {
    // The rule of the route should be a regex (and not a string, which is
    // the value passed.)
    it('should create a regex for the rule', function() {
        var route = fixtures.simpleView;
        assert.ok(route.rule instanceof RegExp);
    });

    // If some arguments are missing, the defaults should take place.
    it('should use default values for keys and params if empty', function() {
        var route = new lemon.Route({'view': 'Test', 'rule': '/url/'});
        assert.instanceOf(route.keys, Array);
        assert.instanceOf(route.params, Object);
    });
});


describe('Cloning the Route', function() {
    // Cloning should deep copy all the primary parameters – so if any of those
    // params are altered, their original copy is preserved by the Route obj.
    it('should copy all the primary params', function() {
        var route = fixtures.simpleView;
        var clone = route.clone();
        assert.ok(clone.params, route.params);
        assert.ok(clone.fetch, route.fetch);
    });
});


describe('Preparing the Route', function() {
    // The preparing method should only be accessed when the route has been
    // found to be a match by the router. If the method prepare is accessed
    // outside with a non matching url, it should fail and throw an exception.
    it('should not return a route on non matching', function() {
        var route = fixtures.simpleView;
        assert.isUndefined(route.prepare('/badurl/'));
    });

    // Preparing the route means returning the arguments for the view to be
    // generated. All the route attributes that will be replaced by the values
    // in the url need to be cloned (so their remain unchanged on the Route
    // obj).
    it('should clone all the primary params', function() {
        var route = fixtures.simpleView;
        sinon.stub(route, 'clone');

        var response = route.prepare(fixtures.simpleViewUrlSamples[0]);

        assert.ok(route.clone.called);
        assert.notDeepEqual(route.fetch, response.fetch);
        assert.notDeepEqual(route.params, response.params);

        route.clone.restore();
    });

    // Some routes have placeholders (in the fetch, or params field). Those
    // placeholders should be replaced when the url is fetched.
    it('should replace the placeholders', function() {
        var route = fixtures.simpleViewWithPlaceholder;
        var response = route.prepare('/test/value1/value2/');
        assert.equal(response.params['params1'], 'value1');
        assert.equal(response.fetch.params['params2'], 'value2');
    });
});


describe('Creating the rule', function() {
    // Creating a rule should always return a regex.
    it('should return a Regex', function() {
        assert.ok(lemon.router.createRule('/') instanceof RegExp);
    });

    // Stress tests for the rule creation: check against valid and invalid
    // urls, and make sure they are working as expected.
    describe('Stress tests for the rule', function() {
        var samples = {
            '/url/': ['/url/'],
            '/page/<name>/': ['/page/name-of-page/', '/page/0928/'],
            '/page/<name>/<date>/': ['/page/name/date/', '/page/02/0/']};

        _.each(samples, function(samples, key) {
            var regex= lemon.router.createRule(key);

            _.each(samples, function(sample) {
                it('Rule (' + key + ') should work for ' + sample, function() {
                    assert.ok(sample.match(regex));
                });
            });
        });

        samples = ['/url/page/', 'url/page', 'url/page/'];
        var regex = lemon.router.createRule('/');

        _.each(samples, function(sample) {
            it('Rule (/url/) should not match for: ' + sample, function() {
                assert.isNull(sample.match(regex));
            });
        });
    });
});


describe('Calling the router instance', function() {
    // The router behaves as a singleton: only one instance can be returned.
    it('should be a singleton', function() {
        assert.strictEqual(lemon.router.instance(), lemon.router.instance());
    });

    it('should return a router', function() {
        assert.instanceOf(lemon.router.instance(), lemon.Router);
    });
});


describe('Initializing the router', function() {
    // The initialization of the router should (at least) create the router,
    // and also assign the routes.
    it('should create the router', function() {
        sinon.stub(lemon.router, 'instance');
        lemon.router.initialize([]);
        assert.isTrue(lemon.router.instance.called);
        lemon.router.instance.restore();
    });

    // If the main view is provided, it should initiate the router.
    it('should start the router if the app view is provided', function() {
        var router = lemon.router.instance();
        sinon.spy(router, 'start');
        lemon.router.initialize([], new lemon.View());
        assert.ok(router.start.called);
    });

    // Route added to the router should be turned into Route objects, and the
    // rule should be a variable.
    it('should add the routes to the router', function() {
        var router = lemon.router.instance();
        sinon.spy(router, 'add');
        lemon.router.initialize([fixtures.simpleRoute]);
        assert.isTrue(router.add.called);
        assert.instanceOf(router.routes[0], lemon.Route);
        router.add.restore();
    });

    // It should start the router (which involves calling `start`, adding the
    // appView etc.)
    it('should register the app view', function() {
        var router = lemon.router.instance();
        var view = new lemon.View();
        var spy = sinon.spy(router, 'navigate');
        router.start(view);
        assert.ok(spy.called);
        assert.deepEqual(router.appView, view);
        spy.restore();
    });
});


describe('Reversing the url', function() {
    var router;

    beforeEach(function() {
        router = lemon.router.instance();
        lemon.router.initialize([fixtures.simpleRoute]);
    });

    it('should return the route if found', function() {
        var response = router.reverse(fixtures.simpleRoute.rule);
        assert.equal(response.path, 'test');
    });

    it('should return nothing if not found', function() {
        var response = router.reverse('/random/');
        assert.isNull(response);
    });
});


describe('Navigating to a url', function() {
    var router;
    var view = new lemon.View();
    var history = window.history;

    beforeEach(function() {
        router = lemon.router.instance();
    });

    it('should test if window.history is supported', function() {
        window.history = null;
        assert.isFalse(router.navigate('/foobar/', view));
    });

    it('should test if window.history.pushState is supported', function() {
        window.history = {'pushState': null};
        assert.isFalse(router.navigate('/foobar/', view));
    });

    it('should navigate if pushState is supported', function() {
        window.history = {'pushState': sinon.spy()};
        assert.ok(router.navigate('/foobar/', view));
        assert.ok(window.history.pushState.called);
    });

    it('should call popState if the browser goes back', function() {
        sinon.spy(router, 'onPopState');
        router.start(view);
        $(window).trigger('popstate');
        assert.ok(router.onPopState.called);
    });

    // The history object is a little more complex: it contains a state, which
    // contains the view configuration. Each part of the configuration needs
    // to be checked before the url is changed.
    it('should check if the children is present', function() {
        router.start(view);
        var spy = sinon.spy(view, 'onNavigate');

        router.onPopState(new jQuery.Event());
        assert.isFalse(spy.called);

        router.onPopState(new jQuery.Event('navigate', {'state': null}));
        assert.isFalse(spy.called);

        router.onPopState(new jQuery.Event());
        assert.isFalse(spy.called);

        router.onPopState(new jQuery.Event(
            'navigate', {'state': {'children': []}}));
        assert.isFalse(spy.called);

        router.onPopState(new jQuery.Event(
            'navigate', {'state': {'children': ['something...']}}));
        assert.ok(spy.called);
    });

    afterEach(function() {
        window.history = history;
    });
});
