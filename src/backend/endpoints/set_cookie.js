import { jar } from '../cookies.js';
import { log } from '../logging.js';
import url from 'node:url';


// TODO authorize request
async function setCookie(req, resp) {
    if(req.query.cookie && req.query.url) {
        let cookie = req.query.cookie;
        try {
            let host = req.headers.host.split(':')[0];
            if(cookie.search(`domain=${host};`) > -1) {
                let u = url.parse(req.query.url);
                cookie = cookie.replace(`domain=${host};`, `domain=${u.host};`);
            }
            jar.setCookieSync(cookie, req.query.url);
        } catch(err) {
            log.error("Failed to set cookie", err, cookie, req.query.url);
        }
    }
    resp.send('OK');
}

export {
    setCookie,
}
