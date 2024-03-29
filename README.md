# Exter

Exter is a web based plugin platform which allows addons to alter websites behavior/style/functionality.
Instead of trusting the browsers' plugin ecosystem, let's modify the websites before browsers receive them!

The goal of this project is to provide a stable and free website-extension-platform to allow future proof and flexible plugin development for a free internet.


## [Documentation](https://asciimoo.github.io/exter/)


## Warning

This project is in a very early stage, the functionality is far from complete and the API is subject of radical changes.
Also I'm not a JS coder, the code probably contains tons of suboptimal and nonidiomatic solutions.

#### Suggestions and contributions are greatly appreciated!


## Why?

We have well establised browser extension ecosystem for the exact same purpose, why do we need a similar service?

Well, while chromium based browsers dominating the browser market, the decision about the future of the web extension api is pretty much in one companies hands.
Introducing more and more restrictions to the web extension api and setting up barriers to publish browser addons can harm the freedom of browser plugins and plugin development - especially of the privacy/security related plugins.


## How?

Exter is a web application which opens URLs, rewrites the static content and injects client scripts to wrap default javascript functions, applies addons, then sends the sanitized/modified website to the browser.
This way we have the ability to intercept/modify not only HTTP requests, but even client side functionalities, like sanitizing 3rd party content or appending new DOM elements to the website or altering cookie handling from javascript, etc...

Both the backend and the injected client scripts define multiple events like HTTP request/response, DOM modification, etc.. Addons can subscribe to any subset of these events allowing the addon to alter or cancel the events.

### Pros & cons

#### Pros
 - No profit driven API changes
 - Browser independent
 - Addons can be applied to websites without installation & links of the results are shareable
 - Extra features that are not available in the browser/web-extension-API (e.g. custom HTTPS cert check, custom session/cookie management, automatic content saving)

#### Cons
 - Increased page load time
 - More browser resources required


## License

Project is licensed under [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html) **except the addons**. Addons are not part of the core application, independent licensing required in every individual addon. Addons are located in the [addons](https://github.com/asciimoo/exter/tree/master/src/addons) folder and loaded by [addonstore.js](https://github.com/asciimoo/exter/blob/master/src/backend/addonstore.js).

## TODO

First of all, handle TODOS properly using issues.

### App
 - Create & document the full addon API
 - Add multi-user support
 - Config management
 - Support SSL/TLS level addon access
 - Performance optimizations
 - Provide UI primitives to addon UIs

### Addons
 - Browser/backend communication
 - Persistent storage
 - Find a solution to allow addons to use the original (not wrapped) js functions
 - Define more events

### Browser rewrites (a.k.a wrap.js)
 - Form file upload
 - Wrap
   - remaining dom manipulation functions
    - event listener handlers
    - document.location
    - ShadowRoot
    - ...etc
 - Sanitize/transform html added by client js
 - Handle video/embedded multimedia

### Tests

### Documentation
 - API/event documentation for addon devs
 - Platform documentation for contributors
 - Usage documentation for users
