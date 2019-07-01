/**
		Initialize Module
*/
const express    = require('express');
const path    = require('path');
const app        = express();
const bodyParser = require('body-parser');
const custom_env = require('custom-env').env(process.env.NODE_ENV || 'development')
const config = require('./config');
const { Validate, Kurs} = require('./lib');
const Model = require('./model');
const cors = require('cors');
var ObjectId = require('mongodb').ObjectId; 
var Flickr = require('flickrapi');
var Flickr = require("flickrapi"),
    flickrOptions = {
      api_key: process.env.FLICKR_KEY,
	  secret: process.env.FLICKR_SECRET,
	  user_id: process.env.FLICKR_USER_ID,
	  access_token: process.env.FLICKR_ACCESS_TOKEN,
	  access_token_secret: process.env.FLICKR_ACCESS_TOKEN_SECRET,
	  permissions: "write"
    };


function flickerUpload(title,dir,callback)
{
		Flickr.authenticate(flickrOptions, function(error, flickr) {
			// we can now use "flickr" as our API object
			var uploadOptions = {
				photos: [{
				title: title,
				photo: dir
				}]
			};
			
			Flickr.upload(uploadOptions, flickrOptions, function(err, result) {
				if(err) {
				return console.error(error);
				}
				

				flickr.photos.getSizes({
					api_key: flickr.options.api_key,
					photo_id: result,
					per_page: 500
				}, function(err, resultU) {
					// result is Flickr's response

					callback(resultU.sizes.size)
				})

			});
		});
}

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

app.use("/img",express.static(path.join(__dirname,'./test')))




async function uploadImage(titleImage,imageBase64,callback){
	

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
	var userUploadedFeedMessagesLocation = path.join(__dirname,'./test/')
	
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
							function(err) 
							{
								if(err) {
									return console.log(err);
								}
								flickerUpload(titleImage,userUploadedImagePath,callback)
								
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


//uploadImage("testing","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAABMlBMVEXdPTH///8gku3/wQcop0XlNhnbJxVHhdLlNDD64+EjqEX/wgBFhtLbMDMdpkZKmEL/+ev6rg8Ai+zcMCHcOCsAj/X6wQfdOSzcNCY8qUEAoTLbKxr/vQDbIw7cMiPcLRz76ungUUfngXvsoZ0AjezkcGkAjvfuq6f1zszjaGAAiOwAnyvq9P3b6/vxurfzxcIwpC/qko1KsmDa7t5ku3XiYFffST7urakvlOLIs2f98/PoiIL//uaw0/fyvbrouzSDu/O33b5aqPDC3fnq9u2h06qJpKv32df/7MF1oLjXt1X/yTpZmD/eqDmBkqGXqJ2JyZVfnMjJ5c51tPKqrIw4lt3/1HGgyvVUtWjAsG9Sl8x1wYTc7PziukKVzqCy27m6sHn/zEtYm82iqpPmuzfauE6cyVoTAAAPRklEQVR4nO3deVvTShcA8DQt0SZ4rU3T1tbQhbBUFG7BtggugCgqKuCCiorb9ft/hTfplsnMmSSTmab2fXLun70Pzc8znT0zUirOeH5eTBfPn8f6nVKM35X7eSut2f/d+hnjl8YpzGnpUWi5+L42PmEujUZ8xNiEXmCMxLiEODA+YkxCEhgbMR4hBIyLKEa4/ymjbp5u0T6GgT7Er3vbsnzwUMiziRBuZSpqJqOqa5v74OdIM+ENSqPxcPu2JduRl+8KeDoBwi3H1w+1ol4eEp9TgSDxzp4tG0VeAFGAMDMCOlFZu/fW+zGtiIIF9cnBIH3j4H88fuHTSsYTaiXzFEmkP9BDvPNRznt9svWR+/n4hRki1Erly6jWCQK6xLvvcJ6YJHIL31ZIooPc/O58GgwcEh9ugz45/2TqwnsqJOzXOqeHYYBp7cHXPQvkOXEwbeEhmMIh8t9iME/TPl/A6Rsm8c6UhZd04T83i/R2YuQ7Ptk2fHwC6hpeoS8wMH0vz5YNP16fOF3hPlUYBNS04vsP/ukbCjnrGk7hJ0o9EwC00/fnRT6MT+aua/iEW7QU+gJt34+LkDw78l+nKPxCSaEfUNP+O5HD++xiujdFISWFdKCdvvtnRj6Y5SFOT/gdFlKBdu3yO6BxAIVcA0Uu4SZYSGlAu3F4YQQ2DlBsT0sId0lhoF08339YZk7fILiGiTxCsEsKAjXt2zOLvXiOwuJpMDiEYJcUADpdz1+stQuWRI7OKYfwsqKSYfdF8Xh8IkctnuMkcnROwwnrWSCuA/HqBh6v31wREPPQA9RFCbPNmqkAcRWKa0TocyICegCz1syKEC6aZelvjbK5yC9cNKfN8I1gYpDw6O8G2sSgghokbP69RXQQ5SansDptQWBU+YT1v72Q2sU0oNEIEGaVaQMCQwn4ISbCRDj9SISJMBFOPxJhIkyE049EmAgT4fQjESbCRDj94BLe2ZufmzYgMK5eB/a0hhM+OchbV2ZBWKnge1pDCT/2t+rORA7V/p5WNuF4r+eMCL17WoOFyF7PmRH2keBOekJ4Zw/dCzlLwn4iT4laBxM6tQu6vDxbQjvIWscj/Cjj+wmEC0uDEPgXvcIMUesgwrsyuZ9AmLBU1qvKQqnb6DjRlQq6UtXLBQF/GRc6iVS3IOHd28AmCDHCcs3sNnur9R3kn3anvrreblUVnVcJCDPq2hYgBLd5CBCWlVJzA7V5Iru+tFDlWoWFhBk1Qwo/glteeIUlXdldpelG2dxomnr0XyYozFS+E8KDSeSw2u0F8IbIXqMa1QgL1XuEEATyCfXCeihfPzYaSjQjLMyMi+nkhCUleK+L19jVZ0qoN0LsV8Ji0YyQRkop3SSE78TWNGab2WdHtsGeRorwlBCCzWFkoRmuhoHSKEboNohue7gtUKhsRATav0bWeRO4PRwXUkT4ECqm0YRKUBPoFz3GTUqgsLIPCMG6JpLQfMQBTKVabP24q6+gHLp/DhHuAUmMIqxFqmTcOGJL4rUbN/8hUngJCu8AdU0EYaHDB7SfiVFYJIhryDgYHR8eCBHWwm1O9okOU6t47YaGE90uGyZ8Qu6nZxfq9J5Mdr291Gl07Wi0dldWqeONJaYfoi1MY8QKOsz3jPFF5LBMeeyjtmTqC4XhGL9gD4jN7iKcbraqxhHiRPSveWcxiLqGWajDTX22o5CDwNKCsgS1K13WUpr2Eiu0WQy7riGKKbMQTuGKQklLQWkQnYMsa13af9sYIVY8823euTaic8oqhPckt336KSWlgeWxzTbkHwpdovrF8+e8wru8c21VqNSt+HfESmYL/T2ybkseCcfEinfuG5svxTunrEIFAO4EPnIBHUo2GEdQY+GQiHRJISHeOWUUlqDWPkyp06XhdMBOg3VayhUOiO4MDShM8QnLUIctVE5Ktdru+upGk1YlhRL2iSr29bgQ65wyCqG2Ihv2d2U3kbUI84qo0Ca6Q1+K8GueR1gDxoWrE35lwyNMF//Fl2Zw4YMLnpUZqCqNV6gV8YOZMGFO+2zwCI9I4dGENzt4hWniYCavMGf/I2wLzmGqNiHaMAghRvQInQNztJO8YOGEXw679po4I8ZDRIX9E4G042WOuhSav5jwu1P6G/IUHJSICIdHHmln0Ve59RVAmNqIMtEbOuauPPYlusLRwXHafSOykPIy4JEUab4+XMxdOSGFyFF3Eg60P/1gRRWWGqDQ7nzXuFdC6UIZOKzJJY6EyKlc2nsjqlAyqVMTvY45GeTc/PJn6DyqnFeIHjumFaMLwapmGDu9Vq1WFv6TnJu3foEnbuVQofdcNe2FFVVYaNGFDnJjVzJ1scq5edn45kOUSGBa+2NEFUrVwLnE7Ppuo1ZdEKa0hfln8LFpuZGQOBlPu4i866u8GyTs53J1sWNWxeTSFsoW5WC43EBIHv2n/TCiCoPfjx/HarurCEilIzTe04kSdICqpkUupWyT+tnFrsmL7OfwgiK0Gw0pdQx98CwfVSjV2JbvbST7uB4XyssvKcTjlPT8FiT8z4gslEzW5dHVJZ7DRfpC6wVFeOu5dA5n94xjBy0zMbXTBqbEWYSyQTuF8lyinMs17JxGWwOOsIpf341aVofC37BQK0qwfDQQjrqOH3QcBxDZVrTJgIFQ3qadJErJYVr7bXAIpYUuMJ8RFOu1KNXqUGjcB4l2DuHf4ahzGnk/Tclssq+U1rsRfo1DoXUGJ/EcrkvTo84px66vshnmFCcsOgtRhbIBDIT7dSnYHjrCl8t8QmdnKbg86E9kzuJImAcGwun0T7hPMyA6A2HO3ZeFarnNmEjWhZmxUJY1oHc26JdS6llnIMy/R3hBaSyyIOusE8hjofGDgGg5ythi8KmWF7PPu6Sb0i59HzQe64zEsRDonA7HFrQsOp1TUXv1y1W90d4IV7uyLeMjpdT443Vo4/EhJYvaN0Pk+xalcs2Umr3gdnKDLYmuEO+cImN8Sha1X5boN0oKuuIk07/ISkxJdIVyHu2cap55GpiofV6exFtBpXJVafV8kItMjSIiRAfCGjbXRiHKk3rD0s5lizoCYVutQoTWB40AAnPeqPBkgu+QFqol2hAkag7dzik05w0RtceTfUu21oVbSqZtX6hw1DnVwHULkPhmggsOkrNdCKxad1m6bqhQXj7WMCC5fugVvr42MV0/SjWoxllh+Xf1CI1+55S6fkhmUbsxYSE8v7oeWegMhDWfNWBy9nviQkkHhI+iC43P+B1S+F6MXDFmIXQkAofQuniA/TFceOi5GyYOIVDXcJRS8q4IXHiqokeORxCW9GqVZaEQOn60xyEk7orAharnVHV2od7tra72WuGneBdIINsOU0xI3BWBCZ37HBAis3C0jTL09Ce48h+5xe8LsbsiMGH/PgeXyCpENurXl0K9MWlCTT7T3DAuxO+K8AqH98aMiYxC7/bS1W7wm6861ByyHYpDCLG7IrzC0b0xIyKjEH+ja71b9U+HDi7FMXVpSKH1ji5073MYEtmEpS7xsBstn/XBkrkEARmn2wghdleER4hcZTggsgnBHcL1xS58qkBZ6cCzqYybGUmh964IjxB97aRPZBPqlFe3sytLulnVF8qF0QszCzWz1KbN2DDu9COF3ksTUaH33hiHyCj02UxTX11pN1uNRrfb6LR2Fx/Rp1BD75qmCz2XJqJC7N4Y5+47ITlkC7b3uuAcovfSIMLDNewtPpvI/ztkDeb3gCHhbaSuQYSXxNum/9zkrUuZY4d58QkSop1TRAi9TvvqKsuXVaO/wj2KDvNaNyRE6xpXCF1lqF5nEkpl3vdHm+zzQqAw73ZOXSF0xRirsCTxEXcjvLkA59DtnI6F4FWGrEKpVOZ5Fb8Z5dUMWHh73DkdC0/B0yVYhWGutqHFTifS1CUsdOuasRC8By+C0B4DR0vjRi3ahhpY6BbTsRA85CWKUCopS+xbFHaaUV+toQjHtelYCAGjCSWpYLbYttPscFybFVoI3gobUdh/g3kl9Lp2vV3mWDygCMcdt7EQvwSeT9hfve/0QpTWnfUO37VnsNBtEN32UGgO+1HQFWnJd1k722tVOQ4y8xG6nRpXuIV3vLmFQ6XSaC4+Oqp7C239aL3dKvOfuEfr03wFhKm3KlFQ+YVOlMr66NDE1tLSUqvTkMo1RcypiaDQkpHJKO8shlpRJyAchTO8d0Lo0ZfAXJtMn8Ww83ivUpmYcDKBrczkD7CbyokzaA9PK24iZ01oWXvEnazQOcL7myPjTAmt/DZ0+TN8FvTWl0EiZ0ho5d/B9yJTz/N+mrGNsyK0sNollHBQ68yC8ApZu4QU2rXO5SwI58naJbTw//9uhET4V0QiTISJcPqRCBNhIpx+JMJEmAinH4kwESbC6UciDBBO+Lw8EQFt9mcQTvpYRwFRCxAECSd8rCN/UI75Cy88+tuLKbjZn0UY4eKXWCN4g1KgMMWxEWTiUQ6xAytYmMo2awoUcyJCv0bEVSjAJ6iFOT0lhNBBQjF/RUC8eX0Dj1fXgQCfINSzhxOCAd+2Fz6sZfnksYZH8aZKBnpvDGtwCMm7Ilgib/z6rJHnrZB3xjhR8b21eWLC1EHkJFqG9ewbcJwMBei5NyZOIXAvTTjf8sV7IH1UoPfemDiF8EVmQWEYL16CPCoQv88hRiF7XWMZ27+LFB8NSNznEKMwxVhM88bZfbh4+gEzFa5n5BPClybS0tdvHCg8HyBxn0OcQuJeGh/fxQ96+vyA+L0x8QopN9CSvPyLP74+H6D6ie8ROYXgpYmE78N7au0SCESvMpyGEL+Xhgxj+eylf/r8gZz1DL8QujQRTd/2SVD6nFMo/YAcXVIhQr/OqZW/gLqeZAb/hW/0HQg5uqRChPS6xpL3vj4I5tmROzzFNye79QxPl1SMEO6cjvZ6wgcWYkDnf/y+CRu5uqRihNAFrchez2Di6MAcZ08rQOR+Pn4h3jnF9noGEZETgQ77e1q9KXxKfB9r8Au9SbRu43s9/YnYkUdv7615dtLzp1CEEOm65WVgryftCNh0Gj+0yonDS7fWUTk7bP0QIEzdlfOD9G3DW3WpRADoxP7mmqo6vowAoBCh3Xmz24ztPfyEpnHQCioMtGPrdDOT+bQv5NnECIMCJlKBQiMeIUiMBxiXECDGBIxNSBDjAsYnxIixAWMUoo0GpZmYSMQoTOWOB2f43zqOERirMJV6fl5MF8+fx/qd/wPKZu2GehiC4wAAAABJRU5ErkJggg==",function(url){ console.log(url) })


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
	AVATAR LIB
*/

var getAvatar = function(){

	const avatar = require('./avatar')
	
	return avatar[Math.round((Math.random()*10)%avatar.length)]
}

console.log(getAvatar())



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
					res.status(201).send({ data: {id: u._id, username:u.username, emai:u.email, avatar: u.avatar, role: u.role}, status: 'success', message: 'New record saved' }); // The request save was fulfilled
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


uploadImage(req.body.description,req.body.image, function(namafile){

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

	Model.Post.find({}).sort({date:'desc'}).exec(function(err, user){
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); 
	}); 
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

    Model.Comment.find({"id_post" : ObjectId(req.params.post_id)}).sort({date:'desc'}).exec(function(err, user){
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
			res.status(200).send({ data:{avatar: user[0].avatar, id:user[0]._id, username:user[0].username, emai:user[0].email, role:user[0].role}, status: 'sukses',  message: 'login user' }); // The FIND request was fulfilled
		else if(user.length==1 && user[0].role==1)
			res.status(200).send({ data:{avatar: user[0].avatar, id:user[0]._id, username:user[0].username, emai:user[0].email, role:user[0].role}, status: 'sukses',  message: 'login admin' });
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
	 Model.Comment.find({"id_post" :  ObjectId(req.params.post_id)}).count(function (err, comment) {
	     	if(err) {
				res.status(202).send({ status: 'error', message: err.message.toString() })
	     	}
			else {
				res.status(201).send({ status: 'success', count: comment });				
	 		}
	 });
});

app.get('/v1/tot_like/:post_id', (req, res) => {
	var Users = new Model.Users(req.body);

	Model.Post.find({"id_user" : ObjectId(req.params.id)}, function (err, user) { 
    	console.log(user);
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user){
			Model.Post.find({"like" :  ObjectId(Users._id)}).count(function (err, like) {
		     	if(err) {
					res.status(202).send({ status: 'error', message: err.message.toString() })
		     	}
				else {
					res.status(201).send({ status: 'success', count: like });				
		 		}
			 });
			res.status(200).send(user); // The FIND request was fulfilled
		}
		else{
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
		}
    } );
});


app.put('/v1/post/done/:id', (req, res) => {


uploadImage(req.body.description_done,req.body.image_done, function(namafile){

Model.Post.updateOne({"_id" : ObjectId(req.params.id)},{date_done: new Date(), status:"Selesai",image_done:namafile,description_done:req.body.description_done}, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'Record updated' });
	})

});


	
});

app.get('/v1/post_selesai/', (req, res) => {

    Model.Post.find({"status" : "Seleai"}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.get('/v1/post_menunggu/', (req, res) => {

    Model.Post.find({"status" : "Menunggu"}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.get('/v1/post_diproses/', (req, res) => {

    Model.Post.find({"status" : "Diproses"}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.get('/v1/post_ditolak/', (req, res) => {

    Model.Post.find({"status" : "Ditolak"}, function (err, user) { 
		if(err) 
			res.status(202).send({ status: 'error',  message: err.message.toString() }) // You accepted the UPDATE request, but the resource can't be updated
		else if(user)
			res.status(200).send(user); // The FIND request was fulfilled
		else
			res.status(404).send({ status: 'error', message: '404 Not Found' }); // No resources found
    } );
});

app.put('/v1/post/status/:id', (req, res) => {

	Model.Post.updateOne({"_id" : ObjectId(req.params.id)},{status:req.body.status}, function (err, user){
		if(err) 
			res.status(202).send({ status: 'error', message: err.message.toString() }) // You accepted the CREATE request, but the resource can't be created
		else 
			res.status(201).send({ status: 'success', message: 'Record updated' });
	})
});

app.listen(config.server.port, () => console.log(`${config.app_name} (${config.mode}) listening on port ${config.server.port}!`))
module.exports = app;

