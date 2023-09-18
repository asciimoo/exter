import url from 'node:url';

import got from 'got';

import { jar } from '../cookies.js';
import { addRequest } from '../model.js';
import { createEvents } from '../../shared/events.js';
import { wrapUrl } from '../utils.js';
import {
    transformHtml,
    transformCss,
    transformScript,
} from '../transform.js';


const responseTypeHandlers = {
    'text/html': transformHtml,
    'text/css': transformCss,
    'text/javascript': transformScript,
};

function getDefaultRequestOptions() {
    return {
        cookieJar: jar,
        responseType: 'buffer'
    };
};

function getDefaultRequestHeaders(reqHeaders, url) {
    let headers = {};
    for(let k in reqHeaders) {
        if(k == "host" || k == "cookie" || k == "content-length" || k == "referer" || k == "origin") {
            continue;
        }
        headers[k] = reqHeaders[k];
    }
    let urlParts = url.split('/');
    headers['origin'] = `${urlParts[0]}//${urlParts[2]}`;
    return headers;
}

function serializeQuery(obj) {
  var str = [];
  for(const p in obj)
    if(obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

function extractOriginalURL(u) {
    if(!u) {
        return '';
    }
    u = url.parse(u);
    if(u.path.startsWith('/open/') || u.path.startsWith('/ajax/')) {
        return u.path.substr(6);
    }
    return '';
}

function setResponseHeaders(response, exterResponse) {
    for(let k in response.headers) {
        // TODO
        let lk = k.toLowerCase();
        if(lk.startsWith("content-security") || lk.startsWith("cross-origin") || lk == 'set-cookie' || lk == 'connection' || lk == 'strict-transport-security' || lk == 'content-encoding' || lk == 'content-length') {
            continue;
        }
        exterResponse.header(k, response.headers[k]);
    }
}

async function downloadEndpoint(req, exterResponse, next) {
    let url = req.params[0];
    if(!url) {
        url = req.query.url;
        if(!url) {
            exterResponse.status(404).write('Missing url');
            return;
        }
        exterResponse.redirect(wrapUrl(url));
        return;
    }
    if(!url.includes('://')) {
        // url bar replaces // in path to /
        if(url.includes(':/')) {
            url = url.replace(':/', '://');
        } else {
            exterResponse.status(500).write('Invalid url');
            return;
        }
    }
    if(req.query) {
        const qs = serializeQuery(req.query);
        if(qs) {
            url = `${url}?${qs}`;
        }
    }
    const start = new Date().getTime();
    let doRequest = got.get;
    let params = {
        'abort': false,
        'url': url,
        'options': getDefaultRequestOptions(),
        'headers': getDefaultRequestHeaders(req.headers, url)
    };
    params.headers['referer'] = extractOriginalURL(req.get('Referer'));
    if(req.method == 'POST' || req.method == 'PATCH') {
        doRequest = got.post;
        if(req.headers['content-type'] == 'application/json') {
            params.options.body = req.body.toString('utf8');
        } else {
            params.options.body = req.body;
        }
        params.headers['content-type'] = req.headers['content-type'];
    }
    let newParams = createEvents('Request', params);
    if(newParams) {
        params = newParams;
    }
    if(params.abort) {
        // TODO
        return;
    }
    params.options.headers = params.headers;
    console.log("Fetching ", req.method, params.url);
    doRequest(params.url, params.options).then(async response => {
        if(response.redirectUrls.length) {
            params.url = response.redirectUrls.slice(-1)[0].href;
        }
        const ctype = (response.headers['content-type'] || '').split(';')[0].toLowerCase();
        await addRequest(params.url, response.statusCode, ctype);
        const responseHandler = responseTypeHandlers[ctype];
        exterResponse.status(response.statusCode);
        setResponseHeaders(response, exterResponse);
        if(responseHandler !== undefined) {
            responseHandler(response, exterResponse, url);
        } else {
            //exterResponse.set(response.headers);
            exterResponse.status(200).end(response.body, 'binary');
        }
        console.log(new Date().getTime()-start);
    }).catch(err => {
        console.log("MEEEEEEEH", params.url);
        next(err);
    });
}

export {
    downloadEndpoint,
};
