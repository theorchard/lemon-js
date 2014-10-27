goog.require('lemon.View');
goog.require('lemon.fixtures.router');
goog.require('lemon.router');
goog.require('lemon.views');


// Silence unload errors.
window.onbeforeunload = null;


/**
 * Test the creation of a View class.
 */
describe('Creating a view', function() {
    // Any child of a view should be inheriting from lemon.View.
    _.each([{}, null], function(p) {
        var str = p ? '{...}' : 'null';
        it('should be a subclass of View (params=' + str +')', function() {
            var view = lemon.views.register('Test', p);
            var myView = new view();
            assert.instanceOf(myView, lemon.View);
            assert.equal(myView.name, 'Test');
        });
    });


    // Creating a view also attaches it to the lemon.views.all dictionary.
    it('should add it to the list of available views.', function(){
        var view = lemon.views.register('Test');
        assert.isDefined(lemon.views.all['Test'])
        assert.instanceOf(
            lemon.views.initialize({'path': 'Test'}), lemon.View);
    });

    afterEach(function() {
        lemon.views.all = {};
    });
});


/**
 * Test the mechanisms behind the initialization of a view.
 */
describe('Initializing a view', function() {
    /**
     * Helper to create an empty view.
     *
     * @param {string} name Name of the view to create.
     * @param {number} id The id of the view.
     */
    var initialize = function(name, viewId) {
        return function() {
            return lemon.views.initialize({
                path: name,
                id: viewId
            });
        }
    };


    // For those tests, at least one view needs to be registered.
    before(function() {
        lemon.views.register('exist', {});
    })


    // If the view is not found, it throws an error (basic javascript
    // TypeError) since the key does not exist on lemon.views.all.
    it('Should fail if the view does not exist', function() {
        assert.throw(initialize('doesnotexist'));
    });


    // Test the initialization of a view: if the view is initialized, it should
    // be an instance of lemon.View and Backbone.View.
    it('Should create the view if found', function() {
        var view = initialize('exist')();
        assert.ok(view);
        assert.instanceOf(view, lemon.View);
        assert.instanceOf(view, Backbone.View);
    });


    // When a view has found its html, it removes the id.
    it('Should look for the its element and attach it to this.el', function() {
        var viewId = 'ViewID';
        var $div = $('<div>').attr('id', viewId);
        $('body').append($div);

        assert.equal($div.attr('id'), viewId);
        var view = initialize('exist', viewId)();
        assert.equal(view.el, $div[0]);
        assert.notEqual($div.attr('id'), viewId);
    });


    // Setting the properties should initialize the children.
    it('Should set the properties including the children', function() {
        var initialize = lemon.views.initialize;

        sinon.spy(lemon.views, 'initialize');
        lemon.views.register('Test', {});

        initialize({
            path: 'Test',
            children:[
                {path: 'Test'}
            ]})

        assert.isTrue(lemon.views.initialize.calledOnce);
        lemon.views.initialize = initialize;
    });


    // When a child is added to a parent, it should also set its parent
    // attribute to point to the right view.
    it('Should set the parent of the children to be itself', function() {
        var initialize = lemon.views.initialize;
        lemon.views.register('Test', {});

        var mainView = initialize({
            path: 'Test',
            children:[
                {path: 'Test'}
            ]})

        assert.equal(mainView, mainView.children[0].parent);
    });


    // Reset
    after(function() {
        lemon.views.all = {};
    });
});


describe('Rendering a view', function() {
    // Rendering a view is calling the endpoint to get the HTML, along with the
    // tree. In this particular testing environment, we'll mock the response.
    var server;
    var View;

    beforeEach(function() {
        View = lemon.views.register('Test');
        server = sinon.fakeServer.create();
    });

    afterEach(function() {
        server.restore();
        lemon.views.all = {};
    });

    var respondWith = function(response) {
        server.respondWith('POST', '/view/', [200,
            {'Content-Type': 'application/json'},
            JSON.stringify(response)]);
    }

    // Re-rendering should replace the current HTML of the view with the loaded
    // html.
    it('Should switch the children with the new view', function() {
        var html = '<i>Hello</i>';
        respondWith({
            html: '<div>' + html + '</div>'
        });

        var View = lemon.views.register('Test');
        var testView = new View();
        testView.render();

        server.respond();
        assert.equal(testView.$el.html(), html);
    });


    // When a view is rendered, all the children should be generated and
    // attached.
    it('Should recreate the child views', function() {
        var childHtml = '<div class="View Test" id="children1">Child</div>';
        var html = '<i>Hello ' + childHtml + '</i>';

        respondWith({
            html: '<div>' + html + '</div>',
            tree: {"children": [{"id": "children1", "path": "Test"}]}
        });

        var testView = new View();
        sinon.spy(testView, 'addChild');

        $('body').append(testView.$el);
        testView.render();
        server.respond();

        var children = testView.children;
        assert.ok(testView.addChild.called);
        assert.equal(children.length, 1);
        assert.equal(children[0].name, 'Test');
        assert.equal(children[0].$el.text(), 'Child');
    });
});


describe('Removing a child', function() {
    var Parent;
    var Child;

    lemon.router.initialize(
        [lemon.fixtures.router.simpleRoute]);

    beforeEach(function() {
        Parent = lemon.views.register('Parent');
        Child = lemon.views.register('Child');
    });

    afterEach(function() {
        lemon.views.all = {};
    });

    // It removes the child from the list, and removes it from the DOM (by
    // calling `remove` (method from Backbone.View), which removes all the
    // events attached to this model.
    it('should remove it from the list of children', function() {
        var mainView = new Parent();
        var childView = new Child();
        mainView.addChild(childView);

        sinon.spy(childView, 'remove');
        mainView.removeChild(childView);

        assert.ok(childView.remove.called);
        assert.notInclude(mainView.children, childView);
    });
});


describe('Calling navigate', function() {
    var Parent;
    var Child;

    lemon.router.initialize(
        [lemon.fixtures.router.simpleRoute]);

    beforeEach(function() {
        Parent = lemon.views.register('Parent');
        Child = lemon.views.register('Child');
    });

    afterEach(function() {
        lemon.views.all = {};
    });


    // If the url is found: the navigation goes all the way to trigger
    // navigate.
    it('should trigger navigation', function() {
        var view = new Parent();
        var spy = sinon.spy(view, 'triggerNavigate');
        view.navigate('/test/');

        assert.ok(view.triggerNavigate.called);
        assert.instanceOf(spy.args[0][0], jQuery.Event);
        assert.equal(spy.args[0][0].url, '/test/');
    });


    // If the url is missing, the method should throw an exception (something
    // is obviously missing.)
    it('should fail if the url is not mentioned', function() {
        var view = new Parent();
        assert.throw(view.navigate);
    });


    // Urls that are not handled by flask are redirected (using window.location
    // property.)
    it('Should redirect if not handled', function() {
        var view = new Parent();
        var spy = sinon.spy(view, 'triggerNavigate');
        view.navigate('http://google.com/');
        assert.isFalse(view.triggerNavigate.called);
    });


    // The full refresh of the page can be reinforced when the force param
    // is set to true – this not calling the triggerNavigate.
    it('Should redirect if not forced', function() {
        var view = new Parent();
        var spy = sinon.spy(view, 'triggerNavigate');
        view.navigate('/test/', true);
        assert.isFalse(view.triggerNavigate.called);
    });


    // Parent should be called since the event is bubbling.
    it('Should call the onNavigate method of the parent view', function() {
        var mainView = new Parent();
        var childView = new Child();
        mainView.addChild(childView);
        sinon.spy(mainView, 'triggerNavigate');
        childView.navigate('/test/');

        assert.ok(mainView.triggerNavigate.called);
    });


    // If the event has been prevented, navigation should stop immediately.
    it('should stop event propagation when prevented', function() {
        var mainView = new Parent();
        var childView = new Child();
        mainView.addChild(childView);
        sinon.spy(mainView, 'onNavigate');

        sinon.stub(childView, 'onNavigate', function(evt) {
            evt.preventDefault();
        });

        childView.navigate('/test/');
        assert.ok(childView.onNavigate.called);
        assert.isFalse(mainView.onNavigate.called);
    });
});


describe('Clicking on links in the view', function() {
    var Parent
    var Child;
    var mainView;

    lemon.router.initialize(
        [lemon.fixtures.router.simpleRoute]);

    beforeEach(function() {
        Parent = lemon.views.register('Parent');
        Child = lemon.views.register('Child');

        var html = (
            '<div class="View Parent" id="1">' +
                '<div class="View Child" id="2">' +
                    '<a href="/test/">Link</a>' +
                '</div>' +
            '</div>');

        $('body').html(html);

        mainView = new Parent({id: 1});
        mainView.addChild(new Child({id: 2}));
    });

    afterEach(function() {
        lemon.views.all = {};
    });

    // Clicks on links should behave the same as normal navigate calls, except
    // the origin is different.
    it('Should trigger the navigation', function() {
        var child = mainView.children[0];
        var spy = sinon.spy(child, 'triggerNavigate');
        sinon.spy(mainView, 'triggerNavigate');

        $('body a').click();

        assert.ok(spy.called);
        assert.equal(spy.args[0][0].url, '/test/');
        assert.ok(mainView.triggerNavigate.called);

        child.triggerNavigate.restore();
        mainView.triggerNavigate.restore();
    });
});


describe('Getting the main view', function() {
    // The main view with the view that has no parent.
    it('Should find the view that has no parent', function() {
        var mainView = new lemon.View();
        var childView = new lemon.View();
        var childChildView = new lemon.View();
        mainView.addChild(childView);
        childView.addChild(childChildView);

        assert.equal(mainView, lemon.views.getMainView(childChildView));
        assert.equal(mainView, lemon.views.getMainView(childView));
        assert.equal(mainView, lemon.views.getMainView(mainView));
    });
});


describe('Getting the view configuration', function() {
    it('Should include all the children', function() {
        var mainView = new lemon.View();
        var childView = new lemon.View();
        mainView.addChild(childView);
        sinon.spy(childView, 'getConfig');

        var config = mainView.getConfig();
        assert.notProperty(config, 'children');
        assert.isFalse(childView.getConfig.called);

        var config = mainView.getConfig(true);
        assert.property(config, 'children');
        assert.ok(childView.getConfig.called);
    });
});


after(function() {
    lemon.views.all = {};
});
