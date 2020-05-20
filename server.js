var express = require("express");
var app = express();

var connectOnce = require('connect-once');
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
const NodeCache = require( "node-cache" );
var mongodb = require('mongodb');
var passport = require("passport");   
var passportLocalMongoose = require("passport-local-mongoose");
var multer  = require('multer');
var cookieParser = require('cookie-parser');
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
var LocalStrategy = require('passport-local'),
    GoogleStrategy = require('passport-google-oauth2').Strategy,
    FacebookStrategy = require('passport-facebook');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ip = require("ip");
var port = process.env.PORT || 3000;
var jsonInfoMultiFile = "";
var mainFile = "";
 
var MongoClient = mongodb.MongoClient;

var autoIncrement = require("mongodb-autoincrement");
 
//var url = 'mongodb://mongodb58394-nhatanhtest.jelastic.tsukaeru.net/mongodb-connect';
//var url = 'mongodb://localhost:27017/test';
var url = 'mongodb://adminwartec:adminwartec123@ds015849.mlab.com:15849/wartec';
// Number of page
var numberPager = 15;

var connection = new connectOnce({ 
  retries: 60, 
  reconnectWait: 1000
}, MongoClient.connect, url);
 
// Login
mongoose.connect(url);
var User = require('./model/user');
var login = require('./model/login');
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.username);
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  console.log("deserializing " + obj);
  done(null, obj);
});

//Login Google
passport.use(new GoogleStrategy({
    clientID: "888632730028-3h6ojuvoicub1uf9kds5ljqf72v1m52v.apps.googleusercontent.com",
    clientSecret: "CNCxfFxcoFV766yfMVNlxSHv",
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log("DA CHAY VO DAY NHA ID: " +profile.id );
    User.findOrCreate({ google_id: profile.id.toString()}, {
     google_id: profile.id.toString(),
     user_name:profile.displayName.toString(), 
     display_name: profile.name.toString(),
     picture: profile.photos ? profile.photos[0].value : 'themes/img/user_default.jpg',
     role: 'user'
    }, function (err, user) {
      return done(err, user);
    });
  }
));

//Login facebook
passport.use(new FacebookStrategy({
    clientID: "1600240390119279",
    clientSecret: "e45ef0c2e066b8fcd9c26aec04a8bfcb",
    callbackURL: "https://35.237.60.177:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log("DA CHAY VO DAY NHA ID: " + profile.id );
    User.findOrCreate({ facebook_id: profile.id.toString()}, {
     facebook_id: profile.id.toString(),
     user_name: profile.displayName.toString(),
     role: 'user'
    }, function (err, user) {
      return done(err, user);
    });
  }
));

passport.use('local-signin', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    login.localAuth(username, password)
    .then(function (user) {
      if (user) {
        console.log("LOGGED IN AS: " + user.username);
        req.session.success = 'You are successfully logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT LOG IN");
        req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));
passport.use('local-signup', new LocalStrategy(
  {passReqToCallback : true}, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    login.localReg(username, password)
    .then(function (user) {
      if (user) {
        console.log("REGISTERED: " + user.username);
        req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
        done(null, user);
      }
      if (!user) {
        console.log("COULD NOT REGISTER");
        req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
        done(null, user);
      }
    })
    .fail(function (err){
      console.log(err.body);
    });
  }
));
// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.error = 'Please sign in!';
  res.redirect('/');
}

var logger = require('morgan');
app.use(logger());
app.use(cookieParser());
var methodOverride =  require('method-override');
app.use(methodOverride());
var session = require('express-session');
app.use(session({ secret: 'supernova' }));
app.use(passport.initialize());
app.use(passport.session());

// Session-persisted message middleware
app.use(function(req, res, next){
  var err = req.session.error,
      msg = req.session.notice,
      success = req.session.success;
  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;
  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;
  next();
});

// Send mail
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'greenfuturevn.ldt@gmail.com',
    pass: 'greenfuturevn'
  }
});

//IO
var users = {};
io.on('connection', function(socket){
	console.log("socket: " + socket);
  socket.on('login', function(user){
    console.log("IP: " + ip.address());
    //var values = Object.values(users);
    console.log("USER LOGIN:" + user);
    // if (!values.includes(user)) {
    //   users[socket.id] = user;
    // }
    // console.log(values);
  });
  socket.on('message', function(msg){
  	console.log("MSG:" + msg);
    var msgObj = JSON.parse(msg);
    connection.when('available', function (err, db) {
      autoIncrement.getNextSequence(db, 'message', function (err, autoIndex) {
        var collection = db.collection('message');
        collection.insert({
          _id: autoIndex,
          key: msgObj.key,
          message: msgObj.message,
          time: msgObj.time,
        });
      });
    });
    io.emit('message', msg);
  });
  socket.on('disconnect_user', function(){
    console.log("DISCONNECT USER");
    users[socket.id] = '';
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Save product buffer
const myCache = new NodeCache();;

// save cookie
app.use(cookieParser());
// set a cookie
app.use(function (req, res, next) {
  var cookie = req.cookies.cookieName;
  if (cookie === undefined) {
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
  }
  next();
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/upload');
  },
  filename: function (req, file, cb) {
  	var d = new Date();
    var n = d.getTime()
    var res = file.originalname.split(".");
    var fileNameUpload = n + Math.floor(Math.random() * 10000) + "." + res[res.length -1];
    cb(null, fileNameUpload);
    if (mainFile == "") {
    	mainFile = fileNameUpload;
    }
    jsonInfoMultiFile += '{"fileName":"' + fileNameUpload + '"}' + ",";
  }
});

var uploadMultiFile = multer({ storage: storage }).array('multiFile');

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
//app.listen(8080);

app.get("/", function(req, res){
	var pageStr = req.query.page;
	var search = req.query.search;
  var newsId = req.query.newsId;
	console.log("Page: " + page);
	var page = 0;
	if (pageStr != undefined) {
		page = parseInt(pageStr);
	}
	if (search == undefined) {
		search = '';
	}
	// Get the documents collection
	connection.when('available', function (err, db) {
    var collection = db.collection('product');
    var collectionType = db.collection('type_main');
    var collectionNews = db.collection('news');
    collection.find({"info_product.name_utf":new RegExp(utf8(search), "i")}).toArray
    (
      function (err, result) {
        if (err) {
            console.log(err);
        } else {
          var productBooking = getInfoProductBooking(req.cookies.cookieName);
    	 		collectionType.aggregate([{
			    	$lookup: {
			        from: "type",
			        localField: "_id",
			        foreignField: "type_main",
			        as: "type_info"
			    	}
    			}]).toArray(
            function (err, res_type) {
              if (err) {
                console.log(err);
              } else {
                collectionNews.find().toArray(
                  function (err, res_news) {
                    if (err) {
                      console.log(err);
                    } else {
                    	var prevPager = page - 1;
                    	var nextPager = page + 1;
                      var resultTmp;
                      if (result.length) {
                        resultTmp = result.slice(numberPager*page, numberPager*page + numberPager);
                      } else {
                        resultTmp = [];
                      }
          	 					res.render("index", {products: resultTmp, 
                        types: res_type, 
          	 						count: (result.length/numberPager),
          	 						prevPager: prevPager,
          	 						nextPager: nextPager,
          	 						page: page,
          	 						list: false, 
          	 						user: req.user,
                        product_booking_data: productBooking,
                        news_id: newsId,
                        news_data:res_news
          	 					});
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
	});
});

app.get("/product_list", function(req, res){
	var pageStr = req.query.page;
	var page = 0;
	if (pageStr != undefined) {
		page = parseInt(pageStr);
	}
	var type_main = parseInt(req.query.type_main);
	var type = parseInt(req.query.type);
	connection.when('available', function (err, db) {
    var collection = db.collection('product');
 		var collectionType = db.collection('type_main');
    var collectionNews = db.collection('news');
    collection.find({ "type" : {
      "type_main" : type_main,
      "type" : type
    }}).toArray(
      function (err, result) {
        if (err) {
          console.log(err);
        } else {
			 		collectionType.aggregate([{
			    	$lookup: {
				        from: "type",
				        localField: "_id",
				        foreignField: "type_main",
				        as: "type_info"
			    	}
					}]).toArray(
            function (err, res_type) {

              if (err) {
                  console.log(err);
              } else {
                collectionNews.find().toArray(
                  function (err, res_news) {
                    if (err) {
                      console.log(err);
                    } else {
                      var productBooking = getInfoProductBooking(req.cookies.cookieName);
                    	var prevPager = page - 1;
                    	var nextPager = page + 1;
                      var resultTmp;
                      if (result.length) {
                        resultTmp = result.slice(numberPager*page, numberPager*page + numberPager);
                      } else {
                        resultTmp = [];
                      }
          	 					res.render("index", {products: resultTmp, 
          	 						types: res_type, 
          	 						count: (result.length/numberPager),
          	 						prevPager: prevPager,
          	 						nextPager: nextPager,
          	 						page: page,
          	 						list: true,
          	 						type_main: type_main,
          	 						type: type, 
                        user: req.user,
                        product_booking_data: productBooking,
                        news_id: null,
                        news_data:res_news
          	 					});
                    }
                  });
              }
            }
		      );
        }
      }
    );
  });
});

app.get("/add_product", function(req, res){
	connection.when('available', function (err, db) {
    var collectionType = db.collection('type');
    var collectionTypeMain = db.collection('type_main');
    collectionTypeMain.find().toArray(
      function (err, result_main) {
        if (err) {
            console.log(err);
        } else {
          console.log("ID: " + result_main[0]._id);
          collectionType.find({"type_main":result_main[0]._id}).toArray(
            function (err, result) {
              res.render("add_product", {
                types: result , 
                type_mains: result_main , 
                total_product: 0, 
                value: result.length,
                user: req.user
              });
          });
        }
      }
    );
  });
});

app.get('/io_chat', function(req, res){
  res.render("iochat");
});

app.post("/add_new_product", function(req, res){
	uploadMultiFile(req, res, function(err){
		if(err) {
			res.send("Error");
		} else {
      console.log("Type_main: " + req.body.type_main);
			connection.when('available', function (err, db) {
        var collection = db.collection('product');
        var color = [];
        if( Object.prototype.toString.call( req.body.color ) === '[object Array]' ) {
          color = req.body.color;
        } else {
          color.push(req.body.color);
        }
        if(req.body.product_id) {
          console.log("Update excute , ID: " + req.body.product_id + ", FILE: " + jsonInfoMultiFile);
          if(jsonInfoMultiFile != "") {
            collection.update(
              { _id: parseInt(req.body.product_id)},
              { $set:
                { 
                  type:{
                    type_main : parseInt(req.body.type_main),
                    type : parseInt(req.body.type)
                  },
                  info_product: {
                    name : req.body.name,
                    name_utf: utf8(req.body.name),
                    price : req.body.price, 
                    description: req.body.description, 
                    main_file: mainFile,
                    color: color
                  },
                  file: JSON.parse("[" + jsonInfoMultiFile.substring(0, jsonInfoMultiFile.length -1) + "]")
                }
              }
            );
            jsonInfoMultiFile = "";
            mainFile = "";
          } else {
            console.log("File not found");
            collection.findOne({'_id': parseInt(req.body.product_id)}, function(err, product) {
              collection.update(
                { _id: parseInt(req.body.product_id)},
                { $set:
                  { 
                    type:{
                      type_main : parseInt(req.body.type_main),
                      type : parseInt(req.body.type)
                    },
                    info_product: {
                      name : req.body.name,
                      name_utf: utf8(req.body.name),
                      price : req.body.price, 
                      description: req.body.description, 
                      main_file: product.info_product.main_file,
                      color: color
                    }
                  }
                }
              );
            });
          }
        } else {
          console.log("Insert excute");
          autoIncrement.getNextSequence(db, 'product', function (err, autoIndex) {
            collection.insert({
              _id: autoIndex,
              type:{
                type_main : parseInt(req.body.type_main),
                type : parseInt(req.body.type)
              },
              info_product: {
                name : req.body.name,
                name_utf: utf8(req.body.name),
                price : req.body.price, 
                description: req.body.description, 
                main_file: mainFile,
                color: color
              },
              file: JSON.parse("[" + jsonInfoMultiFile.substring(0, jsonInfoMultiFile.length -1) + "]")
            });
            jsonInfoMultiFile = "";
            mainFile = "";
          });
        }
			});
			res.redirect('/admin_setting');
		}
	});
});

app.post("/add_news", function(req, res){
  uploadMultiFile(req, res, function(err){
    if(err) {
      res.send("Error");
    } else {
      connection.when('available', function (err, db) {
        var collection = db.collection('news');
        if(req.body.news_id) {
          console.log("Update excute , ID: " + req.body.product_id + ", FILE: " + jsonInfoMultiFile);
          if(jsonInfoMultiFile != "") {
            collection.update(
              { _id: parseInt(req.body.news_id)},
              { $set:
                { title: req.body.title,
                  info: req.body.info,
                  file: JSON.parse("[" + jsonInfoMultiFile.substring(0, jsonInfoMultiFile.length -1) + "]")
                }
              }
            );
            jsonInfoMultiFile = "";
          } else {
            console.log("File not found");
            collection.findOne({'_id': parseInt(req.body.news_id)}, function(err, product) {
              collection.update(
                { _id: parseInt(req.body.news_id)},
                { $set:
                  { 
                    title: req.body.title,
                    info: req.body.info
                  }
                }
              );
            });
          }
        } else {
          console.log("Insert excute");
          autoIncrement.getNextSequence(db, 'news', function (err, autoIndex) {
            collection.insert({
              _id: autoIndex,
              title: req.body.title,
              info: req.body.info,
              file: JSON.parse("[" + jsonInfoMultiFile.substring(0, jsonInfoMultiFile.length -1) + "]")
            });
          });
        }
      });
      res.redirect('/admin_setting');
    }
  });
});

app.post("/save_location_info", function(req, res){
	console.log("save map");
	connection.when('available', function (err, db) {
		var collection = db.collection('map');
		collection.find({ "type" : req.body.type}).toArray(
      function (err, result) {
        if (err) {
            console.log(err);
            res.send({info:"Error"});
        } else if (result.length) {
        	var mapInfoArr = result[0].location
        	for (var i = 0; i < req.body.location.length; i++) {
        		var mapInfo = req.body.location[i];
        		if (mapInfoArr.filter(e => e.lat == mapInfo.lat && e.lng == mapInfo.lng).length == 0) {
        			mapInfoArr.push(mapInfo);
        		} else {
        			console.log("duplicate");
        		}
        	}
          collection.update(
		        { _id: result[0]._id },
		        { $set:
    		      {
    		      	total : mapInfoArr.length,
    		        location : mapInfoArr
    		      }
		        }
		      )
          res.send({info:"Update success"});
        } else {
          autoIncrement.getNextSequence(db, 'map', function (err, autoIndex) {
          collection.insert({
            _id: autoIndex,
            type: req.body.type,
            total: req.body.location.length,
            location : req.body.location
	        });
	        res.send({info: "Insert success"});
	        });
        }
      }
    );
	});
});

app.get("/product_details", function(req, res){
	var pageStr = req.query.page;
	console.log("Page: " + page);
	var page = 0;
	var resultData;
  var users;
	connection.when('available', function (err, db) {
	    if (err) {
	        console.log('Unable to connect to the mongoDB server. Error:', err);
	    } else {
        var collection = db.collection('product');
        var collectionType = db.collection('type_main');
        var collectionUsers = db.collection('users');
        var collectionNews = db.collection('news');
	 		  collection.find({ 
          "type" : {
		        "type_main" : parseInt(req.query.type_main),
		        "type" : parseInt(req.query.type)
		      }
        }).toArray(
          function (err, result) {
            if (err) {
                console.log(err);
            } else if (result.length) {
				      resultData = result;
            } else {
              console.log('No document(s) product');
            }
          }
	      );
	      collection.findOne({'_id': parseInt(req.query.productId)}, function(err, document) {
			  	console.log("data: " + document._id);
			  	var productBooking = getInfoProductBooking(req.cookies.cookieName);
        	collectionType.aggregate([{
		    	$lookup: {
		        from: "type",
		        localField: "_id",
		        foreignField: "type_main",
		        as: "type_info"
		    	}}]).toArray(
            function (err, res_type) {
              if (err) {
                  console.log(err);
              } else if (res_type.length) {
                collectionNews.find().toArray(
                  function (err, res_news) {
                    if (err) {
                      console.log(err);
                    } else {
                    	var prevPager = page - 1;
                    	var nextPager = page + 1;
       					      res.render("product_details", {
                        product: document, 
                        products: resultData.slice(numberPager*page, numberPager*page + numberPager), 
                        types: res_type,
      	 					      count: (resultData.length/numberPager),
          	 						prevPager: prevPager,
          	 						nextPager: nextPager,
          	 						page: page,
          	 					  type_main: req.query.type_main,
          	 					  type: req.query.type,
          	 					  productId: req.query.productId,
                        user: req.user,
                        list_user: null,
                        product_booking_data: productBooking,
                        news_id: null,
                        news_data:res_news
                      });
                      }
                    });

              } else {
                console.log('No document(s) product');
              }
            }
		      );
			  });
	    }
	});
});

app.post("/product_details", function(req, res){
	connection.when('available', function (err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      var collection = db.collection('product');
      collection.findOne({'_id': parseInt(req.body.product_id)}, function(err, document) {
	  	  var total;
      	var cookie = req.cookies.cookieName;
      	if (cookie == undefined) {
      		total = 0;
      	} else {
      		var productData = myCache.get(cookie);
      		if (productData == undefined) {
      			total = 0;
          } else {
      			total = productData.length;
          }
      	}
        res.send({product: document});
		  });
	  }
	});
});

app.post('/add_product_to_cart',multer().array(), function (req, res) {
	console.log("Thong tin don hang: " + req.body.product_info[0].main_file);
	var cookie = req.cookies.cookieName;
	var productData = myCache.get(cookie);
	if (productData == undefined) {
		var data = [];
		data.push(req.body);
		myCache.set( cookie, data, function( err, success ){
	  	if( !err && success ){
		    console.log( success ); 
		  }
		});
    res.send({product_total: myCache.get(cookie).length});
	} else {
		productData.push(req.body);
		myCache.set( cookie, productData, function( err, success ){
	  	if( !err && success ){
		    console.log( success ); 
		  }
		});
    res.send({product_total: myCache.get(cookie).length});
	}
});

app.post('/delete_product_from_cart',multer().array(), function (req, res) {
  var index = parseInt(req.body.id);
  var cookie = req.cookies.cookieName;
  var productData = myCache.get(cookie);
  if (productData == undefined && myCache.get(cookie) != undefined) {
    res.send({delete_status: 0, total: myCache.get(cookie).length});
  } else {
    productData.splice(index, 1);
    myCache.set( cookie, productData, function( err, success ){
      if( !err && success ){
        console.log( success ); 
      }
    });
    res.send({delete_status: 1, total: productData.length});
  }
});

app.post('/get_all_type',multer().array(), function (req, res) {
  connection.when('available', function (err, db) {
    var collectionTypeMain = db.collection('type_main');
    var collectionType = db.collection('type');
    collectionTypeMain.find().toArray(
      function (err, result_type_main) {
          collectionType.find().toArray(
            function (err, result_type) {
              res.send({type_main: result_type_main, type: result_type});
            })
      });
  });
});

app.post('/add_type_main',multer().array(), function (req, res) {
	connection.when('available', function (err, db) {
    autoIncrement.getNextSequence(db, 'type_main', function (err, autoIndex) {
      var collection = db.collection('type_main');
      collection.insert({
        _id: autoIndex,
        name: req.body.name
  	  });
  	  res.send({_id: autoIndex, name: req.body.name});
  	});
	});
});


app.post('/add_type',multer().array(), function (req, res) {
  connection.when('available', function (err, db) {
    autoIncrement.getNextSequence(db, 'type', function (err, autoIndex) {
      var collection = db.collection('type');
      collection.insert({
        _id: autoIndex,
        type_main: parseInt(req.body.type_main),
        name: req.body.name
      });
      res.send({_id: autoIndex, name: req.body.name});
    });
  });
});

app.post('/get_type_by_type_main',multer().array(), function (req, res) {
  var typeMain = parseInt(req.body.type_main);
  connection.when('available', function (err, db) {
    var collection = db.collection('type');
    collection.find({"type_main":typeMain}).toArray(
      function (err, result) {
        res.send({data: result, type_main_id: req.body.type_main});
      }
    );
  });
});

app.post("/delivery_update", function(req, res){
  connection.when('available', function (err, db) {
    var collection = db.collection('product_booking');
    collection.update(
      { _id: parseInt(req.body.id) },
      { $set:
        {
          'info_personal.delivery_flag' : "1"
        }
      }
    );
    res.send({status: "ok"});
  });
});

app.post("/buy_now", function(req, res){
	console.log("data:" + req.body.product_id);
	var cookie = req.cookies.cookieName;
	if (cookie == null || cookie == undefined) {
		res.send("ERROR please go home page");
	} else {
    var productBuy = JSON.parse('{"product_id":"' + req.body.product_id + '","product_info":[{"delivery_flag":"' + 0 + '","date":"' + req.body.date + '","number":"' + req.body.input_number_product + '","name":"' + req.body.product_name + '","main_file":"' + req.body.product_main_file+ '","price":"' + req.body.price + '"}]}');
		var productData = myCache.get(cookie);
    if (productData == undefined) {
      var data = [];
      data.push(productBuy);
      productData = data;
      myCache.set( cookie, data, function( err, success ){
        if( !err && success ){
          console.log( success ); 
        }
      });
    } else {
      productData.push(productBuy);
      myCache.set( cookie, productData, function( err, success ){
        if( !err && success ){
          console.log( success ); 
        }
      });
    }

		var productBuyList = [];
		var productDetail;
		var totalPrice = 0;
		if (productData != undefined) {
      var total;
			for (var i = 0; i < productData.length; i++) {
	    	productDetail = productData[i].product_info;
	    	for (var j = 0; j < productDetail.length; j++) {
	    		totalPrice += parseInt(productDetail[j].price)*parseInt(productDetail[j].number);
	    	}
	    	var jsonData;
		  	jsonData = {product_info: productDetail};
		  	productBuyList.push(jsonData);
	    }
			if (cookie == undefined) {
				total = 0;
			} else {
				if (productData == undefined) {
					total = 0;
        }
				else {
					total = productData.length;
        }
			}
			connection.when('available', function (err, db) {
		    if (err) {
	        console.log('Unable to connect to the mongoDB server. Error:', err);
		    } else {
	        var collection = db.collection('type_main');	 
          var collectionNews = db.collection('news');
		 		  collection.aggregate([{
			    	$lookup: {
			        from: "type",
			        localField: "_id",
			        foreignField: "type_main",
			        as: "type_info"
			    	}
					}]).toArray(
            function (err, result) {
              if (err) {
                  console.log(err);
              } else if (result.length) {
                collectionNews.find().toArray(
                  function (err, res_news) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log("DATA: " +  JSON.stringify(result));
                      var productBooking = getInfoProductBooking(req.cookies.cookieName);
                      res.render("product_buy", {
                        products: productBuyList, 
                        total_product: total, 
                        total_price: totalPrice.toLocaleString(), 
                        types: result,
                        user: req.user,
                        product_booking_data: productBooking,
                        news_id: null,
                        news_data:res_news
                      });
                    }
                  });
              } else {
                console.log('No document(s) found with defined "find" criteria!');
                res.send("ERROR");
              }
            }
		      );
		    }
			});
		} else {
			res.send("ERROR please go home page");
		}
	}   
});

app.get("/buy_now", function(req, res){
	console.log("data:" + req.body.product_id);
	var cookie = req.cookies.cookieName;
	if (cookie == null || cookie == undefined) {
		res.send("ERROR please go home page");
	} else {
		var productData = myCache.get(cookie);
		var productBuyList = [];
		var productDetail;
		var totalPrice = 0;
		if (productData != undefined) {
      var total;
			for (var i = 0; i < productData.length; i++) {
	    	productDetail = productData[i].product_info;
	    	for (var j = 0; j < productDetail.length; j++) {
	    		totalPrice += parseInt(productDetail[j].price)*parseInt(productDetail[j].number);
	    	}
	    	var jsonData;
			  	jsonData = {
        		product_info: productDetail
  				};
		  	productBuyList.push(jsonData);
	    }
			connection.when('available', function (err, db) {
		    if (err) {
	        console.log('Unable to connect to the mongoDB server. Error:', err);
		    } else {
	        var collection = db.collection('type_main');	 
          var collectionNews = db.collection('news');
			 		collection.aggregate([{
			    	$lookup: {
			        from: "type",
			        localField: "_id",
			        foreignField: "type_main",
			        as: "type_info"
			    	}
					}]).toArray(
            function (err, result) {
              if (err) {
                  console.log(err);
              } else if (result.length) {
                collectionNews.find().toArray(
                  function (err, res_news) {
                    if (err) {
                      console.log(err);
                    } else {
                      var productBooking = getInfoProductBooking(req.cookies.cookieName);
                      res.render("product_buy", {
                        products: productBuyList, 
                        total_price: totalPrice.toLocaleString(), 
                        types: result,
                        user: req.user,
                        product_booking_data: productBooking,
                        news_id: null,
                        news_data:res_news
                      });
                      }
                    });
              } else {
                console.log('No document(s) found with defined "find" criteria!');
                res.send("ERROR");
              }
            }
		      );
		    }
			});
		} else {
			res.send("ERROR please go home page");
		}
	} 
});

app.post("/buy_now_next_step", function(req, res){
  var page = 0;
	var mailSend = req.body.email;
	var fullUrl = req.protocol + '://' + req.get('host');
	var cookie = req.cookies.cookieName;
	var productData = myCache.get(cookie);
	var productBuyList = [];
	var productDetail;
	var totalPrice = 0;
	connection.when('available', function (err, db) {
    autoIncrement.getNextSequence(db, 'product_booking', function (err, autoIndex) {
      var collection = db.collection('product_booking');
      collection.insert({
        _id: autoIndex,
        info_personal: req.body,
        info_booking:productData
      });
      jsonInfoMultiFile = "";
      mainFile = "";
      try {
        var infoProductHtml = '';
        var totalAll = 0; 
        infoProductHtml += '<div style="margin: auto;width: 80%;border: 1px solid blue;padding: 10px;border-radius:5px">' ;
        for (var i = 0; i < productData.length; i++) {
          var totalPriceItem = parseInt(productData[i].product_info[0].price)*parseInt(productData[i].product_info[0].number);
          totalAll += totalPriceItem;
          infoProductHtml += '<div  style="position:relative;border: 1px solid #8BC34A;padding: 10px;border-radius:5px;background-color: beige;">' + 
                                  '<div><img src="' + fullUrl + '/upload/' + productData[i].product_info[0].main_file +'" alt="Logo" title="Logo" style="display:block;border: 1px solid;border-radius: 5px;" width="120" height="120" /></div>' + 
                                  '<div style="position:absolute;width:250px;right:0;top:0;">'+
                                    '<p><b>Name: </b>' + productData[i].product_info[0].name + '</p>' +
                                    '<p><b>Số lượng: </b>' + productData[i].product_info[0].number + '</p>' +
                                  '</div>' + 
                                '</div>';
        }
        infoProductHtml += '<a href="'+ fullUrl +'/product_booking_detail?id=' + autoIndex + '"><button style="font-size: 20px;color: red;">XEM CHI TIẾT ĐƠN HÀNG</button></a>'
        infoProductHtml += '</div>' ;
        //Send mail 
        var mailOptions = {
          from: 'greenfuturevn.ldt@gmail.com',
          to: mailSend,
          subject: 'Thông báo đặt hàng thành công',
          forceEmbeddedImages: true,
          html: '<div style="margin: auto;width: 90%;border: 3px solid #73AD21;padding: 10px;border-radius: 10px;">' + 
                  '<h1 style="color:red; text-align:center">XÁC NHẬN ĐẶT HÀNG THÀNH CÔNG</h1>' +
                  '<p>Xin chào ! <span style="color:red">'+ req.body.name +'</span> chúng tôi đã nhận được đơn đặt hàng của bạn, cảm ơn vì đã đặt hàng của chúng tôi, chúng tôi sẽ liên hệ và giao hàng đến bạn một cách sớm nhất</p>' +
                  infoProductHtml +
                  '<div>' +
                    '<img src="' + fullUrl + '/img/logo_mail.png" alt="Logo" title="Logo" style="display:block;height:50px; width: 60px" />' +
                    '<br> <b>Công Ty TNHH Sản Xuất Và Thương Mại Green Future Việt Nam</b>' +
                    '<br><p>ĐC : 350/47/3 Lê Đức Thọ, Phường 6, Quận Gò Vấp, Tp Hồ Chí Minh.</p>' +
                    '<p>SDT: 0986.399.409 - 0973.916.295</p>' +
                  '</div>' +
                '</div>'
        };
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      }
      catch (e) {
        console.log("SENT MAIL ERROR: " + e);
      }
      
    });
  });

  for (var i = 0; i < productData.length; i++) {
  	productDetail = productData[i].product_info;
  	for (var j = 0; j < productDetail.length; j++) {
  		totalPrice += parseInt(productDetail[j].price)*parseInt(productDetail[j].number);
  	}
  	var jsonData;
  	jsonData = {product_info: productDetail};
  	productBuyList.push(jsonData);
  }
  var total;
	if (cookie == undefined) {
		total = 0;
	} else {
		if (productData == undefined) {
			total = 0;
    } else {
			total = productData.length;
    }
	}
  var resultTmp;
	connection.when('available', function (err, db) {
    var collectionProduct = db.collection('product');
		var collectionType = db.collection('type_main');
    var collectionNews = db.collection('news');
    collectionProduct.find().toArray
    (
      function (err, document) {
        if (document.length) {
          resultTmp = document.slice(numberPager*page, numberPager*page + numberPager);
        } else {
          resultTmp = [];
        }
    		collectionType.aggregate([{
        	$lookup: {
            from: "type",
            localField: "_id",
            foreignField: "type_main",
            as: "type_info"
        	}
    		}]).toArray(
          function (err, result) {
            if (err) {
              console.log(err);
            } else if (result.length) {
              collectionNews.find().toArray(
                  function (err, res_news) {
                    if (err) {
                      console.log(err);
                    } else {
                      console.log("DATA: " +  JSON.stringify(result));
                      var dataRefresh = undefined;
                      myCache.set( cookie, dataRefresh, function( err, success ){
                        if( !err && success ){
                          console.log( success ); 
                        }
                      });
                      var productBooking = getInfoProductBooking(req.cookies.cookieName);
                      res.render("product_buy_next", {
                        products: resultTmp,
                        products_buy: productBuyList, 
                        total_product: 0, 
                        total_price: totalPrice.toLocaleString(), 
                        types: result,
                        user: req.user,
                        list: false,
                        count: (resultTmp.length/numberPager),
                        page: 0,
                        prevPager: -1,
                        nextPager: 1,
                        product_booking_data: productBooking,
                        news_id: null,
                        news_data:res_news
                      });
                      productData.length =0;
                    }
                  });
            } else {
              console.log('No document(s) found with defined "find" criteria!');
              res.render("add_product");
            }
          }
        );
      }
      );
	});
});

app.get("/product_booking_detail", function(req, res){
	var cookie = req.cookies.cookieName;
	var total = 0;
	if(cookie != undefined && myCache.get(cookie) != undefined) {
		total = myCache.get(cookie).length;
	}
	connection.when('available', function (err, db) {
		var collectionType = db.collection('type_main');
		var colectionBooking = db.collection('product_booking');
    var collectionNews = db.collection('news');
		colectionBooking.findOne({'_id': parseInt(req.query.id)}, function(err, document) {
			var totalPrice = 0;
			for (var i = 0; i < document.info_booking.length; i++) {
				for (var j = 0; j < document.info_booking[i].product_info.length; j++) {
					totalPrice += parseInt(document.info_booking[i].product_info[j].price)*parseInt(document.info_booking[i].product_info[j].number);
				}
			}
    	collectionType.aggregate([{
	    	$lookup: {
	        from: "type",
	        localField: "_id",
	        foreignField: "type_main",
	        as: "type_info"
	    	}
			}]).toArray(
        function (err, res_type) {
          if (err) {
            console.log(err);
          } else if (res_type.length) {
            collectionNews.find().toArray(
                  function (err, res_news) {
                    if (err) {
                      console.log(err);
                    } else {
                      var productBooking = getInfoProductBooking(req.cookies.cookieName);
          				    res.render("product_booking_detail", {
                        product_booking: document, 
                        types: res_type, total_product: total, 
                        total_price :totalPrice.toLocaleString(),
                        user: req.user,
                        product_booking_data: productBooking,
                        news_id: null,
                        news_data:res_news
                      });
                      }
                    });
          } else {
            console.log('No document(s) found with defined "find" criteria!');
            res.send("ERROR");
          }
        }
	    );   
		});
	});
});

//MAP 
app.get("/map", function(req, res){
	res.render("map")
});

app.get("/map_view", function(req, res){
	connection.when('available', function (err, db) {
		var collection = db.collection('map');
		collection.find({},{ type:1, _id:0}).toArray(
      function (err, result) {
        res.render("map_view",{types:result});
      }
    );
	});
});

app.post("/near_by_search", function(req, res){
	var lat = parseFloat(req.body.lat);
	var lng = parseFloat(req.body.lng);
	var radius = parseFloat(req.body.radius);
	var distance = radius/100000;
	var latMin = lat - distance;
	var latMax = lat + distance;
	var lngMin = lng - distance;
	var lngMax = lng + distance;
	//.filter(e => e.lat >= latMin && e.lat <= latMax && e.lng >= lngMin && e.lng <= lngMax )
	connection.when('available', function (err, db) {
		var collection = db.collection('map');
		collection.find({ "type" : req.body.type}).toArray(
      function (err, result) {
        res.send({
        	map_info_arr: result[0].location.filter(e => e.lat >= latMin && e.lat <= latMax && e.lng >= lngMin && e.lng <= lngMax ), 
        	lat: lat, 
        	lng: lng, 
        	radius: radius
        });
      }
    );
	});
});

app.post("/save_location_info", function(req, res){
	console.log("save map");
	connection.when('available', function (err, db) {
		var collection = db.collection('map');
		collection.find({ "type" : req.body.type}).toArray(
      function (err, result) {
        if (err) {
            console.log(err);
            res.send({info:"Error"});
        } else if (result.length) {
        	var mapInfoArr = result[0].location
        	for (var i = 0; i < req.body.location.length; i++) {
        		var mapInfo = req.body.location[i];
        		if (mapInfoArr.filter(e => e.lat == mapInfo.lat && e.lng == mapInfo.lng).length == 0) {
        			mapInfoArr.push(mapInfo);
        		} else {
        			console.log("duplicate");
        		}
        	}
        	collection.update(
				   { _id: result[0]._id },
				   { $set:
				      {
				      	total : mapInfoArr.length,
				        location : mapInfoArr
				      }
				   }
	        )
          res.send({info:"Update success"});
        } else {
          autoIncrement.getNextSequence(db, 'map', function (err, autoIndex) {
            collection.insert({
	            _id: autoIndex,
	            type: req.body.type,
	            total: req.body.location.length,
	            location : req.body.location
            });
            res.send({info: "Insert success"});
          });
        }
      }
    );
	});
});

//LOGIN
app.get('/login_page', function(req, res){
  res.render('home', {user: req.user});
});

app.get('/signin', function(req, res){
  res.render('signin', {user: req.user});
});

app.post('/local-reg', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/'
  })
);

app.post('/login', passport.authenticate('local-signin', { 
  successRedirect: '/',
  failureRedirect: '/'
  })
);

app.post('/check_singup',multer().array(), function (req, res) {
  var userName = req.body.user_name;
  var password = req.body.password;
  connection.when('available', function (err, db) {
    var collection = db.collection('users');
    collection.find({"user_name":userName.toString()}).toArray(
      function (err, result) {
        console.log("length: " + password);
        if(userName == "" || password == "" || password == undefined || userName == undefined) {
          res.send({"status": "Vui lòng nhập đầy đủ thông tin user name password!"});
        } else {
          if(result.length) {
            res.send({"status": "User đã tồn tại vui lòng đăng nhập!"});
          } else {
            res.send({"status": "ok"});
          }
        }
      }
    );
  });
});

// Open chat box
app.post('/open_chat',multer().array(), function (req, res) {
  var key_1 = req.body.key_1;
  var key_2 = req.body.key_2;
  var key_12 = key_1 + "_" + key_2;
  var key_21 = key_2 + "_" + key_1;
  connection.when('available', function (err, db) {
    var collection = db.collection('message');
    collection.find({$or:[{"key":key_12}, {"key": key_21}]}).toArray(
      function (err, result) {
        res.send({"list_message": result});
      }
    );
  });
});

// Show list chat
app.post('/list_chat',multer().array(), function (req, res) {
  //var values = Object.values(users);
  var values = [];
  values.push("values");
  connection.when('available', function (err, db) {
    var collection = db.collection('users');
    collection.find({}).toArray(
      function (err, result) {
        res.send({
          "list_user": result,
          "list_user_on": values}
        );
      }
    );
  });
});


/* GOOGLE ROUTER */
app.get('/auth/google', passport.authenticate('google', { 
  scope: ['https://www.googleapis.com/auth/plus.login'] 
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log("URL: " + req.url);
    res.redirect('/');
});

/* FACEBOOK ROUTER */
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    console.log("URL: " + req.url);
    res.redirect('/');
});


app.get('/logout', function(req, res){
  var name = req.user.username;
  console.log("LOGGIN OUT " + req.user.username)
  req.logout();
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});

// ADMIN PAGE
app.get("/admin_setting", function(req, res){
  connection.when('available', function (err, db) {
    var collectionType = db.collection('type');
    var collectionTypeMain = db.collection('type_main');
    collectionTypeMain.find().toArray(
      function (err, result_main) {
        if (err) {
            console.log(err);
        } else {
          if (result_main.length) {
            collectionType.find({"type_main":result_main[0]._id}).toArray(
              function (err, result) {
                res.render("admin", {
                  types: result ,
                  type_mains: result_main 
                });
            });
          } else {
            res.render("admin", {
              types: [] ,
              type_mains: [] 
            });
          }
        }
      }
    );
  });
});

app.post('/admin_product',multer().array(), function (req, res) {
  connection.when('available', function (err, db) {
    var collection = db.collection('product');
    if(req.body.id) {
      var id = parseInt(req.body.id);
      collection.find({"_id": id}).toArray(
        function (err, result) {
          console.log("length: " + result.length + " ID: " + req.body.id);
          res.send({"data": result});
        }
      );
    } else {
      collection.find({}).toArray(
        function (err, result) {
          console.log("length: " + result.length + " ID: " + req.body.id);
          res.send({"data": result});
        }
      );
    }
  });
});

app.post('/admin_product_booking',multer().array(), function (req, res) {
  connection.when('available', function (err, db) {
    var collection = db.collection('product_booking');
    if(req.body.id) {
      var id = parseInt(req.body.id);
      collection.find({"_id": id}).toArray(
        function (err, result) {
          console.log("length: " + result.length + " ID: " + req.body.id);
          res.send({"data": result});
        }
      );
    } else {
      collection.find({}).toArray(
        function (err, result) {
          console.log("length: " + result.length + " ID: " + req.body.id);
          res.send({"data": result});
        }
      );
    }
  });
});

app.post('/admin_user',multer().array(), function (req, res) {
  connection.when('available', function (err, db) {
    var collection = db.collection('users');
    if(req.body.id) {
      var id = parseInt(req.body.id);
      collection.find({"_id": id}).toArray(
        function (err, result) {
          console.log("length: " + result.length + " ID: " + req.body.id);
          res.send({"data": result});
        }
      );
    } else {
      collection.find({}).toArray(
        function (err, result) {
          console.log("length: " + result.length + " ID: " + req.body.id);
          res.send({"data": result});
        }
      );
    }
  });
});

app.post('/product_info_edit',multer().array(), function (req, res) {
  connection.when('available', function (err, db) {
    var collection = db.collection('product');
    var collectionType = db.collection('type');
    var collectionTypeMain = db.collection('type_main');
    collection.findOne({'_id': parseInt(req.body.productId)}, function(err, document) {
      var type = document.type.type;
      var typeMain = parseInt(document.type.type_main);
      collectionTypeMain.find().toArray(
        function (err, result_type_main) {
          if (err) {
              console.log(err);
          } else {
            collectionType.find({"type_main":typeMain}).toArray(
              function (err, result_type) {
                res.send({
                  "product": document, 
                  "type_data" : result_type, 
                  "type_main_data" : result_type_main,
                  "type" : type,
                  "type_main" : typeMain
                });
            });
          }
        }
      );
      
    });
  });
});


function utf8(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
}

function getInfoProductBooking(cookie) {
  var total = 0;
  var productData;
  var totalPrice = 0;
  if (cookie == undefined) {
    total = 0;
    productData = [];
  } else {
    productData = myCache.get(cookie);
    if (productData == undefined) {
      total = 0;
      productData = [];
    } else{
      total = productData.length;
      for (var i = 0; i < total; i++) {
        var productDetail = productData[i].product_info;
        for (var j = 0; j < productDetail.length; j++) {
          totalPrice += parseInt(productDetail[j].price)*parseInt(productDetail[j].number);
        }
      }
    }
  }
  return {
    total_product: total, 
    product_booking: productData,
    total_price: totalPrice
  };
}
