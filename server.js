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
//vasanthv87-facilitator-1@gmail.com

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
	PORT: process.env.PORT || 3000,
    APPURL: ((process.env.PORT) ? ((process.env.ENVIRONMENT == 'PIPE') ? 'https://'+process.env.HEROKU_APP_NAME+'.herokuapp.com' : 'https://sayhello.li') : 'http://localhost:3000')+'/',
    REDIS_URL : process.env.REDIS_URL || '3000',
    REDIS_ROOM_PREFIX: 'PRIVATE:ROOM:'
}
app.get('/payment', function(req, res){
	var email = req.body.email;
	var roomId = req.body.roomid;
	if(roomId){
		redis.hget(REDIS_ROOM_PREFIX+roomId, function(){});
	    var create_payment_json = {
		"intent": "sale",
		"payer": {
		    "payment_method": "paypal"
		},
		"redirect_urls": {
		    "return_url": "http://localhost:3000/pay/success",
		    "cancel_url": "http://localhost:3000/pay/cancelled"
		},
		"transactions": [{
		    "item_list": {
			"items": [{
			    "name": "Hello Private Room ()",
			    "sku": "PR_",
			    "price": "8.00",
			    "currency": "USD",
			    "quantity": 1
			}]
		    },
		    "amount": {
			"currency": "USD",
			"total": "8.00"
		    },
		    "description": "This is the one time fee for purchasing a private room (/) in Hello."
		}]
	    };
	    paypal.payment.create(create_payment_json, function (error, payment) {
		if (error) {
		    throw error;
		} else {
		    console.log("Create Payment Response");
		    console.log(payment);
	    if(payment.payer.payment_method === 'paypal') {
		  //req.session.paymentId = payment.id;
		  var redirectUrl;
		  for(var i=0; i < payment.links.length; i++) {
		    var link = payment.links[i];
		    if (link.method === 'REDIRECT') {
              		redirectUrl = link.href;
		    }
		  }
		  res.redirect(redirectUrl);
		}

		}
	    });
	}else{
		//room id not present
	}
});

app.get('/pay/:status', function(req, res){
    paypal.payment.get(paymentId, function (error, payment) {
        if (error) {
            console.log(error);
            throw error;
        } else {
            console.log("Get Payment Response");
            console.log(JSON.stringify(payment));
        }

    });
})
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
