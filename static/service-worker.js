var CACHE_NAME = 'randomchatapp-cache-v1';
var urlsToCache = [
    "/",
    "/home",
    "/offline",
    "/static/css/chat.css",
    "/static/css/style.css",
    "/static/img/logos/generic_icon.png",
    "/static/img/newlogo.png",
    "/static/img/logos/generic_icon_two.png",
    "/static/scripts/chat.js",
    "/static/scripts/record.js"
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                if (response) {
                    return response;
                }

                return fetch(event.request).then(
                    function (response) {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response
                        }
                        return response;
                    }
                ).catch(function () {
                    return caches.match("/offline")
                });
            })
    );
});
