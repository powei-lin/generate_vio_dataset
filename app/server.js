const liveServer = require("live-server");

const params = {
    port: 8080, // Set the server port. Defaults to 8080.
    open: false, // When false, it won't load your browser by default.
    root: "build/scene",
    ignore: 'src,screenshots', // comma-separated string for paths to ignore
    // file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
    wait: 3000, // Waits for all changes, before reloading. Defaults to 0 sec.
    mount: [["/config", "./config"], ["/asset", "./asset"]], // Mount a directory to a route.
    
};

liveServer.start(params);