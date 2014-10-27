goog.provide('lemon.fixtures.router');

goog.require('lemon.router');


lemon.fixtures.router.simpleView = new lemon.Route({
    'view': 'View',
    'rule': '/artist/<name>/',
    'keys': ['<name>'],
    'params': {'test': '<name>'},
    'fetch': {
        'params': {'artist': 'name'}
    }});


lemon.fixtures.router.simpleViewWithPlaceholder = new lemon.Route({
    'view': 'test',
    'rule':'/test/<param1>/<param2>/',
    'keys': ['<param1>', '<param2>'],
    'params': {
        'params1': '<param1>'
    },
    'fetch': {
        'endpoint': '/api/',
        'params': {
            'params2': '<param2>'
        }
    }
});


lemon.fixtures.router.simpleViewUrlSamples = [
    '/artist/Michael/',
    '/artist/Myron'];


lemon.fixtures.router.simpleRoute = {
    'view': 'test',
    'rule': '/test/',
    'params': {
        'param1': 'value1'
    },
    'fetch': null
};
