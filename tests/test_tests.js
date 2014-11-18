goog.require('lemon.tests');
goog.require('lemon.View');

goog.require('lemon.fixtures.view');


var view = new lemon.View('TestView');

describe('Creating a test suite', function() {
    /**
     * Views have a yml file that describe what the view can take as an input
     * and if it can render itself. Those tests are run immediatelly after
     * passing those arguments to the constructor.
     */
    it('calls run on the initial tests.', function() {
        sinon.stub(lemon.tests.TestSuite.prototype, 'run');
        new lemon.tests.TestSuite('ViewName', {});
        assert.ok(lemon.tests.TestSuite.prototype.run.calledOnce);
        lemon.tests.TestSuite.prototype.run.restore();
    });

    it('attach the view class and the configuration', function() {
        var className = 'ViewName';
        var configuration = {};
        var suite = new lemon.tests.TestSuite(className, configuration);
        assert.deepEqual(suite.viewClass, className);
        assert.deepEqual(suite.viewConfig, configuration);
    });
});


describe('Describing a test in a suite', function() {
    it('runs again all the tests', function() {
        sinon.stub(lemon.tests.TestSuite.prototype, 'run');
        var stub = lemon.tests.TestSuite.prototype.run;
        var suite = new lemon.tests.TestSuite('ViewName', {});
        var callback = function() {};
        var exclude = ['exclude'];

        suite.describe('Test', exclude, callback);

        assert.equal(stub.callCount, 2);
        assert.equal(stub.secondCall.args[0], callback);
        assert.equal(stub.secondCall.args[1], exclude);
        assert.equal(stub.secondCall.args[2], true);

        stub.restore();
    });
});


describe('Running the tests', function() {
    var view = lemon.fixtures.view.createView();
    var suite = lemon.tests.init(view, {
        tests: {
            testA: {
                title: 'TestA: Success scenario.',
                success: true
            },
            testB: {
                title: 'TestB: Fail scenario',
                success: false,
                params: {fail: true}
            },
            testC: {
                title: 'TestC: implicit success'
            }
        }
    });

    var spy = sinon.spy();

    suite.describe('Perfom automated tests on manual tests.', null, function(view) {
        spy();

        it('renders the template', function() {
            assert.include(view.$el.html(), 'Hello World');
        });
    });

    describe('Running a manual test', function() {
        it('run within successful automated tests', function() {
            assert.ok(spy.called);
            assert.equal(spy.callCount, 2);
        });
    });

    var spy2 = sinon.spy();
    suite.describe(
        'Perfom automated tests on manual tests with exclusion.',
        ['testA'], spy2);

    describe('Running a manual test with exclusion', function() {
        it('run within successful non excluded automated tests', function() {
            assert.ok(spy2.called);
            assert.equal(spy2.callCount, 1);
        })
    });
});
