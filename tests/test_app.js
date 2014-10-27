goog.require('lemon.app');
goog.require('lemon.views');


/**
 * Test the initialization of the application.
 */
describe('The initialization of the application', function() {
    /**
     * The initializion of the application initialize all the views that
     * are being provided.
     */
    it('should initialize all the templates', function() {
        sinon.stub(lemon.views, 'initialize');

        var views = {};
        lemon.app.initialize(views);
        console.log(lemon.views.initialize.calledOnce);
        assert.isTrue(lemon.views.initialize.calledOnce);

        lemon.views.initialize.restore();
    });

    // Reset
    after(function() {
        lemon.views.all = {};
    });
})
