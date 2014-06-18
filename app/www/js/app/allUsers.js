define([
  'jquery',
  'underscore',
  'drop',
  'drag',
  'chart',
  'global',
  'form'
],

function ($, _, drop, drag, chart, Global) {

  'use strict';

	var self, fn = new Global(), mousedown = false;
	var allUsers = {

		init: function(){

			self = allUsers;

			self.bindEvents();

		},

		bindEvents: function(){

			$('.fixtures').unbind("submit").on('submit', function(e) {

				e.preventDefault();
	
				var post = [];

				$('tr.row').each(function(){

					if($(this).find('.home-predict').val() != "" && $(this).find('.away-predict').val() != ""){

						post.push({
							'fixture_id' : $(this).data('fixture'),
							'homescore' : $(this).find('.home-predict').val(),
							'awayscore' : $(this).find('.away-predict').val()
						});
					}

				});

				$.ajax({
				  url: "/",
				  type: "POST",
				  data: {
				  	predictions : post
				  },
				  success: function(data, textStatus, jqXHR){ 
				  	alert("Predictions saved");
				  }
				});
			});

		},

		resize: function(){
		
			$('.calendar-container').css("height", $('.calendar-month__inner').actual('height'));
		
		},

		animateBreakdown: function(){

			$('.bar-chart').each(function(){

				var daysAllowed = $(this).attr('data-allowed')*1,
				daysTaken = daysAllowed - $(this).attr('data-taken')*1;

				$('span', this).css({'width' : ((daysTaken / daysAllowed) * 100) + "%" });

			});
	
				
		},

		getDates: function(){

			self.month = $('select.month').val()*1;
			self.year  = $('select.year').val()*1;

			$('.date-concat').html($('select.month option:selected').text() + " " + $('select.year option:selected').text());

		},

		nextMonth: function(e){
			
			if(self.flag){ return false; }
			if(self.month+1 >= 12){
				$('select.month').val(0);
				$('select.year').val(self.year+1);
			}
			else{
				$('select.month').val(self.month+1);
			}

			self.changeDate(e);
			e.preventDefault();

		},

		prevMonth: function(e){

			if(self.flag){ return false; }
			if(self.month-1 < 0){
				$('select.month').val(11);
				$('select.year').val(self.year-1);
			}
			else{
				$('select.month').val(self.month-1);
			}
			
			self.changeDate(e);
			e.preventDefault();

		},

		showSwitchBtn: function(){

			$('.date-select .switch').addClass('show').unbind("click").bind('click', self.changeDate);

		},

		changeDate: function(e){

			if(!self.flag){

				var prevMonth = self.month;
				var prevYear = self.year;
				self.getDates();

				if(prevYear == self.year && prevMonth == self.month){
					return false;
				}

				var $month = $('.calendar-month[data-date="'+ self.month+'_'+self.year+'"]');

				if($month.length > 0){
					self.animateMonth(prevMonth, prevYear, $month);
					return;
				}

				self.flag = true;

				$.ajax({
				  url: "/" + self.month + "/" + self.year,
				  type: "GET",
				  success: function(data, textStatus, jqXHR){
				  	self.animateMonth(prevMonth, prevYear, data);
				  }
				});

			}

			e.preventDefault();

		},

		animateMonth: function(prevMonth, prevYear, n){

			if(typeof(n) === 'string'){
				$('.calendar-container').prepend($(n).find('.calendar-container').html());
				var $active = $('.calendar-month').eq(0);
			}
			else{
				var $active = $(n);
			}

			var anim1 = (prevYear < self.year || prevMonth < self.month) ? "month-moveToLeft" : "month-moveToRight";
		  	var anim2 = (prevYear < self.year || prevMonth < self.month) ? "month-moveFromRight" : "month-moveFromLeft";

		  	$('.calendar-month.inview').addClass(anim1);
		  	$active.addClass('inview ' + anim2).attr('data-date', self.month +"_"+ self.year);

		  	window.setTimeout(function(){
		  		$active.removeClass(anim2);
				$('.calendar-month.inview').not($active).removeClass('inview ' + anim1);
				self.resize();
				self.flag = false;
		  	}, 600);

		  	self.dragAndDropSelection();
		  	self.bindEvents();

		},

		dragAndDropSelection: function(){

			$('body').mouseup(function(){
				mousedown = false;
			});

			$('.inview tr.me span')
			.mousedown(function(){
				mousedown = true;
			})
			.mouseup(function(){
				mousedown = false;
			})
			.mousemove(function(e){

				e.preventDefault();
				e.stopPropagation();

				var self = this;

				if(!mousedown || $(this).parents('td').hasClass('weekend') || $(this).hasClass('hol-pend') || $(this).hasClass('hol-app') || self.flag){
					return false;
				}

				self.flag = true;

				if(!$(this).hasClass('selected')){
					$(this).addClass('selected');
				}else{
					$(this).removeClass('selected');
				}

				$(this).mouseout(function(){
					self.flag = false;
				});

				$('.save').addClass('show');
				if($('tr.me span.selected').length == 0){
					$('.save').removeClass('show');
				}

			})
			.click(function(e){
				$(this).toggleClass('selected');
				$('.save').addClass('show');
				if($('tr.me span.selected').length == 0){
					$('.save').removeClass('show');
				}
			});
		},


		submitHolidays: function(e){

			e.preventDefault();

			self.getDates();

			var dates = [],
				count = 0;

			$('.calendar-month').each(function(){

				var _date = $(this).attr('data-date').split("_"),
					tr = $(this).find('tr.me'),
					i = 1;

				while (i <= $(tr).find("td").length) {

					var td = $(tr).find("td").eq(i),
					am = true,
					pm = true,
					c = $(td).find(".selected").length;

					if(c > 0 && !$(td).hasClass('weekend')){

						count = (c == 1) ? count+0.5 : count+1;
						
						var d = new Date(_date[1], _date[0], i);

						var am = $(td).find("span").eq(0).hasClass('selected');
						var pm = $(td).find("span").eq(1).hasClass('selected');

						dates.push({ date: d, am : am, pm : pm, dateBooked : new Date(), status : 'pending' });
					}

					i++;

				}

			});

			self.confirmHolidays(count, dates, self.postHolidays);

		},

		confirmHolidays: function(count, dates, postHolidays){

			$.ajax({
			  url: "/confirmHolidays",
			  type: "POST",
			  data : {
			  	dates : dates
			  },
			  success: function(data, textStatus, jqXHR){

			  	$('.container__inner').append($(data));

			  	self.alertPosition();

			  	self.userAlert(count, dates, postHolidays);

			  }
			});

		},

		alertPosition: function(){
			window.setTimeout(function(){
				$('.alert__inner').animate({'margin-top' : (($(window).height() - $('.alert__inner').height()) / 2) }, 200);
			},100);
		},

		userAlert: function(count, dates, postHolidays){

			  	$('.date__remove').on('click', function(e){
			  		var $tr = $(this).parents('tr'),
			  			i = $tr.index('.alert__inner tr');
			  		$tr.remove();
			  		dates.splice(i, 1);
			  		e.preventDefault();
			  	});

			  	$('.alert__cancel').on('click', function(e){

			  		$('.alert').fadeOut('slow', function(){ $(this).remove(); });
			  		$('img').each(function(){
			  			$(this).attr('src',$(this).attr('src') + "?cache=" + new Date().getTime());
			  		});
			  		e.preventDefault();
			  	});

			  	$(document).keyup(function(e) {
				  if (e.keyCode == 27) {
				  	$('.alert').fadeOut('slow', function(){ $(this).remove(); });
				  }
				});

			  	$('.alert__submit').on('click', function(e){
			  		postHolidays(count, dates);
			  		e.preventDefault();
			  	});

		},

		postHolidays: function(count, dates){

			var id = $('tr.me').attr('data-id');

			$.ajax({
			  url: "user/"+id+"/saveHolidays",
			  type: "POST",
			  data : {
			  	count : count,
			  	dates : dates
			  },
			  success: function(d, textStatus, jqXHR){
			  	 fn.navigate(d, '/');
			  }
			});

		},

		popup: function(e){

			var href = $(this).attr('href');

			$.ajax({
			  url: href,
			  type: "GET",
			  success: function(data, textStatus, jqXHR){

			  	$('.container__inner').append($(data));

			  	self.bindEvents();
		  		self.userAlert();
		  		self.alertPosition();

			  }
			});


			e.preventDefault();

		},

		saveAuth: function(e){

			var auths = [];

			$('.auth-hols tr').each(function(i, val){
				auths[i] = $(this).find("select").val();
			});

			$.ajax({
			  url: $('.auth-hols').attr('data-url'),
			  type: "POST",
			  data : {
			  	auths : auths
			  },
			  success: function(d, textStatus, jqXHR){
			  	 fn.navigate(d, '/');
			  }
			});

			e.preventDefault();

		}
	};

	$(allUsers.init);

});