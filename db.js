const config = require('./config');
const mongoose = require('mongoose')

mongoose.connect(`mongodb://${config.database.username}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.db_name}`, {useNewUrlParser: true});

module.exports = mongoose