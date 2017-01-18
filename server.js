//initialize all the npm packages
var http    = require("http");
var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var socketIo = require("socket.io");
var uuid = require('node-uuid');
var winston = require('winston');
var easyrtc = require("./easyrtc");
var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AbfduytheG2K0fdFtBZDiIhzuoIjCTP1bogx9Zpz4AJDpuMNMHjQTDKZBr6bnuVE4x0ffC7NqAEgkKh_',
  'client_secret': 'ELpfscSOx9AUxdH10jS_6_KwYtI-DRcFgNQTXvbmCVeXwovEimYl1Js0-T_Vjb4QafYeekH05wqR9Kx7'
});


//initialize logs file
var logger = new winston.Logger({
	level: 'info',
	transports: [
		new (winston.transports.Console)()
	]
});
logger.info('INIT server');

//express configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('', express.static(__dirname + '/www'));
app.use(function(req, res, next) {
	next();
});

var config = {
	PORT: process.env.PORT || 3000
}

app.get('/pay', function(req, res){
var create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://return.url",
        "cancel_url": "http://cancel.url"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Hello Private Room",
                "sku": "private-ro0m",
                "price": "5.00",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "5.00"
        },
        "description": "This is the payment description."
    }]
};
paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        console.log("Create Payment Response");
        console.log(payment);
    }
});
});

app.get('/:token', function (req, res) {
    res.sendFile(__dirname + '/www/index.html');
});

var webServer = http.createServer(app).listen(config.PORT);

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});

easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});

        console.log("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));

        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    console.log("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    console.log("Initiated");

    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        console.log("roomCreate fired! Trying to create: " + roomName);

        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

//listen on port 8080
webServer.listen(config.PORT, function () {
    console.log('listening on '+config.PORT);
});

//minimize the public scripts
var fs = require('fs');
var UglifyJS = require('uglify-js'); 
var result = UglifyJS.minify(["scripts/easyrtc.js", "scripts/script.js"]);
fs.writeFile("www/script.min.js", result.code, function(err) {
    if(err) console.log(err);
    else console.log("File was successfully saved.");
});
