const uiStyle = `
#${vars.namespace}, .${vars.namespace}-addons, #${vars.namespace}-urlinput, #${vars.namespace} form {
    margin: 0;
    padding: 0;
    background: #2c3e50;
    color: #ecf0f1;
    font-size: 10pt;
    font-family: monospace;
}
#${vars.namespace} {
    width: 100%;
    position: fixed;
    bottom: 0; left: 0;
    z-index: 2147483647;
    display: flex;
}
#${vars.namespace} > * {
    flex: auto auto auto;
}
#${vars.namespace} > a {
    padding: 4pt;
    text-decoration: underline;
    color: #84b8fb;
    flex-shrink: 0;
}
#${vars.namespace} > form {
    width: 100%;
}
.${vars.namespace}-addons {
    flex-shrink: 0;
    margin: 0 8pt !important;
}
.${vars.namespace}-addon {
    display: inline-block;
    height: 20pt;
    width: 20pt;
    margin: 0 !important;
    margin-left: 8pt !important;
}
.${vars.namespace}-addon img {
    height: 20pt;
    width: 20pt;
}
#${vars.namespace}-urlinput {
    padding: 4pt;
    background: #4c5e70;
    border: 0;
    width: 100%;
}
.${vars.namespace}-popup {
    padding: 4pt;
    background: #4c5e70 !important;
    border: 4pt solid #2c3e50;
    width: 20em;
    position: fixed;
    right: 0;
    bottom: 20pt;
    display: none;
}
`;

const uiHTML = `
<a href="/">Exter</a>
<form action="/open/" method="GET">
    <input type="text" value="${vars.url}" name="url" id="${vars.namespace}-urlinput"/>
</form>
`;

function addPopup(parent, popupString) {
    const c = document.createElement('div');
    o.setAttribute.call(c, 'class', vars.namespace+'-popup');
    c.style.display = "none";
    o.innerHTML.set.call(c, popupString);
    o.append.call(parent, c);
    return c;
}

function createUI() {
    const style = document.createElement('style');
    o.innerText.set.call(style, uiStyle);

    const ui = document.createElement('div');
    o.setAttribute.call(ui, 'id', vars.namespace);
    o.innerHTML.set.call(ui, uiHTML);

    const container = document.createElement('div');
    container.attachShadow({mode: 'open'});
    container.shadowRoot.appendChild(style);
    container.shadowRoot.appendChild(ui);

    const doc = document.documentElement;
    o.append.call(doc, container);

    const addons = document.createElement('span');
    o.setAttribute.call(addons, 'class', vars.namespace+'-addons');
    o.append.call(ui, addons);

    for(let addon of vars.addons) {
        let popup = '';
        const addonContainer = document.createElement('span');
        o.setAttribute.call(addonContainer, 'class', vars.namespace+'-addon');
        const addonIcon = document.createElement('img');
        o.setAttribute.call(addonIcon, 'src', '/static/addons/' + addon.dir + '/' + addon.icon);
        o.setAttribute.call(addonIcon, 'alt', addon.name);
        o.setAttribute.call(addonIcon, 'title', addon.name);
        if(addon.views && addon.views.popup) {
            popup = addon.views.popup;
            const p = addPopup(addonContainer, popup);
            addonIcon.addEventListener('click', function(e) {
                if(p.style.display == "none") {
                    p.style.display = "block";
                } else {
                    p.style.display = "none";
                }
            });
        }
        o.append.call(addonContainer, addonIcon);
        o.append.call(addons, addonContainer);
    }
}


document.addEventListener('DOMContentLoaded', createUI, false);
