const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
var path = require('path');

var PORT = 3001;
var HOST = '127.0.0.1';

const app = express();

app.use(express.static(path.join(__dirname, '/public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

var clientWS;

wss.on('connection', function connection(ws, req) {
    const location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    clientWS = ws;
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    //ws.send('something');
});

server.listen(3000, function listening() {
    console.log('Listening on %d', server.address().port);
});



var dgram = require('dgram');
var udpServer = dgram.createSocket('udp4');
var speed;

udpServer.on('listening', function () {
    var address = udpServer.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

udpServer.on('message', function (message, remote) {
    speed = message[0];
    console.log("Speed = ", speed);
    if(clientWS) {
        clientWS.send(speed);
    }
});

udpServer.bind(PORT, HOST);