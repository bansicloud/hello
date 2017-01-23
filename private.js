var redis =require('redis');
var config = require('./config');
var winston = require('winston');
var uuid = require('node-uuid');

var logger = new winston.Logger({
	level: 'info',
	transports: [
		new (winston.transports.Console)()
	]
});

//configure the payment gateway
var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': config.PAYPAL_MODE,
  'client_id': config.PAYPAL_CLIENT_ID,
  'client_secret': config.PAYPAL_CLIENT_SECRET
});

redisClient = redis.createClient({url: config.REDIS_URL});

var check = function (req, res){
	var roomId = req.query.room;
	var key = req.query.key;
	getRoom(roomId, function(error, result){
		if(error){
			res.json({status: 'error', message:'Error in checking room'});
		}else{
			if(result == null) {
				res.json({status: false});
			}else{
				if(key){
					if(key == result.key) res.json({status: true, roomStatus: result.room});
					else res.json({status: false, message: 'Invalid key'});
				}else res.json({status: true});
			}
		}
	});
}

var payment = function(req, res){
	var email = req.body.email;
	var roomId = req.body.roomid;
	if(roomId){
		getRoom(roomId, function(error, result){
			if(error){
				res.json({error: true, message:'Error in checking room'});
			}else{
				if(result == null){
					redisClient.hmset(config.REDIS_ROOM_PREFIX+roomId, "status", "pending", "email", email, "key", uuid.v4(), 'room', 'unlocked');

					var create_payment_json = {
						"intent": "sale",
						"payer": { "payment_method": "paypal" },
						"redirect_urls": {
							"return_url": config.APPURL+"private/return",
							"cancel_url": config.APPURL+"private/return"
						},
						"transactions": [{
							"item_list": {
								"items": [{
									"name": "Hello Private Room ("+roomId+")",
									"sku": "PR_"+roomId,
									"price": "8.00",
									"currency": "USD",
									"quantity": 1
								}]
							},
							"amount": {
								"currency": "USD",
								"total": "8.00"
							},
							"description": "This is the one time fee for purchasing a private room (/"+roomId+") in Hello."
						}]
				    };
					paypal.payment.create(create_payment_json, function (error, payment) {
					if (error) {
						logger.error(error);
					} else {
						if(payment.payer.payment_method === 'paypal') {
							redisClient.set(config.PENDING_PAYMENT_PREFIX+payment.id, roomId);
							redisClient.hset(config.REDIS_ROOM_PREFIX+roomId, 'payment_id', payment.id);
							var redirectUrl;
							for(var i=0; i < payment.links.length; i++) {
								var link = payment.links[i];
								if (link.method === 'REDIRECT') redirectUrl = link.href;
							}
							res.redirect(redirectUrl);
						}
					}
					});
				}else{ 
					res.send('Room already bought');
				}
			}
		});
	}else{
		res.json('Room id not present');
	}
}

var paymentReturn = function(req, res){
	var paymentId = req.query.paymentId;
	var PayerID = req.query.PayerID;

	var execute_payment_json = {
		"payer_id": PayerID,
		"transactions": [{
			"amount": {
				"currency": "USD",
				"total": "8.00"
			}
		}]
	};

	paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
		if (error) {
			logger.error(error);
			res.send('Problem with payment');
		} else {
			if(payment.state == 'approved'){
				redisClient.get(config.PENDING_PAYMENT_PREFIX+paymentId, function(error, roomId){
					if(error) logger.error(error);
					else redisClient.hset(config.REDIS_ROOM_PREFIX+roomId, 'status', payment.state);

					res.sendFile(__dirname + '/www/payment.html');
					redisClient.hgetall(config.REDIS_ROOM_PREFIX+roomId, function(error, roomDetails){
						var nodemailer = require('nodemailer');
						var transporter = nodemailer.createTransport({
							service: 'gmail',
							auth: {user: 'vasanth.sayhello@gmail.com', pass: 'Poiu&890'}
						});
						var roomURL = config.APPURL+roomId;
						var roomURLKey = config.APPURL+roomId+'?key='+roomDetails.key;
						var mailOptions = {
							from: '"Hello" <vasanth.sayhello@gmail.com>',
							to: roomDetails.email,
							subject: 'Hello from Hello',
							text: 'Hello \n Please find your private room details below: \n\n '+
									'Your room URL: https://sayhello.li/'+roomId+' \n\n '+
									'Your room Key: '+roomDetails.key+' \n\n '+
									'Your room Key: '+roomDetails.key+' \n\n '+
									'Click this link to use the key: https://sayhello.li/'+roomId+'?key='+roomDetails.key+' \n\n '+
									'When you access the room with the correct Key, you will see a lock icon which can be toggled to lock/unlock the room. \n '+
									'For any queries email me back.',
							html: '<h1>Hello</h1>'+
									'<div>Please find your private room details below:<br/><br/>'+
									'Your room URL: <i><a href="'+roomURL+'" target="_blank">'+roomURL+'</a></i><br/><br/>'+
									'Your room Key: <i>'+roomDetails.key+'</i><br/><br/>'+
									'Click this link to use the key: <i><a href="'+roomURLKey+'" target="_blank">'+roomURLKey+'</a></i>'+
									'</div>'+
									'<p>When you access the room with the correct Key, you will see a lock icon which can be toggled to lock/unlock the room.</p>'+
									'<p>For any queries email me back.</p>'
						};
						transporter.sendMail(mailOptions, function(error, info) {
							if (error) logger.error(error);
						});
					});

				});
			}else{
				res.send('Payment not approved. Please refresh or DM me on twitter.');
			}
		}
	});
}

var lock = function (req, res){
	var key = req.query.key;
	var roomId = req.query.room;
	var lock = req.query.lock;
	if(key && roomId){
		getRoom(roomId, function(error, roomDetails){
			if(roomDetails){
				if(roomDetails.key == key){
					redisClient.hset(config.REDIS_ROOM_PREFIX+roomId, 'room', lock);
					res.json({status: 'success', message: 'Room '+lock});
				}else{
					res.json({status: 'error', message: 'Invalid key'});
				}
			}else{
				res.json({status: 'error', message: 'Invalid room'});
			}
		});
	}else{
		res.json({status: 'error', message: 'No key or room found'});
	}
}

function getRoom(roomId, cb){
	if(roomId){
		redisClient.hgetall(config.REDIS_ROOM_PREFIX+roomId, function(error, result){
			if(error){
				logger.error(error);
				cb(true, null);
			}else{
				cb(false, result);
			}
		});
	}else{
		cb(true, null);
	}
}


module.exports = {
	check: check,
	payment: payment,
	paymentReturn: paymentReturn,
	lock: lock
}