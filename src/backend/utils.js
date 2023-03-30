
function wrapUrl(url, base) {
    if(url && (url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('javascript:'))) {
        return url;
    }
    if(base) {
        url = new URL(url, base).href;
    }
    //return '/open/' + encodeURI(url);
    return '/open/' + url;
}

export {
    wrapUrl
}
