goog.provide('lemon.util');


/**
 * Simple deepcopy behavior.
 *
 * Create deepcopies of objects and arrays. More advanced objects (dates etc)
 * are not handled. This deepcopy is mostly used for views (for params, fetch
 * and children attributes.)
 *
 * @param {Object|Array} obj The object to copy
 */
lemon.util.deepCopy = function(obj) {
    var copy = obj instanceof Array ? [] : {};

    _.each(obj, function(value, key) {
        if (value instanceof Array || value instanceof Object) {
            copy[key] = lemon.util.deepCopy(value);
        } else {
            copy[key] = value;
        }
    });

    return copy;
};
