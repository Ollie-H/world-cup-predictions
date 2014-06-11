module.exports = function(_, Deferred){

	var queries = {}

	// class methods
	queries.exists = function(db, _collection, params) {
		var collection = db.collection(_collection);
		collection.findOne(params, function(err, item){
			return item.length > 0;
		});
	};

	queries.getCalendar = function(dates){

		var today = new Date();

		var mm = (typeof(dates)==='undefined') ? today.getMonth() : dates.month*1;
		var yy = (typeof(dates)==='undefined') ? today.getFullYear() : dates.year*1;

		// these are labels for the days of the week
		var cal_days_labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		var cal_months_labels = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		return {days : cal_days_labels, months: cal_months_labels, dates : getDaysInMonth(mm, yy) };

	}

	queries.findAll = function(items, callback){
		var docs = [];
		items.each(function(doc){
			docs.push(doc);
		});
		callback(docs);
	}

	queries.authenticate = function(req, res, next){

		if(!req.cookies.loggedin){
			res.redirect("/login");
			return false;
		}

		next();
	}

	queries.groupHolidays = function(usergroup){

		Date.prototype.getDOY = function() {
			var start = new Date(1970,0,1);
			return Math.ceil((this - start) / 86400000);
		}

		var tmp = [];

		_.each(usergroup, function(user){

			var holGroup = {holidayGroup: []};

			var hols = user.holidays;

			if(!hols || hols.length == 0) return false;

				var hols = _.sortBy(hols, function(hol){ hol.user = user; return new Date(hol.date).getTime(); }),
					c = 0,
					grouped = _.values( _.groupBy(hols, function(el, i, arr) {
						var _el = new Date(el.date);
						var last = i ? new Date(arr[i-1].date).getDOY() : 0;
						return i ? c+= ((1 !== _el.getDOY() - last)) : 0;
	   				}));

	   				_.reject(grouped, function(group){
	   					var today = new Date().getDOY();
	   					if(new Date(group[group.length-1].date).getDOY() < today){
	   						return true;
	   					}
	   					else{
	   						tmp.push(group);
	   						return false;
	   					}
	   				});
				
		});

		tmp = _.sortBy(tmp, function(hols){ return new Date(hols[0].date).getTime(); });

		return tmp;

	}

	queries.renderUserTable = function(req, res, collection, date){

		var dayArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		var dates = (typeof(date)==='undefined') ? queries.getCalendar() : queries.getCalendar(date);
		var dDef = getArray('departments', {}, {});
		var dAll = getArray('users', {}, {});
		var lookups = Deferred.when(dDef, dAll);

		lookups.done(function(departments, allusers) {

			allusers = _.groupBy(allusers, function(user){ return user._department_id; });
			userGroup = _.findOne(allusers, { _department_id : req.cookies.user._id });

	        res.render('allUsers.jade', {
		        departments: departments,
				users: allusers,
				dates : dates,
				team : this.groupHolidays(userGroup),
				fs: {
					holidayStatus: function(hols,day,halfDayType){

						var now = new Date(day);

						if(!hols || this.isWeekend(dayArr[now.getDay()]) != "")	return false;

						for (var i = 0; i < hols.length; i++) {

							var hol = new Date(hols[i].date);

			        		if(hols[i][halfDayType] == 'true'){

				        		if(now - hol === 0){
						
									console.log('match');

									if(hols[i].approvedOn){
										return "hol-app";
									}
									else if(hols[i].rejectedOn){
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


			        	if(req.cookies.user._id == user._id || req.cookies.user.admin == 'true'){
			        		return "<a href='/user/"+user._id+"'>"+user.fname + " " + user.lname+"</a>";
			        	}
			        	else{
			        		return user.fname + ' ' + user.lname;
			        	}

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

	}

	getDaysInMonth = function(month, year) {
		var date = new Date(year, month, 1);
		var days = [];
		while (date.getMonth() === month) {
			days.push(new Date(date));
			date.setDate(date.getDate() + 1);
		}
		return days;
	}

	return queries;

};