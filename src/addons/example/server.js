function onRequest(request, globalNS) {
    console.log("downloading", request, globalNS);
    return request;
}

function init() {
    console.log("[TESTMOD] YOLO");
}

export{
    onRequest,
    init
};
