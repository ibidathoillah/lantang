const config = require('./config');
const mongoose = require('mongoose');
const Schema = require('./schema');
const Model = {
	Kurs : mongoose.model('Kurs', Schema.Kurs),
	Users:  mongoose.model('Users', Schema.Users),
	Comment:  mongoose.model('Comment', Schema.Comment),
	Post:  mongoose.model('Post', Schema.Post),
	Category:  mongoose.model('Category', Schema.Category),

}


module.exports = Model