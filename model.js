const config = require('./config');
const mongoose = require('mongoose');
const Schema = require('./schema');
const Model = {
	Kurs : mongoose.model('Kurs', Schema.Kurs),
	Users:  mongoose.model('Users', Schema.Users)
}


module.exports = Model