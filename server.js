// Librairies
var express = require('express'),
	socket = socket,
	app = express(),
	path = require('path'),
	http = require('http'),
	server = http.createServer(app),
	io = require('socket.io').listen(server),
	jade = require('jade'),
	MongoClient = require('mongodb').MongoClient,
	ObjectID=require('mongodb').ObjectID,
	_ = require('underscore-node'),
	db = null,
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	multer  = require('multer'),
	Deferred = require('Deferred'),
	md5 = require('MD5'),
	q = require('./application/db'),
	q = new q(_, Deferred),
	request = require("request"),
	moment = require('moment'),
	ldap = require('ldapjs'),
	uid = null,
	nodemailer = require("nodemailer");


MongoClient.connect("mongodb://ollie_h:12qwaesz@kahana.mongohq.com:10033/app26261733", function(err, mongodb) {

	if(err) { console.log("error"); return false; }

	db = mongodb;

	var smtpTransport = nodemailer.createTransport("SMTP",{
	    service: "Gmail",
	    auth: {
	        user: "olliehusbanddesign@gmail.com",
	        pass: "12Qwaesz!"
	    }
	});

	// Views Options
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(cookieParser());
	app.use(bodyParser());
	app.set("view options", { layout: false });
	app.use(multer({
		dest: ['./app/www-release/img/uploads/', './app/www/img/uploads/'],
		rename: function (fieldname, filename) {
			return uid;
		}
	}));
	app.use(express.static('http://sb-timekeeper.herokuapp.com/' + __dirname + '/app/www-release'));

	process.on('uncaughtException', function(err) {
	  console.log(err.stack);
	});

	// Render and send the main page
	app.get('/', q.authenticate, function(req, res){

		var collection = db.collection('users');

		renderUserTable(req, res, collection);

	});

	// Render and send the main page
	app.get('/updateusers', function(req, res){

		request({
		    url: 'http://sbpd.saddingtonbaynes.com/users.php',
		    json: true
		}, function (error, response, body) {

		    if (!error && response.statusCode === 200) {

		        var userdata = body;

				var collections = ['users', 'departments', 'positions'];
				var dDef = getArray('positions', {}, {}, {});
				var dDef = getArray('departments', {}, {}, {});
				var dAll = getArray('users', {}, {}, {});
				var lookups = Deferred.when(dDef, dAll);

				lookups.done(function(positions, departments, allusers) {

					var arg = arguments;

					for (var x = 0; x < collections.length; x++) {

						_.each(userdata['timekeeper'][collections[x]], function(entry, i){

							if(  !_.findWhere(arg[x], { '_id' : entry._id }) ){
								db.collection(collections[x]).insert(entry, function(err, records) {});
							}

						});

					}

				});
		    }

		});

	});

	app.get('/user/:id/view', q.authenticate, function(req, res){

		uid = req.params.id;

		var dDef = getArray('departments', {}, {}, {});
		var dAll = getArray('users', {}, {}, {});
		var dUser = getArray('users', { _id: req.params.id }, {'limit' : 1}, {});

		var lookups = Deferred.when(dDef, dAll, dUser);

		lookups.done(function(departments, allusers, user) {

			res.render('viewUser.jade', {
	        	departments : departments,
	        	allusers : allusers,
				user: user[0]
			});

	    });

	});

	app.get('/user/:id/edit', q.authenticate, function(req, res){

		uid = req.params.id;

		var dDef = getArray('departments', {}, {}, {});
		var dAll = getArray('users', {}, {}, {});
		var dUser = getArray('users', { _id: req.params.id }, {'limit' : 1}, {});

		var lookups = Deferred.when(dDef, dAll, dUser);

		lookups.done(function(departments, allusers, user) {

			res.render('editUser.jade', {
	        	departments : departments,
	        	allusers : allusers,
				user: user[0]
			});

	    });

	});

	app.post('/user/:id/edit', q.authenticate, function(req, res){

		var collection = db.collection('users');

		var set = {};

		_.each(req.body, function(value, key, list){
			set[key] = value;
		});

		if(req.files.displayImage){
			set['display_image'] = req.files.displayImage[0].name;
		}

		collection.update({
			_id: req.params.id
		},{ $set: set },
		function(err, count){
			if(!err){
				res.send({type : 'success', message : '' });
			}
		});

	});

	app.get('/user/:id/authoriseHols', q.authenticate, function(req, res){

		var dUser = getArray('users', { _id: req.params.id }, {'limit' : 1}, {});

		var lookups = Deferred.when(dUser);

		lookups.done(function(user) {

			res.render('authoriseHols.jade', {
				user : user[0],
				fs: {
					formatDate: function(date){

						var d = moment(date.date);
						d = d.format('ddd, Do MMM YYYY');

						if(date.am == 'false' && date.pm == 'true'){
							d += ' PM';
						}
						else if(date.pm == 'false' && date.am == 'true'){
							d += ' AM';
						}

						return d;

					}
				}
			});

	    });

	});


	app.post('/user/:id/authoriseHols', q.authenticate, function(req, res){

		var collection = db.collection('users');
		var dUser = getArray('users', { _id: req.params.id }, {'limit' : 1}, {});

		var lookups = Deferred.when(dUser);

		lookups.done(function(user) {

			var holidays = user[0].holidays;

			_.each(holidays, function(holiday, i){

				holiday.status = req.body.auths[i];

			});

			collection.update({
				_id: req.params.id
			},{ $set: {
				holidays : holidays
			}},
			function(err, count){
				if(!err){
					res.send({type : 'success', message : '' });
				}
			});

		});
	});

	app.post('/confirmHolidays', q.authenticate, function(req, res){

		res.render('alertUserConfirm.jade', {
			hols : req.body.dates,
			fs: {
				formatDate: function(date){

					var d = moment(date.date);
					d = d.format('ddd, Do MMM YYYY');

					if(date.am == 'false' && date.pm == 'true'){
						d += ' PM';
					}
					else if(date.pm == 'false' && date.am == 'true'){
						d += ' AM';
					}

					return d;

				}
			}
		});

	});

	app.get('/:month/:year', q.authenticate, function(req, res){

		var collection = db.collection('users');

		renderUserTable(req, res, collection, req.params);

	});

	app.get('/login', function(req, res){

		res.render('login.jade');

	});

	app.get('/logout', function(req, res){

		res.cookie('loggedin', null);
		res.cookie('user', null);

		res.render('login.jade');

	});

	app.post('/user/:id/saveHolidays', function(req, res){

		var collection = db.collection('users');

		collection.findOne({ _id: req.params.id }, function(err, user) {

			var remaining = user.holiday_remaining - req.body.count;

			if(remaining < 0){
				res.send({type : 'error', message : 'Not enough holiday remaining to chose these dates'});
				return false;
			}

			var dates = user.holidays;

			for (var i = 0; i < req.body.dates.length; i++) {		
				if(!_.findWhere(dates, { date: req.body.dates[i].date }) ){
					dates.push(req.body.dates[i]);
				}
			};
			
			collection.update({_id: user._id},{$set: { holidays : dates, holiday_remaining : remaining  }}
			, function(err, count){

				res.send({type : 'success', message : '' });
				
				if(!err){

					var html = "<p>Hi "+ user.manager_name + "\n</p>";
					html += "<p>" + user.fname + " " + user.lname + " has the following holiday's awaiting your approval.<br /></p>"
					html += "<table cellpadding='0' border='0'>";
					_.each(req.body.dates, function(date,i){
						html += "<tr><td>"+friendlyDate(date)+"</td></tr>";
					});
					html += "</table>"

					// Send manager and user email?
					var mailOptions = {
					    from: "no.reply@saddingtonbaynes.com",
					    to: "olliehusband@me.com",
					    subject: user.fname + " " + user.lname + " has holidays awaiting approval.",
					    html: html
					}

					composeEmail(mailOptions, function(){
						console.log("message sent");
					});

				}

			});

		});
		
	});

	app.post('/login', function(req, res){

		var collection = db.collection('users');

		//  password : md5(req.body.password) 

		collection.findOne({ email : req.body.email}, function(err, user) {

			if(!user || user.length == 0) { 	

				res.render('login.jade', {
					error : true
				});
				return false;

			}

			res.cookie('loggedin', '1');
			res.cookie('user', user);

			res.redirect('/');

			res.end();

		});

	});

	var renderUserTable = function(req, res, collection, date){

		var dayArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		var dates = (typeof(date)==='undefined') ? q.getCalendar() : q.getCalendar(date);
		var dDef = getArray('departments', {}, {}, {});
		var dAll = getArray('users', {}, {}, { order : 1, lname : 1 });
		var dUser = getArray('users', {_id: req.cookies.user._id } , {}, {});
		var lookups = Deferred.when(dDef, dAll, dUser);

		lookups.done(function(departments, allusers, user) {

			allusers = _.groupBy(allusers, function(user){ return user.department_id; });
			
			var userGroup = allusers[user[0].department_id];
			var upcomingHols = q.groupHolidays(userGroup);

	        res.render('allUsers.jade', {
	        	user: user[0],
		        departments: departments,
				users: allusers,
				dates : dates,
				team : userGroup,
				hols: upcomingHols,
				fs: {
					holidayStatus: function(hols,day,halfDayType){

						var now = new Date(day);

						if(!hols || this.isWeekend(dayArr[now.getDay()]) != "")	return false;

						for (var i = 0; i < hols.length; i++) {

							var hol = new Date(hols[i].date);

			        		if(hols[i][halfDayType] == 'true'){

				        		if(now - hol === 0){
					
									if(hols[i].status == 'approved'){
										return "hol-app";
									}
									else if(hols[i].status == 'rejected'){
										return "hol-rej";
									}
									else{
										return "hol-pend";
									}
								}
							}
						}

			        },
			        isWeekend: function(day){

			        	var now = new Date(day);
			        	var dayArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			        	var day = dayArr[now.getDay()];
			        	return (day == "Sun" || day == "Sat") ? "weekend" : "";

			        },
			        userLink: function(user){

			        	var html = '';

			        	if(req.cookies.user._id == user._id || req.cookies.user.admin == 'true'){
			        		html += "<a href='/user/"+user._id+"/edit' class='editUser'> "+user.fname + " " + user.lname+" </a>";
			        		html +=	"<a href='/user/"+user._id+"/edit' class='editUser user-icon'><img src='/img/edit-icon.png' /></a>";
			        		if(req.cookies.user.admin == 'true'){
			        			html +=	"<a href='/user/"+user._id+"/authoriseHols' class='authoriseHols user-icon'><img src='/img/clock-icon.png' /></a>";
			        		}

		        		}
			        	else{
			        		html += "<small>" + user.fname + ' ' + user.lname + "</small>";
			        	}

			        	html +=	"<a href='/user/"+user._id+"/view' class='viewUser user-icon'><img src='/img/info-icon.png' /></a>";

			        	return html;

			        },
			        userSelection: function(id){

			        	if(req.cookies.user._id == id){
			        		return "me";
			        	}

			        },
			        frameless: function(){
			        	return req.originalUrl === "/";
			        }
			   	}
			});
		});

	};

	var composeEmail = function(mailOptions, callback){

		smtpTransport.sendMail(mailOptions, function(error, response){
		    if(error){
		        console.log(error);
		    }else{
		       	callback();
		    }
		});
	};

	var friendlyDate = function(date){

		var d = moment(date.date);
		d = d.format('ddd, Do MMM YYYY');
		if(date.am == 'false' && date.pm == 'true'){
			d += ' PM';
		}
		else if(date.pm == 'false' && date.am == 'true'){
			d += ' AM';
		}
		return d;
	}

	function getArray(coll, search, options, sort) {

		var def = Deferred();
	    var collection = db.collection(coll);

	    collection.find(search, options).sort(sort, function(err, cursor) {
	        if (err) def.reject(err);
	        cursor.toArray(function(err, arr) {
	            if (err) def.reject(err);
	            def.resolve(arr);
	        });
	    });
	    return def.promise();
	}

	server.listen(process.env.PORT || 4321);

});



