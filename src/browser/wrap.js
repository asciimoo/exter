// TODO set functions toString() properly

/*  document.getElementsByTagName('script')[0].innerText = ''; */

// o is the container of the original js functions
let o = {};

function wrapUrl(url, base, prefix) {
    if(typeof url != "string" || (url.startsWith('data:')
               || url.startsWith('mailto:') || url.startsWith('javascript:')
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
    'insertBefore',
    'insertAdjacentElement'
];

//TODO
// createElement

// wrap functions
function wrapFn(name, origFn, newFn) {
    o[name] = origFn;
    return function() {
        // TODO call original function in this namespace
        return newFn.call(this, ...arguments);
    };
}

// Wrap getters/setters
function wrapGS(name, obj, newGS) {
    o[name] = Object.getOwnPropertyDescriptor(obj, name);
    Object.defineProperty(obj, name, newGS);
}
function wrapGSWithCustomName(name, property, obj, newGS) {
    o[name] = Object.getOwnPropertyDescriptor(obj, property);
    Object.defineProperty(obj, property, newGS);
}

console.log = wrapFn(
    'console_log', console.log,
    function() {
        o['console_log']("[APP_LOG]", ...arguments);
    }
);

/*
 * HTMLElement
 */

for(const f of domEditFunctions) {
    HTMLElement.prototype[f] = wrapFn(
        f, HTMLElement.prototype[f],
        function() {
            fixDOM(arguments[0]);
            let params = {
                'args': arguments,
                'element': this,
                'abort': false,
                'type': f,
            };
            params = createEvents([f, 'domEdit'], params);
            if(params.abort) {
                return null;
            }
            return o[f].call(params.element, ...params.args);
        }
    );
}

HTMLElement.prototype.setAttribute = wrapFn(
    'setAttribute', HTMLElement.prototype.setAttribute,
    function() {
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
        let attr = o['getAttribute'].call(this, ...arguments);
        if(arguments[0] == 'href' || arguments[0] == 'src' || arguments[0] == 'action') {
            attr = unwrapUrl(attr);
        }
        return attr;
    }
);

wrapGS(
    'innerText', HTMLElement.prototype,
    {
        get() {
            return o['innerText'].get.call(this);
        },
        set(value) {
            return o['innerText'].set.call(this, value);
        }
    }
);

wrapGS(
    'innerHTML', HTMLElement.prototype.__proto__,
    {
        get() {
            return o['innerHTML'].get.call(this);
        },
        set(value) {
            let div = document.createElement('DIV');
            o['innerHTML'].set.call(div, value);
            fixDOM(div);
            value = o['innerHTML'].get.call(div);
            return o['innerHTML'].set.call(this, value);
        }
    }
);

wrapGSWithCustomName(
    'attrValue', 'value', Attr.prototype,
    {
        get() {
            let ret = o['attrValue'].get.call(this);
            if(this.name == 'href' || this.name == 'src' || this.name == 'action') {
                ret = unwrapUrl(ret);
            }
            return ret;
        },
        set(newValue) {
            if(this.name == 'href' || this.name == 'src' || this.name == 'action') {
                newValue = wrapUrl(newValue, vars['url'], '/open/');
            }
            return o['attrValue'].set.call(this, newValue);
        }
    }
);

/*
 * Cookie
 */

wrapGS(
    'cookie', document.__proto__.__proto__,
    {
        get() {
            return o['cookie'].get.call(this, ...arguments);
        },
        set(value) {
            // TODO handle domain
            let cookie = encodeURIComponent(value);
            let url = encodeURIComponent(vars['url']);
            o['fetch'](`/set_cookie?cookie=${cookie}&url=${url}`);
            return o['cookie'].set.call(this, ...arguments);
        }
    }
);

/*
 * History
 */

history.__proto__.pushState = wrapFn(
    'pushState', window.history.__proto__.pushState,
    function() {
        arguments[2] = wrapUrl(arguments[2], vars['url'], '/open/');
        return o['pushState'].call(this, ...arguments);
    }
);

history.__proto__.replaceState = wrapFn(
    'replaceState', window.history.__proto__.replaceState,
    function() {
        arguments[2] = wrapUrl(arguments[2], vars['url'], '/open/');
        return o['replaceState'].call(this, ...arguments);
    }
);

// TODO
// history.state , PopStateEvent

///*
//  Location
//*/
//
//wrapGS(
//    'location', window.__proto__,
//    {
//        get() {
//            return vars['url'];
//        },
//        set(u) {
//            // TODO handle domain
//            let cookie = encodeURIComponent(value);
//            let url = encodeURIComponent(vars['url']);
//            return o['locationHref'] = wrapUrl(u, vars['url'], '/open/');
//        }
//    }
//);

/*
  Window Window.location
*/

// TODO wrap/unwrap dynamic script tags/attributes with scriptPrefix & scriptPostfix

let loc = {};

Object.defineProperty(loc, "href", {
    get() {
        return vars['url'];
    },
    set(u) {
        //let url = encodeURIComponent(vars['url']);
        window.location.href = wrapUrl(u, vars['url'], '/open/');
    }
});
// TODO other window.location members: https://www.w3schools.com/js/js_window_location.asp

window.getLocation = () => {
    return loc;
};

function getProxyFactory(o) {
    return (scope) => {
        let w = new Proxy(window, {
            get(target, prop, receiver) {
                switch(prop) {
                case "window":
                    return receiver;
                case "location":
                    return loc;
                case "getLocation", "getProxy", "0":
                    return undefined;
                case "addEventListener":
                    return window.addEventListener.bind(window);
                case "removeEventListener":
                    return window.addEventListener.bind(window);
                case "postMessage":
                    return window.postMessage.bind(window);
                }
                return target[prop];
            },
            set(obj, prop, value) {
                if(prop == "location") {
                    window.location.href = wrapUrl(value, vars['url'], '/open/');
                } else {
                    obj[prop] = value;
                }
            },
            GetPrototypeOf() {
                return Window;
            }
        });
        return w;
    };
}

window.getProxy = getProxyFactory(o);

/*
  AJAX
*/

XMLHttpRequest.prototype.send = wrapFn(
    'XMLHttpRequest_send', XMLHttpRequest.prototype.send,
    function() {
        debuglog("XMLHttpRequest.send");
        return o['XMLHttpRequest_send'].call(this, ...arguments);
    }
);

XMLHttpRequest.prototype.open = wrapFn(
    'XMLHttpRequest_open', XMLHttpRequest.prototype.open,
    function(method, url) {
        url = wrapUrl(url, vars['url'], '/ajax/');
        debuglog("XMLHttpRequest.open", url);
        return o['XMLHttpRequest_open'].call(this, ...arguments);
    }
);

// TODO XMLHttpRequest.prototype.onreadystatechange

o['fetch'] = window.fetch.bind(window);
fetch = async function() {
    debuglog("FETCH", arguments);
    arguments[0] = wrapUrl(arguments[0], vars['url'], '/ajax/');
    return o['fetch'].call(this, ...arguments);
};

/*
 * Iframe content window
 */

let iframeContentWindows = {};

wrapGSWithCustomName(
    'iframeContentWindow', 'contentWindow', HTMLIFrameElement.prototype,
    {
        get() {
            if(!iframeContentWindows[this]) {
                // TODO rewrite all iframe contentWindow functions
                let cw = o['iframeContentWindow'].get.call(this);
                cw.history.__proto__ = history.__proto__;
                cw.HTMLElement.prototype = HTMLElement.prototype;
                cw.fetch = fetch;
                cw.XMLHttpRequest.prototype = XMLHttpRequest.prototype;
                iframeContentWindows[this] = cw;
            }
            return iframeContentWindows[this];
        },
        set(value) {
        }
    }
);


/*
 * Misc
 */

function debuglog() {
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


var console = copyObj(console);

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
