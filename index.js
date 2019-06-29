/**
		Initialize Module
*/
const express    = require('express');
const app        = express();
const bodyParser = require('body-parser');
const custom_env = require('custom-env').env(process.env.NODE_ENV || 'development')
const config = require('./config');
const { Validate, Kurs} = require('./lib');
const Model = require('./model');
var ObjectId = require('mongodb').ObjectId; 
/**
		Middleware to All Route
*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


/**
		Rest API
*/
app.get('/api/indexing',  Kurs.indexing);
app.post('/api/kurs', Kurs.add);
app.put('/api/kurs', Kurs.update);
app.get('/api/kurs/:symbol',Validate.validateStartEndDate,Kurs.findData);
app.get('/api/kurs',Validate.validateStartEndDate,Kurs.findData);
app.delete('/api/kurs/:date',Validate.validateDate, Kurs.delete);



/*
	Lantang API
*/

/* CRUD Users */
app.post('/v1/user/add', (req, res) => {

	var Users = new Model.Users(req.body);

	Users.save((err) => {
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', data: Kurs, message: 'New record saved' }); // The request save was fulfilled
	})
});

app.get('/v1/user/:id', (req, res) => {

    Model.Users.find({"_id" : ObjectId(req.params.id)}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.get('/v1/user/', (req, res) => {

    Model.Users.find({}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.put('/v1/user/:id', (req, res) => {

	Model.Users.updateOne({"_id" : ObjectId(req.params.id)},req.body, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', data: Kurs, message: 'Record updated' });
	})
});

app.delete('/v1/user/:id', (req, res) => {
	Model.Users.deleteOne({"_id" : ObjectId(req.params.id)}, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', data: Kurs, message: 'Record Deleted' });
	})
});


app.post('/v1/login', (req, res) => {

	Model.Users.find({email:req.body.email, password:req.body.password}, function (err, user) { 

		console.log(user);
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user.length>0)
			res.status(200).send({ data:{id:user._id, emai:user.email}, status: 'sukses',  message: 'login sukses' }); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.listen(config.server.port, () => console.log(`${config.app_name} (${config.mode}) listening on port ${config.server.port}!`))
module.exports = app;

