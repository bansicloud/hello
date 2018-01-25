//initialize all the npm packages
var http = require("http");
var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var socketIo = require("socket.io");
var uuid = require('node-uuid');
var winston = require('winston');
var easyrtc = require("./easyrtc");
var config = require('./config');

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


app.post('/api', function(req,res){
    var room = Math.random().toString(36).substr(2, 10);
    res.json({text: 'Here is your video chat room URL https://its-hello.herokuapp.com/'+room, link: 'https://its-hello.herokuapp.com/'+room, "response_type": "in_channel"});
});
app.get('/oauth/slack', function(req,res){
    var request = require('request');

    request.post({url:'https://slack.com/api/oauth.access', form: {client_id:'143163789926.143168001270', client_secret: '52e8ce1440161b6feab5c52f3e330fb9', code: req.query.code, redirect_uri: 'https://its-hello.herokuapp.com/oauth/slack'}}, function(err,httpResponse,body){
        if(err) res.json(err);
        else res.redirect('/');
    });

});
app.get('/about', function(req,res){
    res.sendFile(__dirname + '/www/about.html');
});
app.get('/slack', function(req,res){
    res.sendFile(__dirname + '/www/slack.html');
});

app.get('/:room', function (req, res) {
	var key = req.query.key;
	var room = req.params.room;
    res.sendFile(__dirname + '/www/index.html');
});

var webServer = http.createServer(app).listen(config.PORT);

// Start Socket.io so it attaches itself to Express server
var socketServer = socketIo.listen(webServer, {"log level":1});

//easyrtc.setOption("logLevel", "debug");

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on("easyrtcAuth", function(socket, easyrtcid, msg, socketCallback, callback) {
    easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function(err, connectionObj){
        if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
            callback(err, connectionObj);
            return;
        }

        connectionObj.setField("credential", msg.msgData.credential, {"isShared":false});
        logger.info("["+easyrtcid+"] Credential saved!", connectionObj.getFieldValueSync("credential"));
        callback(err, connectionObj);
    });
});

// To test, lets print the credential to the console for every room join!
easyrtc.events.on("roomJoin", function(connectionObj, roomName, roomParameter, callback) {
    logger.info("["+connectionObj.getEasyrtcid()+"] Credential retrieved!", connectionObj.getFieldValueSync("credential"));
    easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback);
});

// Start EasyRTC server
var rtc = easyrtc.listen(app, socketServer, null, function(err, rtcRef) {
    rtcRef.events.on("roomCreate", function(appObj, creatorConnectionObj, roomName, roomOptions, callback) {
        logger.info("roomCreate fired! Trying to create: " + roomName);
        appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback);
    });
});

//listen on port 8080
webServer.listen(config.PORT, function () {
    logger.info('listening on '+config.PORT);
    logger.info('App live at '+config.APPURL);
});