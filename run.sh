#!/bin/bash

#for letsencrypt configuration, change ******* according to your env.
#gunicorn3 --certfile=/etc/letsencrypt/live/*********/fullchain.pem --keyfile=/etc/letsencrypt/live/********/privkey.pem -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 application:app

#without ssl certificates, some features may now work.
gunicorn3 -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 application:app
