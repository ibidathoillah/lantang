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
const cors = require('cors');
var ObjectId = require('mongodb').ObjectId; 
/**
		Middleware to All Route
*/


const allowedOrigins = [
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8100',
  'chrome-extension://fhbjgbiflinjbdggehcddcbncdddomop'
];

// Reflect the origin if it's in the allowed list or not defined (cURL, Postman, etc.)
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error(origin + 'Origin not allowed by CORS'));
    }
  }
}

// Enable preflight requests for all routes
app.options('*', cors(corsOptions));

app.use(cors(corsOptions))
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


async function uploadImage(imageBase64,callback){
	

// Save base64 image to disk
try
{
	// Decoding base-64 image
	// Source: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
	function decodeBase64Image(dataString) 
	{
	  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
	  var response = {};

	  if (matches.length !== 3) 
	  {
		return new Error('Invalid input string');
	  }

	  response.type = matches[1];
	  response.data = new Buffer(matches[2], 'base64');

	  return response;
	}

	// Regular expression for image type:
	// This regular image extracts the "jpeg" from "image/jpeg"
	var imageTypeRegularExpression      = /\/(.*?)$/;      

	// Generate random string
	var crypto                          = require('crypto');
	var seed                            = crypto.randomBytes(20);
	var uniqueSHA1String                = crypto
										   .createHash('sha1')
											.update(seed)
											 .digest('hex');

	var base64Data = imageBase64
	var imageBuffer                      = decodeBase64Image(base64Data);
	var userUploadedFeedMessagesLocation = './test/';

	var uniqueRandomImageName            = 'image-' + uniqueSHA1String;
	// This variable is actually an array which has 5 values,
	// The [1] value is the real image extension
	var imageTypeDetected                = imageBuffer
											.type
											 .match(imageTypeRegularExpression);

	var userUploadedImagePath            = userUploadedFeedMessagesLocation + 
										   uniqueRandomImageName +
										   '.' + 
										   imageTypeDetected[1];

	// Save decoded binary image to disk
	try
	{
	require('fs').writeFile(userUploadedImagePath, imageBuffer.data,  
							function() 
							{

								callback(uniqueRandomImageName);
							  console.log('DEBUG - feed:message: Saved to disk image attached by user:', userUploadedImagePath);
							});
	}
	catch(error)
	{
		console.log('ERROR:', error);
	}

}
catch(error)
{
	console.log('ERROR:', error);
}

}


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
	AVATAR LIB
*/

var getAvatar = function(){
	
	var avatar = require('./avatar.js')
	return avatar[Math.round((Math.random()*10)%avatar.length)]
}

/*
	Lantang API
*/

/* CRUD Users */
app.post('/v1/user/add', (req, res) => {

	req.body.avatar = getAvatar();

	var Users = new Model.Users(req.body);

	Model.Users.find({username:req.body.username}, function(err, user){
		if (err) {
			res.status(202).send({ status: 'error',  message: err.message.toString() })
		}
		else if(user.length>0){
			res.status(200).send({status:'gagal', message:'username sudah digunakan'}); // The FIND request was fulfilled
		}
		else{
			Model.Users.find({email:req.body.email}, function(err, user){
			if (err) {
				res.status(202).send({ status: 'error',  message: err.message.toString() })
			}
			else if(user.length>0){
				res.status(200).send({status:'gagal', message:'email sudah digunakan'}); // The FIND request was fulfilled
			}
			
			else{
				Users.save((err) => {
				if(err) 
					res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
				else{
					var u = Users;
					res.status(201).send({ data: {id: u._id, username:u.username, emai:u.email, avatar: u.avatar}, status: 'success', message: 'New record saved' }); // The request save was fulfilled
				}
				})
			}
		});
		
		}
	});

	
});

app.post('/v1/comment/add', (req, res) => {

	var Comment = new Model.Comment(req.body);

	Comment.save((err) => {
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'New record saved' }); // The request save was fulfilled
	})
});

app.post('/v1/post/add', (req, res) => {


	
var data = uploadImage(req.body.image, function(namafile){

	req.body.image = namafile

	var Post = new Model.Post(req.body);

	Post.save((err) => {
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'New record saved' }); // The request save was fulfilled
	})
});

})

app.post('/v1/category/add', (req, res) => {

	var Category = new Model.Category(req.body);

	Category.save((err) => {
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'New record saved' }); // The request save was fulfilled
	});
});

app.get('/v1/post/:id', (req, res) => {

    Model.Post.find({"id" : ObjectId(req.params.id)}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.get('/v1/post/', (req, res) => {

    Model.Post.find({}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.put('/v1/post/:id', (req, res) => {

	Model.Post.updateOne({"_id" : ObjectId(req.params.id)},req.body, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'Record updated' });
	})
});

app.delete('/v1/post/:id', (req, res) => {
	Model.Post.deleteOne({"_id" : ObjectId(req.params.id)}, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'Record Deleted' });
	})
});

app.get('/v1/category/:id', (req, res) => {

    Model.Category.find({"_id" : ObjectId(req.params.id)}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.get('/v1/category/', (req, res) => {

    Model.Category.find({}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});


app.put('/v1/category/:id', (req, res) => {

	Model.Category.updateOne({"_id" : ObjectId(req.params.id)},req.body, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'Record updated' });
	})
});

app.delete('/v1/category/:id', (req, res) => {
	Model.Category.deleteOne({"_id" : ObjectId(req.params.id)}, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'Record Deleted' });
	})
});


app.get('/v1/comment/:post_id', (req, res) => {

    Model.Comment.find({"id_post" : ObjectId(req.params.post_id)}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.get('/v1/comment/', (req, res) => {

    Model.Comment.find({}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});


app.put('/v1/comment/:id', (req, res) => {

	Model.Comment.updateOne({"_id" : ObjectId(req.params.id)},req.body, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'Record updated' });
	})
});

app.delete('/v1/comment/:id', (req, res) => {
	Model.Comment.deleteOne({"_id" : ObjectId(req.params.id)}, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'Record Deleted' });
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
			res.status(201).send({ status: 'success', message: 'Record updated' });
	})
});

app.delete('/v1/user/:id', (req, res) => {
	Model.Users.deleteOne({"_id" : ObjectId(req.params.id)}, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'Record Deleted' });
	})
});


app.post('/v1/login', (req, res) => {

	Model.Users.find({email:req.body.email, password:req.body.password}, function (err, user) { 

		console.log(user);
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user.length==1 && user[0].role==0)
			res.status(200).send({data:{id:user[0]._id, username:user[0].username, emai:user[0].email, avatar: user[0].avatar}, status: 'sukses',  message: 'login user' }); // The FIND request was fulfilled
		else if(user.length==1 && user[0].role==1)
			res.status(200).send({data:{id:user[0]._id, username:user[0].username, emai:user[0].email, avatar: user[0].avatar}, status: 'sukses',  message: 'login admin' });
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.get('/v1/post_user/:id', (req, res) => {

    Model.Post.find({"id_user" : ObjectId(req.params.id)}, function (err, user) { 
    	console.log(user);
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.post('/v1/post/comment', (req, res) =>{
	var Comment = new Model.Comment(req.body);

	Comment.save((err) => {
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else {

			Model.Post.updateOne({"id_post" : ObjectId(Comment.id_post)},{$push:{comment:Comment._id}}, function (err, user){
				if(err) 
					res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
				else 
					res.status(201).send({ status: 'success', message: 'Record updated' });
			})

			res.status(201).send({ status: 'success', message: 'New record saved' }); // The request save was fulfilled
		}
	})
});

app.get('/v1/tot_comment/:post_id', (req, res) => {

	 Model.Comment.find({"id_post" : "post_id"}).count(function (err, res) {
	     if (err)
	     	res.status(202).send({ status: 'error', message: err.message.toString() })
	     
	     console.log(res)	
	    
	 });
  //   Model.Comment.find({"id_post" : ObjectId(req.params.post_id)}, function (err, user) { 
		// if(err) 
		// 	res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		// else if(user){
		// 	console.log(user);
		// 	// res.status(200).send();
		// } // The FIND request was fulfilled
		// else
		// 	res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
  //   } ).count();
});

app.listen(config.server.port, () => console.log(`${config.app_name} (${config.mode}) listening on port ${config.server.port}!`))
module.exports = app;

