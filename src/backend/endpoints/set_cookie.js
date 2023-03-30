import { jar } from '../cookies.js';
import { log } from '../logging.js';


// TODO authorize request
async function setCookie(req, resp) {
    if(req.query.cookie && req.query.url) {
        let cookie = req.query.cookie;
        try {
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
