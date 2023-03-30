import { addons } from '../addonstore.js';

async function addonEndpoint(req, exterResponse, next) {
    exterResponse.contentType('application/json');
    exterResponse.status(200).end(JSON.stringify(addons));
}

async function addonPostEndpoint(req, exterResponse, next) {
    let payload = JSON.parse(req.body);
    if(payload.enable === false) {
        addons.disableAddon(payload.addon);
    } if(payload.enable === true) {
        addons.enableAddon(payload.addon);
    }
    exterResponse.contentType('application/json');
    exterResponse.status(200).end(JSON.stringify({"status": "ok"}));
}

export {
    addonEndpoint,
    addonPostEndpoint,
};
