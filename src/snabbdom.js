const snabbdom = require('snabbdom');
snabbdom.attributes = require('snabbdom/modules/attributes').default;
snabbdom.props = require('snabbdom/modules/props').default;
snabbdom.classList = require('snabbdom/modules/class').default;
snabbdom.style = require('snabbdom/modules/style').default;
snabbdom.events = require('snabbdom/modules/eventlisteners').default;
snabbdom.h = require('snabbdom/h').default;

module.exports = snabbdom;
