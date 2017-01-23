module.exports = {
	PORT: process.env.PORT || 3000,
    APPURL: ((process.env.PORT) ? ((process.env.ENVIRONMENT == 'PIPE') ? 'https://'+process.env.HEROKU_APP_NAME+'.herokuapp.com' : 'https://sayhello.li') : 'http://localhost:3000')+'/',
    REDIS_URL : process.env.REDIS_URL || 'redis://localhost:6379/0',
    REDIS_ROOM_PREFIX: 'PRIVATE:ROOM:',
    PENDING_PAYMENT_PREFIX: 'PAYMENT:',
    PAYPAL_MODE: (process.env.ENVIRONMENT == 'PROD' ? 'live' : 'sandbox'),
    PAYPAL_CLIENT_ID: (process.env.ENVIRONMENT == 'PROD' ? 'AerR2nrbOstaMQCHVQIuAmNBN9PqsHedzSdqw-GzUXiain1BP8E47eiSWW3yd-CUnc9S3XkiTGTe6k7R' : 'AbfduytheG2K0fdFtBZDiIhzuoIjCTP1bogx9Zpz4AJDpuMNMHjQTDKZBr6bnuVE4x0ffC7NqAEgkKh_'),
    PAYPAL_CLIENT_SECRET: (process.env.ENVIRONMENT == 'PROD' ? 'EJqxSBWkAYG2bN-giQZ75qmINBX6u7NAJstmbcnqvMLLtqEI46r1kRjZwyi5ZU46dHfBr-2_QYkcvCtO' : 'ELpfscSOx9AUxdH10jS_6_KwYtI-DRcFgNQTXvbmCVeXwovEimYl1Js0-T_Vjb4QafYeekH05wqR9Kx7')
}
