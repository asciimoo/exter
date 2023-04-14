// TODO set functions toString() properly

/*  document.getElementsByTagName('script')[0].innerText = ''; */

// o is the container of the original js functions
let o = {};

function wrapUrl(url, base, prefix) {
    if(url && (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('javascript:')
               || url.startsWith('/open/http://') ||  url.startsWith('/open/https://') || url.startsWith('/ajax/http://') || url.startsWith('/ajax/https://'))) {
        return url;
    }
    if(base) {
        url = new URL(url, base).href;
    }
    return prefix + encodeURI(url);
}

function unwrapUrl(url) {
    if(!url) {
        return url;
    }
    if(url.startsWith('/open/http://') ||  url.startsWith('/open/https://') || url.startsWith('/ajax/http://') || url.startsWith('/ajax/https://')) {
        return url.slice(url.indexOf('http'));
    }
    return url;
}

/*
 *  _    _
 * | |  | |
 * | |  | |_ __ __ _ _ __
 * | |/\| | '__/ _` | '_ \
 * \  /\  | | | (_| | |_) |
 *  \/  \/|_|  \__,_| .__/
 *                  | |
 *                  |_|
 *
 * Wrap functions to be able
 * to intercept client code
 */

let domEditFunctions = [
    'appendChild',
    'prependChild',
    'append',
    'prepend',
    'replaceWith',
    'replaceChild',
];

//TODO
// createElement

// wrap functions
function wrapFn(name, origFn, newFn) {
    o[name] = origFn;
    return function() {
        // TODO call original function in this namespace
        if(this.ownCode == vars['namespace']) {
            return origFn.call(this, ...arguments);
        } else {
            return newFn.call(this, ...arguments);
        }
    };
}

// Wrap getters/setters
function wrapGS(name, origGS, newGS) {
    o[name] = Object.getOwnPropertyDescriptor(origGS, name);
    Object.defineProperty(origGS, name, newGS);
}

console.log = wrapFn(
    'console_log', console.log,
    function() {
        o['console_log']("[APP_LOG]", ...arguments);
    }
);

for(const f of domEditFunctions) {
    HTMLElement.prototype[f] = wrapFn(
        f, HTMLElement.prototype[f],
        function() {
            debug(f, this, ...arguments);
            fixDOM(arguments[0]);
            let params = {
                'args': arguments,
                'element': this,
                'abort': false,
                'type': f,
            };
            params = createEvents([f, 'domEdit'], params);
            if(params.abort) {
                return;
            }
            return o[f].call(params.element, ...params.args);
        }
    );
}

HTMLElement.prototype.setAttribute = wrapFn(
    'setAttribute', HTMLElement.prototype.setAttribute,
    function() {
        debug("setAttribute", arguments[0], "=", arguments[1]);
        let params = {
            'args': arguments,
            'element': this,
            'abort': false,
        };
        params = createEvents(['setAttribute', 'domEdit'], params);
        if(params.abort) {
            return;
        }
        if(params.args[0] == 'href' || params.args[0] == 'src' || params.args[0] == 'action') {
            params.args[1] = wrapUrl(params.args[1], vars['url'], '/open/');
        }
        o['setAttribute'].call(params.element, ...params.args);
    }
);

HTMLElement.prototype.getAttribute = wrapFn(
    'getAttribute', HTMLElement.prototype.getAttribute,
    function() {
        debug("getAttribute", this, arguments[0]);
        let attr = o['getAttribute'].call(this, ...arguments);
        if(arguments[0] == 'href' || arguments[0] == 'src' || arguments[0] == 'action') {
            attr = unwrapUrl(attr);
        }
        return attr;
    }
);

XMLHttpRequest.prototype.send = wrapFn(
    'XMLHttpRequest_send', XMLHttpRequest.prototype.send,
    function() {
        debug("XMLHttpRequest.send", );
        o['XMLHttpRequest_send'].call(this, ...arguments);
    }
);

XMLHttpRequest.prototype.open = wrapFn(
    'XMLHttpRequest_open', XMLHttpRequest.prototype.open,
    function(method, url) {
        debug("XMLHttpRequest.open", url);
        url = wrapUrl(url, vars['url'], '/ajax/');
        o['XMLHttpRequest_open'].call(this, ...arguments);
    }
);

// TODO XMLHttpRequest.prototype.onreadystatechange

wrapGS(
    'innerText', HTMLElement.prototype,
    {
        get() {
            debug('Getting innerText');
            return o['innerText'].get.call(this);
        },
        set(value) {
            debug('innerText =', value);
            return o['innerText'].set.call(this, value);
        }
    }
);

wrapGS(
    'innerHTML', HTMLElement.prototype.__proto__,
    {
        get() {
            debug('Getting innerHTML');
            return o['innerHTML'].get.call(this);
        },
        set(value) {
            let div = document.createElement('DIV');
            o['innerHTML'].set.call(div, value);
            fixDOM(div);
            value = o['innerHTML'].get.call(div);
            debug('innerHTML =', value);
            return o['innerHTML'].set.call(this, value);
        }
    }
);

wrapGS(
    'cookie', document.__proto__.__proto__,
    {
        get() {
            debug('Get cookie', this, ...arguments);
            return o['cookie'].get.call(this);
        },
        set(value) {
            debug('Setting cookie=', value);
            let cookie = encodeURIComponent(value);
            let url = encodeURIComponent(vars['url']);
            fetch(`/set_cookie?cookie=${cookie}&url=${url}`);
            return o['cookie'].set.call(this, ...arguments);
        }
    }
);

function debug() {
    if(!vars.debug) return;
    o['console_log']("[EXTER_LOG]", ...arguments);
}

/*
 *
 * ______         _
 * | ___ \       | |
 * | |_/ /___ ___| |_ ___  _ __ ___
 * |    // _ / __| __/ _ \| '__/ _ \
 * | |\ |  __\__ | || (_) | | |  __/
 * \_| \_\___|___/\__\___/|_|  \___|
 *
 * Restore wrapped functions in this
 * scope to allow addons to use the
 * original functions
 *
 */


var console = copyObj(console);;
console.ownCode = vars['namespace'];

// TODO find a way to restore HTMLElement/document/etc


/*
 *  _   _ _   _ _
 * | | | | | (_| |
 * | | | | |_ _| |___
 * | | | | __| | / __|
 * | |_| | |_| | \__ \
 *  \___/ \__|_|_|___/
 *
 * Other utility methods
 *
 */


function copyObj(src) {
    return Object.assign({}, src);
}

let nodeTransformFunctons = {
    'A': transformLink,
    'FORM': transformAction,
    'IMG': transformSrc,
    'LINK': transformLink,
    'SCRIPT': transformSrc,
};

function fixDOM(node) {
    let fn = nodeTransformFunctons[node.nodeName];
    if(fn) {
        fn(node);
    }
    node = node.firstChild;
    while(node) {
        fixDOM(node);
        node = node.nextSibling;
    }
};

function transformLink(link) {
    const href = o['getAttribute'].call(link, 'href');
    if(href) {
        o['setAttribute'].call(link, 'href', wrapUrl(href, vars['url'], '/open/'));
    }
}


function transformSrc(el) {
    const src = o['getAttribute'].call(el, 'src');
    if(src) {
        o['setAttribute'].call(el, 'src', wrapUrl(src, vars['url'], '/open/'));
    }
}


function transformAction(form) {
    const action = o['getAttribute'].call(form, 'action');
    if(action) {
        o['setAttribute'].call(form, 'href', wrapUrl(action, vars['url'], '/open/'));
    }
}
