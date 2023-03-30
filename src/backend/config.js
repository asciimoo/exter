import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    debug: true,
    dbConn: 'sqlite::memory:', // postgres: 'postgres://user:pass@example.com:5432/dbname' ; requires npm i pg pg-hstore
    browserFiles: [
        'browser/wrap.js',
        'browser/frontend.js',
        'shared/events.js',
    ],
    __dirname: __dirname,
    projectDir: path.join(__dirname, '..'),
    browserDir: path.join(__dirname, '../', 'browser'),
    addonDir: path.join(__dirname, '../', 'addons'),
    staticDir: path.join(__dirname, '../', 'static'),
    addonsEnabled: ['example', 'norefer' ]
}


export { config };
