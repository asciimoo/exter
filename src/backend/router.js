import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadEndpoint } from './endpoints/download.js';
import { addonEndpoint, addonPostEndpoint } from './endpoints/addon.js';
import { setCookie } from './endpoints/set_cookie.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mainRouter = express.Router();

mainRouter.route('/').get(function (req, res) {
    res.sendFile(path.join(__dirname, '../', 'static', 'index.html'));
});

mainRouter.route('/open/*').get(downloadEndpoint);
mainRouter.route('/ajax/*').get(downloadEndpoint);
mainRouter.route('/open/*').post(downloadEndpoint);
mainRouter.route('/ajax/*').post(downloadEndpoint);

mainRouter.route('/addons').get(addonEndpoint);
mainRouter.route('/addons').post(addonPostEndpoint);

mainRouter.route('/set_cookie').get(setCookie);

export {
    mainRouter,
};
