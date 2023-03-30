import { registerEventHandler } from '../../shared/events.js';

registerEventHandler("Request", function(params) {
    delete params.headers['Referer'];
    return params;
});
