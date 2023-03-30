import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { log } from './logging.js';


class AddonStore {
    constructor() {
        this.addonsAvailable = {};
        this.reload();
    }
    reload() {
        this.addonsAvailable = {};
        fs.readdirSync(config.addonDir).forEach(fname => {
            if(fname.startsWith(".")) {
                return;
            }
            const fullPath = path.join(config.addonDir,fname);
            if(!fs.lstatSync(fullPath).isDirectory()) {
                return;
            }
            let addon = loadAddon(fullPath, this);
        });
    }
    enableAddon(name) {
        this.addonsAvailable[name].enabled = true;
    }
    disableAddon(name) {
        this.addonsAvailable[name].enabled = false;
    }
    getEnabledAddons() {
        return Object.values(this.addonsAvailable).filter((addon) => addon.enabled);
    }
    getBrowserScripts() {
        return this.getEnabledAddons().map(x => x.browser).join('\n');
    }
    getBrowserVars() {
        const vars = [];
        for(const addon of this.getEnabledAddons()) {
            vars.push({
                icon: addon.manifest.icon,
                dir: addon.dir,
                name: addon.manifest.name,
                views: addon.views
            });
        }
        return vars;
    }
}

function loadAddon(addonPath, store) {
    function readAddonFile(fileName) {
        return fs.readFileSync(path.join(addonPath, fileName)).toString('utf-8');
    }
    // load manifest
    let manifest;
    try {
        manifest = parseManifest(readAddonFile('manifest.json'));
        if(store.addonsAvailable[manifest.name]) {
            throw new Error("addon with the same name already exists: " + manifest.name);
        }
    } catch(err) {
        log.error("Failed to load addon", addonPath , ": missing or invalid manifest.json:", err.message);
        return;
    }
    // load browser scripts
    const addon = {
        path: addonPath,
        dir: path.basename(addonPath),
        enabled: config.addonsEnabled.includes(manifest.name),
    };
    if(manifest.views) {
        addon.views = {};
        if(manifest.views.popup) {
            try {
                addon.views.popup = readAddonFile(manifest.views.popup);
            } catch(err) {
                log.error("Failed to load addon", addonPath , ": missing or invalid popup view:",  manifest.views.popup, ': ', err.message);
                return;
            }
        }
    }
    if(manifest.scripts.browser) {
        try {
            addon['browser'] = readAddonFile(manifest.scripts.browser);
        } catch(err) {
            log.error("Failed to load addon", manifest.name, ":", err.message);
            return;
        }
        if(!manifest.scripts.server) {
            log.info("addon", "'"+manifest.name+"'", "loaded");
            addon['manifest'] = manifest;
        }
    }
    // load backend scripts
    store.addonsAvailable[manifest.name] = addon;
    if(manifest.scripts.server) {
        const codePath = path.join(addonPath, manifest.scripts.server);
        import(codePath).then(module => {
            addon['server'] = module;
            addon['manifest'] = manifest;
            if(module.init) {
                module.init();
            }
            log.info("addon", "'"+manifest.name+"'", "loaded");
        }).catch(err => {
            delete(store.addonsAvailable[manifest.name]);
            log.error("failed to load module", manifest.name, err.stack);
        });
    }
    // copy icon to static dir
    try {
        copyIcon(addonPath, manifest.icon);
    } catch(err) {
        log.error("Failed to copy icon for ", addonPath , ":", err.stack);
        return;
    }
}

function parseManifest(fileContent) {
    let manifest = JSON.parse(fileContent);
    // TODO complete validation
    if(!manifest.scripts) {
        throw new Error("missing 'scripts' parameter");
    }
    if(!manifest.name) {
        throw new Error("missing 'name' parameter");
    }
    if(!manifest.icon) {
        throw new Error("missing 'icon' parameter");
    }
    return manifest;
}

function copyIcon(addonPath, iconName) {
    const addonDir = path.basename(addonPath);
    const staticPath = path.join(config.staticDir, 'addons', addonDir);
    try {
        if(!fs.lstatSync(staticPath).isDirectory()) {
            fs.mkdirSync(staticPath);
        }
    } catch {
        fs.mkdirSync(staticPath);
    }
    fs.copyFileSync(path.join(addonPath, iconName), path.join(staticPath, iconName));
}

const addons = new AddonStore();

export {
    addons,
};
