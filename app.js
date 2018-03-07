const express = require('express');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
let path = require('path');

let PORT = 3001;
let HOST = '127.0.0.1';

const app = express();

app.use(express.static(path.join(__dirname, '/public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clientWS;

wss.on('connection', function connection(ws, req) {
    //DEBUG
    console.log("Client opened connection");

    const location = url.parse(req.url, true);
    // You might use location.query.access_token to authenticate or share sessions
    // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    clientWS = ws;
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    ws.on("error", error => {
        console.log("Client error = ", error.errno);
    });

    ws.on("close", () => {
        console.log("Client closed connection");
    });
});

server.listen(3000, function listening() {
    console.log('Listening on %d', server.address().port);
});

//Read vehicle data from network - UDP
let COMMS = process.env.DRIVING_COMMS || "UDP";

if(COMMS === "UDP") {
    //DEBUG
    console.log("Reading data via UDP");

    let dgram = require('dgram');
    let udpServer = dgram.createSocket('udp4');
    let speed, revs;

    udpServer.on('listening', function () {
        let address = udpServer.address();
        console.log('UDP Server listening on ' + address.address + ":" + address.port);
    });

    udpServer.on('message', function (message, remote) {
        //DEBUG
        speed = message[0] + (message[1]/100);
        revs = (message[3] << 8) + message[2];
        //console.log("Revs = ", revs);
        //console.log("Speed = ", speed);
        if(clientWS) {
            if(clientWS.readyState === WebSocket.OPEN) {
                clientWS.send(speed !== undefined ? speed : 0);
                //Make revs negative to differentiate from speed
                clientWS.send(revs !== undefined ? -revs : 0);
            }
        }
    });

    udpServer.bind(PORT, HOST);
} else {
    //Read data from serial port
    //DEBUG
    console.log("Reading data via serial port");

    const SerialPort = require("serialport");
    const port = new SerialPort("COM1");

    port.on("open", () => {
        console.log("Port opened");
    });

    port.on("data", data => {
        //Got data from serial port
        console.log(data.toString());
    });
}
