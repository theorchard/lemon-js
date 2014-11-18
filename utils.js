'use strict';

var fs = require('fs');
var jsonify = require('jsonify');
var jsyaml = require('js-yaml');


module.exports = {
    /**
     * Convert a yml file into a json.
     *
     * The JSON will be later on used by different systems (including our
     * tests layer.)
     */
    convertYml: function(file, dest) {
        var response = jsyaml.safeLoad(fs.readFileSync(file, 'utf8'));
        if(!response || !response.name) {
            throw Error(
                'This yml file (' + file + ') has issues. Please fix.');
        }

        var namespace = response.name.replace('/', '.') + '.yml';
        var tpl = 'goog.provide(\'' + namespace + '\')\n\n';
        tpl += namespace + ' = ' + jsonify.stringify(response);

        fs.writeFile(dest + namespace + '.js', tpl);
        return dest + namespace + '.js';
    }
};
