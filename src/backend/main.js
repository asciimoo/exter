import express from 'express';

import { mainRouter } from './router.js';
import { config } from './config.js';

const app = express();
const port = 3000;

app.use(express.raw({'type': () => true}));
app.use('/', mainRouter);
app.use('/static', express.static(config.staticDir))

function startBackend() {
    app.listen(port, () => {
        console.log('Listening on http://127.0.0.1:'+port+'/');
    });
}

export { startBackend };
