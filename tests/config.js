/**
 * Testing environment configuration.
 *
 * Please note: this file will be included in the Karma environment. It adds
 * global variables.
 */

window['tests'] = {
    viewPath: '/base/tests/fixtures'
};


/**
 * Karma's PhantomJS Function Bind Hack.
 *
 * The karma PhantomJS version does not provide supports for the bind method
 * on function. However some libraries (e.g. nunjucks) are requiring it.
 * Instead of fixing the libraries that have a strong dependency on `bind`, we
 * update the Function to support it natively.
 *
 * Please note: this approach is not recommended for production. It's fine in
 * this case since this is for testing purposes.
 */
Function.prototype.bind = Function.prototype.bind || function(oThis) {
    if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError(
            'Function.prototype.bind - what is trying to be bound is ' +
            'not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1);
    var fToBind = this;
    var fNOP    = function() {};

    var fBound  = function() {
        return fToBind.apply(
            this instanceof fNOP && oThis ? this : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments))
        );
    };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
    return fBound;
};
