const events = {
};

function registerEventHandler(names, handler) {
    if(typeof names == 'string') {
        appendEventHandler(names, handler);
    } else {
        for(const name of names) {
            appendEventHandler(name, handler);
        }
    }
}

function appendEventHandler(name, handler) {
    if(!events[name]) {
        events[name] = new Array(handler);
    } else {
        events[name].push(handler);
    }
}

function createEvents(names, args) {
    if(!Array.isArray(names)) {
        names = [names];
    }
    const handlers = new Set();
    for(const name of names) {
        if(!events[name]) {
            continue;
        }
        for(const handler of events[name]) {
            handlers.add(handler)
        }
    }
    for(const handler of handlers) {
        let newArgs = handler(args);
        if(newArgs) {
            args = newArgs;
        }
    }
    return args;
}

export { registerEventHandler, createEvents };
