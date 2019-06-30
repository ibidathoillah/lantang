const mongoose = require('./db'),
Schema = mongoose.Schema,
ObjectId = Schema.ObjectId,
Model = mongoose.models;

const AppSchema = {
	Kurs : new Schema({
		"symbol": { type: String, required: true },
		"e_rate": {
			"jual": { type: Number, required: true },
			"beli": { type: Number, required: true },
		},
		"tt_counter": {
			"jual": { type: Number, required: true },
			"beli": { type: Number, required: true },
		},
		"bank_notes": {
			"jual": { type: Number, required: true },
			"beli": { type: Number, required: true },
		},
		"date": { type: Date, default: new Date().setHours(0,0,0,0), required: true }
	}, { versionKey: false })
	.pre('insertMany', function (next) {

		Model.Kurs.find({ date: new Date().setHours(0,0,0,0)}, function (err, docs) {
			if(err)
				next(err)
			else if(!docs.length)
				next();
			else{                
				next(new Error("Skipped, Has been Syncronized This Day!"));
			}
		});

	})
	.pre('save', function (next) {
		
		this.date = new Date(this.date).setHours(0,0,0,0)
		Model.Kurs.find({symbol:this.symbol , date: this.date}, function (err, docs) {
			if(err)
				next(err)
			else if(!docs.length)
				next();
			else{                
				next(new Error("The record is already exist"));
			}
		});
	}),
	Users : new Schema({
			"username": {type: String, required: true},
			"email":  { type: String, required: true },
			"avatar": { type: String, required:false },
			"password": { type: String, required: true },
			"role": {type: Number, default: 0, required: false}
		}, { versionKey: false }),

	Comment : new Schema({
			"id_post":  { type: ObjectId, required: true },
			"id_user": { type: ObjectId, required: true},
			"description":  { type: String, required: true },
			"date":  { type: Date, default: new Date(), required: false }
		}, { versionKey: false }),

	Post: new Schema({
			"image":  { type: String, required: true },
			"description":  { type: String, required: true },
			"id_user":  { type: ObjectId, required: true },
			"like":  { type: Array, required: true },
			"comment":  { type: Array, required: true },
			"date":  { type: Date,default: new Date(), required: false }
			
		}, { versionKey: false }),

	Category: new Schema({
			"name":  { type: String, required: true }
			
		}, { versionKey: false }),




		
}

module.exports = AppSchema