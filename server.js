// Librairies
var express = require('express'),
	socket = socket,
	app = express(),
	path = require('path'),
	http = require('http'),
	server = http.createServer(app),
	jade = require('jade'),
	MongoClient = require('mongodb').MongoClient,
	ObjectID=require('mongodb').ObjectID,
	_ = require('underscore-node'),
	db = null,
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	Deferred = require('Deferred'),
	request = require("request"),
	moment = require('moment'),
	uid = null;


MongoClient.connect("mongodb://localhost:27017/test", function(err, mongodb) {

	if(err) { console.log("error"); return false; }

	db = mongodb;

	// Views Options
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(cookieParser());
	app.use(bodyParser());
	app.set("view options", { layout: false });
	app.use(express.static(__dirname + '/app/www-release'));

	process.on('uncaughtException', function(err) {
	  console.log(err.stack);
	});

	// Render and send the main page
	app.get('/', authenticate, function(req, res){

		updatePoints(req);
		updateFixtures();

		var dFixtures = getArray('fixtures', {}, {}, {});
		var dPredictions = getArray('predictions', {'user_id' : req.cookies.user._id }, {}, {});
		var lookups = Deferred.when(dFixtures, dPredictions);

		lookups.done(function(fixtures, predictions) {

			fixtures = _.groupBy(fixtures, function(fixture){
				return moment(fixture.play_at, "YYYY/MM/DD").format("MMMM Do YYYY");
			});

			fixtures = _.sortBy(fixtures, function(fixture){
				return moment(fixture[0].play_at, "YYYY/MM/DD").dayOfYear();
			});

			var passed = [];
			fixtures = _.reject(fixtures, function(fixture, key, list){
				var now = moment().dayOfYear();
				var then = moment(fixture[0].play_at, "YYYY/MM/DD").dayOfYear();
				if(then < now){
					passed.push(fixture);
				}
				return then < now;
			});

			res.render('fixtures.jade', {
				fixtures : fixtures,
				predictions : predictions,
				user: req.cookies.user,
				passed: passed,
				fs: {
					matchPredictions: function(id, attr){
						var fixture = _.findWhere(predictions, { fixture_id :  id.toString() });
						if(fixture){
							return fixture[attr+'score'];
						}
						return '';
					},
					formateDate: function(date){
						return moment(date, "YYYY/MM/DD").format("MMMM Do YYYY");
					}
				}
			});

		});
	});

	app.get('/results', authenticate, function(req, res){

		var dFixtures = getArray('fixtures', {}, {}, {});
		var lookups = Deferred.when(dFixtures);

		lookups.done(function(fixtures) {

			fixtures = _.sortBy(fixtures, function(fixture){
				return new Date(fixture.play_at);
			});

			fixtures = _.reject(fixtures, function(fixture){
				var now = moment().dayOfYear();
				var then = moment(fixture.play_at, "YYYY/MM/DD").dayOfYear();
				return then >= now;
			});

			res.render('results.jade', {
				fixtures : fixtures,
				user: req.cookies.user
			});

		});


	});

	app.get('/league', authenticate, function(req, res){

		var dAll = getArray('users', {}, {}, { points : -1, lname : 1 });
		var lookups = Deferred.when(dAll);

		lookups.done(function(users){

			res.render('league.jade', {
				user: req.cookies.user,
				users: users
			});

		});


	});


	app.post('/', function(req, res){

		var uid = req.cookies.user._id;

		_.each(req.body.predictions, function(prediction, i){

			prediction.user_id = uid;

			db.collection('predictions').insert(prediction, function(err, records) {

				if(!err){
					res.send('success');
				}
			});

		});

	});

	app.get('/login', function(req, res){

		res.render('login.jade');

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

	app.get('/logout', function(req, res){

		res.cookie('loggedin', null);
		res.cookie('user', null);
		res.render('login.jade');

	});


	// Render and send the main page
	// app.get('/updateusers', function(req, res){

	// 	request({
	// 	    url: 'http://sbpd.saddingtonbaynes.com/users.php',
	// 	    json: true
	// 	}, function (error, response, body) {

	// 	    if (!error && response.statusCode === 200) {

	// 	        var userdata = body;

	// 			var collections = ['users', 'departments', 'positions'];
	// 			var dDef = getArray('positions', {}, {}, {});
	// 			var dDef = getArray('departments', {}, {}, {});
	// 			var dAll = getArray('users', {}, {}, {});
	// 			var lookups = Deferred.when(dDef, dAll);

	// 			lookups.done(function(positions, departments, allusers) {

	// 				var arg = arguments;

	// 				for (var x = 0; x < collections.length; x++) {

	// 					_.each(userdata['timekeeper'][collections[x]], function(entry, i){

	// 						if(  !_.findWhere(arg[x], { '_id' : entry._id }) ){
	// 							db.collection(collections[x]).insert(entry, function(err, records) {});
	// 						}

	// 					});

	// 				}

	// 			});
	// 	    }

	// 	});

	// });

	// app.get('/user/:id/edit', q.authenticate, function(req, res){

	// 	uid = req.params.id;

	// 	var dDef = getArray('departments', {}, {}, {});
	// 	var dAll = getArray('users', {}, {}, {});
	// 	var dUser = getArray('users', { _id: req.params.id }, {'limit' : 1}, {});

	// 	var lookups = Deferred.when(dDef, dAll, dUser);

	// 	lookups.done(function(departments, allusers, user) {

	// 		res.render('editUser.jade', {
	//         	departments : departments,
	//         	allusers : allusers,
	// 			user: user[0]
	// 		});

	//     });

	// });

	var updatePoints = function(req){

		var dUsers = getArray('users', {}, {}, {});
		var dFixtures = getArray('fixtures', {'score1' : { $ne: null }}, {}, {});

		var lookups = Deferred.when(dUsers, dFixtures);

		lookups.done(function(users, fixtures) {

			_.each(users, function(user){

				var points = 0;

				var dPredictions = getArray('predictions', {'user_id' : req.cookies.user._id }, {}, {});
				var lookups = Deferred.when(dPredictions);

				lookups.done(function(predictions) {

					_.each(fixtures, function(fixture){

						var prediction = _.findWhere(predictions, { 'fixture_id' : fixture._id.toString(), 'user_id' : user._id.toString() });

						if(prediction){

							if(
								prediction.homescore == fixture.score1 &&
								prediction.awayscore == fixture.score2
							){
								points += 3;
							}
							else if(
								(fixture.score1 > fixture.score2 && prediction.homescore > prediction.awayscore) ||
								(fixture.score1 < fixture.score2 && prediction.homescore < prediction.awayscore) ||
								(fixture.score1 == fixture.score2 && prediction.homescore == prediction.awayscore)
							){
								points += 1;
							}

						}

					});

					db.collection('users').update({'_id' : user._id }, { $set: { 'points' : points }}, function(err, records) {
						
					});


				});

			});

		});

	};	

	var updateFixtures = function(){

		for (var i = 0; i < 25; i++) {

			request({

				url: "http://footballdb.herokuapp.com/api/v1/event/world.2014/round/" + i,
				json: true

			},
			function (error, response, body) {

				if (!error && response.statusCode === 200) {

					var userdata = body;

					var dFixtures = getArray('fixtures', {}, {}, {});
					var lookups = Deferred.when(dFixtures);

					lookups.done(function(fixtures) {

							_.each(userdata['games'], function(fixture, i){

								db.collection('fixtures').update(
								{
									'team1_key' : fixture.team1_key,
									'team2_key' : fixture.team2_key
								},
								{ 
									$set: {
										score1 : fixture.score1,
										score2 : fixture.score2
									}
								}, function(err, records) {

								});

							});

					});

				}

			});

		};
	}

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

	function authenticate(req, res, next){

		if(!req.cookies.loggedin){
			res.redirect("/login");
			return false;
		}

		next();
	}


	server.listen(process.env.PORT || 9999);

});



