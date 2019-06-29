// You can change .env file for development or production uses
// Then set the enviroment fist, by example:
// SET NODE_ENV=production

var config = {
	app_name : process.env.APP_NAME,
	mode: process.env.NODE_ENV,
	server: {
		port:  process.env.PORT
	},
	database : {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		host: process.env.DB_HOST,
		port: process.env.DB_PORT ,
		db_name: process.env.DB_NAME
	}
}

module.exports = config;