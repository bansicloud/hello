module.exports = {
	PORT: process.env.PORT || 3000,
    APPURL: ((process.env.PORT) ? ((process.env.ENVIRONMENT == 'PIPE') ? 'https://'+process.env.HEROKU_APP_NAME+'.herokuapp.com' : 'https://sayhello.li') : 'http://localhost:3000')+'/',
    REDIS_URL : process.env.REDIS_URL || 'redis://localhost:6379/0',
    REDIS_ROOM_PREFIX: 'PRIVATE:ROOM:',
    PENDING_PAYMENT_PREFIX: 'PAYMENT:'
}
