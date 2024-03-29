import fs from 'fs';

import * as htmlparser2 from 'htmlparser2';
import * as csstree from 'css-tree';

import { addons } from './addonstore.js';
import { config } from './config.js';
import { wrapUrl } from './utils.js';
import { registerEventHandler, scriptPrefix, scriptPostfix } from '../shared/events.js';

let browserScripts = [];
for(const f of config.browserFiles) {
    try {
        let s = fs.readFileSync(config.projectDir+'/'+f, 'utf8');
        // TODO this is a dirty hack to get rid of export keywords in shared files
        s = s.replace(/\nexport .+/g, '\n');
        browserScripts.push(s);
    } catch (err) {
        console.error(err);
    }
}
browserScripts = browserScripts.join('');

function makeRandomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for(var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function writeBrowserPayload(response, vars) {
    let addonPayloads = addons.getBrowserScripts();
    let namespace = makeRandomString(10);
    vars['namespace'] = namespace;
    vars['addons'] = addons.getBrowserVars();
    vars = JSON.stringify(vars);
    response.write(`<script>
(function ${namespace}(console, document, window, HTMLElement) {
'use strict';
let vars = ${vars};
${browserScripts}
${addonPayloads}
})(console, document, window, HTMLElement);
</script>
`);
}

const attributeHandlers = {
    'a': handleHref,
    'form': handleAction,
    'img': handleSrc,
    'meta': handleMetaAttrs,
    'script': handleSrc,
    'source': handleSrc,
}

const elementHandlers = {
    link: handleLinkElement
}

const elementTextHandlers = {
    "style": transformStyle,
}

const selfClosingTags = {
    'area': true,
    'base': true,
    'br': true,
    'col': true,
    'embed': true,
    'hr': true,
    'img': true,
    'input': true,
    'link': true,
    'meta': true,
    'param': true,
    'source': true,
    'track': true,
    'wbr': true,
}

function transformHtml(response, exterResponse, url) {
    let textTagname = '';
    const parser = new htmlparser2.Parser({
        onopentag(tagname, attributes) {
            let addCloseTag = false;
            if(elementHandlers[tagname]) {
                let ret = elementHandlers[tagname](tagname, attributes, url);
                if(selfClosingTags[tagname] && !selfClosingTags[ret[0]]) {
                    addCloseTag = true;
                }
                tagname = ret[0];
                textTagname = ret[0];
                attributes = ret[1];
            } else {
                textTagname = tagname;
            }
            const handler = attributeHandlers[tagname];
            if(handler) {
                handler(attributes, url);
            }
            let tagStr = `<${tagname}`;
            for(let [k, v] of Object.entries(attributes)) {
                if(k.toLowerCase().startsWith("on")) {
                    v = scriptPrefix+v+scriptPostfix;
                }
                // TODO check sanitization
                tagStr += ` ${k}="${v}"`;
            }
            exterResponse.write(tagStr + (selfClosingTags[tagname] ? '/>' : '>'));
            if(tagname == "script") {
                exterResponse.write(scriptPrefix);
            }
            if(addCloseTag) {
                exterResponse.write(`</${tagname}>`);
            }
        },
        ontext(text) {
            const handler = elementTextHandlers[textTagname];
            if(handler) {
                text = handler(text, url);
            }
            exterResponse.write(text);
        },
        onclosetag(tagname) {
            textTagname = '';
            if(tagname == "script") {
                exterResponse.write(scriptPostfix);
            }
            if(!selfClosingTags[tagname]) {
                exterResponse.write(`</${tagname}>`);
            }
        }
    });
    writeBrowserPayload(
        exterResponse,
        {
            url: url,
            debug: config.debug,
        }
    );
    parser.write(response.body.toString());
    exterResponse.end();
}

function transformCss(response, exterResponse, url) {
    exterResponse.write(transformStyle(response.body.toString(), url));
    exterResponse.end();
}

function transformScript(response, exterResponse, url) {
    exterResponse.write(scriptPrefix+response.body.toString()+scriptPostfix);
    exterResponse.end();
}

function transformStyle(style, url) {
    const ast = csstree.parse(style);
    csstree.walk(ast, (node) => {
        if(node.type == "Url") {
            node.value = wrapUrl(node.value, url);
        }
    });
    return csstree.generate(ast);
}

function addScriptWrapper(script, url) {
    return scriptPrefix+script+scriptPostfix;
}

function handleHref(attributes, url) {
    if(attributes.href) {
        attributes.href = wrapUrl(attributes.href, url);
    }
}

function handleSrc(attributes, url) {
    if(attributes.src) {
        attributes.src = wrapUrl(attributes.src, url);
    }
    if(attributes.srcset) {
        let parts = attributes.srcset.split(",").map(x => x.trim());
        for(const i in parts) {
            let src = parts[i].split(' ').map(x => x.trim());
            src[0] = wrapUrl(src[0], url);
            parts[i] = src.join(' ');
        }
        attributes.srcset = parts.join(', ');
    }
    if(attributes.loading) {
        attributes.loading = 'eager';
    }
}

function handleAction(attributes, url) {
    if(attributes.action) {
        attributes.action = wrapUrl(attributes.action, url);
    }
}

function handleMetaAttrs(attributes, url) {
    if(attributes['http-equiv']) {
        attributes.content = '';
    }
    if(attributes['itemprop'] == 'image') {
        attributes.content = wrapUrl(attributes.content, url);
    }
}

function handleLinkElement(name, attributes, url) {
    if(attributes.rel == 'preload') {
        if(attributes.as == 'script') {
            name = 'script';
            attributes = {src: wrapUrl(attributes.href, url)};
        }
    }
    if(attributes.href) {
        attributes.href = wrapUrl(attributes.href, url);
    }
    return [name, attributes];
}

export {
    transformHtml,
    transformCss,
    transformScript,
};
