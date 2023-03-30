---
layout: templates/base.njk
category: start
---

Exter is a web based plugin platform which allows addons to alter websites behavior/style/functionality.
Instead of trusting the browsers' plugin ecosystem, let's modify the websites before browsers receive them!

The goal of this project is to provide a stable and free website-extension-platform to allow future proof and flexible plugin development for a free internet.


## Why?

We have well establised browser extension ecosystem for the exact same purpose, why do we need a similar service?

Well, while chromium based browsers dominating the browser market, the decision about the future of the web extension api is pretty much in one companies hands.
Introducing more and more restrictions to the web extension api and setting up barriers to publish browser addons can harm the freedom of browser plugins and plugin development - especially of the privacy/security related plugins.


## How?

Exter is a web application which opens URLs, rewrites the static content and injects client scripts to wrap default javascript functions, applies addons, then sends the sanitized/modified website to the browser.
This way we have the ability to intercept/modify not only HTTP requests, but even client side functionalities, like sanitizing 3rd party content or appending new DOM elements to the website or altering cookie handling from javascript, etc...

Both the backend and the injected client scripts define multiple events like HTTP request/response, DOM modification, etc.. Addons can subscribe to any subset of these events allowing the addon to alter or cancel the events.
