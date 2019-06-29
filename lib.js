const rp = require('request-promise');
const $ = require('cheerio');
const Model = require('./model');
const { query, param, oneOf, validationResult } = require('express-validator/check')
const url = 'https://www.bca.co.id/id/Individu/Sarana/Kurs-dan-Suku-Bunga/Kurs-dan-Kalkulator';

const checkDate = (value) => {
  var regEx = /^\d{4}-\d{2}-\d{2}$/;
  if(!value.match(regEx)) return false;  // Invalid format
  var d = new Date(value);
  var dNum = d.getTime();
  if(!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0,10) === value;
}

const formatDate = (date) => {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}

const validateStartEndDate = [
	query('startdate', 'Start Date is Required').not().isEmpty(),
	query('enddate', 'End Date is Required').not().isEmpty(),
	query('startdate', 'Invalid Date Format, Please use date format as follow: YYYY-mm-dd').custom(checkDate),
	query('enddate', 'Invalid Date Format, Please use date format as follow: YYYY-mm-dd').custom(checkDate)
]

const validateDate = [
	param('date', 'Date is Required').not().isEmpty(),
	param('date', 'Invalid Date Format, Please use date format as follow: YYYY-mm-dd').custom(checkDate)
]


var Kurs  = {};
Kurs.findData = (req, res) => {
	 // Finds the validation errors in this request and wraps them in an object with handy functions
	const errors = validationResult(req);
	if (errors.isEmpty())
	{
			Model.Kurs.aggregate([
				{$match : { symbol: req.params.symbol ? req.params.symbol : { $exists:true},  date: {$gte: new Date(req.query.startdate), $lt:new Date(req.query.enddate)}}}
				]).exec((err, docs) => {
				
				for(i in docs)
					docs[i].date = formatDate(docs[i].date); // Change date from UTC to Local time

		    	if(err) 
		    		res.status(202).send({status: 'error', message: err.message.toString() }) // The request has been accepted, but can't be access
				else 
					res.status(200).send(docs); // The FIND request was fulfilled
		    });
	}
	else
	{
		 res.status(422).send({ error : errors.array() }) //if you want to look the validation error message
	}
}

Kurs.indexing = (req,res) => {

	return rp(url).then((html) => {

		var row = $('table.table.table-bordered > tbody.text-right',html).children();
		var manyKurs = [];

		$('table.table.table-bordered > tbody.text-right',html).children().each((i,rows) => {
			var cols = $(rows).children();
			manyKurs.push(new Model.Kurs({
				"symbol": $(cols[0]).text(),
				"e_rate": {
					"jual": parseFloat($(cols[1]).text()),
					"beli": parseFloat($(cols[2]).text())
				},
				"tt_counter": {
					"jual": parseFloat($(cols[3]).text()),
					"beli": parseFloat($(cols[4]).text())
				},
				"bank_notes": {
					"jual": parseFloat($(cols[5]).text()),
					"beli": parseFloat($(cols[6]).text())
				}
			}));	
		});

		Model.Kurs.insertMany(manyKurs, (err) => {
				if(err) 
					res.status(202).send({status: 'success', message: err.message.toString() }) // The request has been accepted, but no further proccess
				else 
					res.status(201).send({status: 'success', data: manyKurs, message: 'Exchange rates were successfully indexed'}); // The request was fulfilled
		});

	})
	.catch((err) => {
		console.log(err); // Show error for dev,  This error happened when system fail to scrapping the sites
		res.status(503).send({error: { message: 'Something went wrong' }}) // Show error for public, HTTP Status Code for External Dependency Error / Service Unavailable
	});	
}
Kurs.add = (req, res) => {

	var Kurs = new Model.Kurs(req.body);

	Kurs.save((err) => {
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', data: Kurs, message: 'New record saved' }); // The request save was fulfilled
	})
};
Kurs.update = (req, res) => {

	var Kurs = req.body;

	Kurs.date = new Date(Kurs.date).setHours(0,0,0,0)

	Model.Kurs.findOneAndUpdate({symbol:Kurs.symbol , date: Kurs.date}, Kurs, {new: true, useFindAndModify: false}, (err, docs) => {

		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(docs)
			res.status(200).send({ status: 'success', data: docs, message: 'Existing record updated' }); // // A successful UPDATE warning
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
		
	})
};
Kurs.delete = (req, res) => {
	 // Finds the validation errors in this request and wraps them in an object with handy functions
	const errors = validationResult(req);
	if (errors.isEmpty())
	{
		Model.Kurs.deleteMany({date: new Date(req.params.date).setHours(0,0,0,0)},function (err) {
			if(err) 
				res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the DELETE request, but the resource can't be removed 
			else
				res.status(200).send({ status: 'success', message: 'All record by date '+req.params.date+' has been deleted' }); // A successful DELETE warning
		});
	}
	else
	{
		 res.status(422).send({ status: 'error', error : errors.array() }) //if you want to look the validation error message
	}
}

module.exports = { Validate : { validateStartEndDate, validateDate} ,Kurs};