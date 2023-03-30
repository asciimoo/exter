import url from 'node:url';

import got from 'got';

import { jar } from '../cookies.js';
import { addRequest } from '../model.js';
import { createEvents } from '../../shared/events.js';
import { wrapUrl } from '../utils.js';
import {
    transformHtml,
    transformCss
} from '../transform.js';


const responseTypeHandlers = {
    'text/html': transformHtml,
    'text/css': transformCss,
};

function getDefaultRequestOptions() {
    return {
        cookieJar: jar,
        responseType: 'buffer'
    };
};

function getDefaultRequestHeaders() {
    return {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
    };
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
        'headers': getDefaultRequestHeaders()
    };
    params.headers['Referer'] = extractOriginalURL(req.get('Referer'));
    if(req.method == 'POST') {
        doRequest = got.post;
        params.options.body = req.body;
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
    doRequest(params.url, params.options).then(async response => {
        if(response.redirectUrls.length) {
            params.url = response.redirectUrls.slice(-1)[0].href;
        }
        console.log("Fetching ", response.statusCode, req.method, params.url);
        const ctype = (response.headers['content-type'] || '').split(';')[0].toLowerCase();
        await addRequest(params.url, response.statusCode, ctype);
        const responseHandler = responseTypeHandlers[ctype];
        if(responseHandler !== undefined) {
            responseHandler(response, exterResponse, url);
        } else {
            exterResponse.contentType(response.headers['content-type'] || '');
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
