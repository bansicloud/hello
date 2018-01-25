module.exports = {
	PORT: process.env.PORT || 3000,
    APPURL: ((process.env.PORT) ? ((process.env.ENVIRONMENT == 'PIPE') ? 'https://'+process.env.HEROKU_APP_NAME+'.herokuapp.com' : 'https://its-hello.herokuapp.com') : 'http://localhost:3000')+'/',
}
