define([
  'jquery',
  'underscore'
],

function ($, _) {

  'use strict';

	var self;
	var login = {

		init: function(){

			self = login;
			
			self.bindEvents();

		},

		bindEvents: function(){

			$('.login__form').on('submit', self.formPost);
			
		},


		formPost: function(e){

			if(self.formValidate(this)){
				alert("valid");
			}

			e.preventDefault();

		},

		formValidate: function(form){

			var flag = true;

			$('input[name!=""]', form).each(function(e){

				if($(this).val() != ""){
					fields.addClass("error");
					flag = false;
				}

			});

			return flag;

		}

	};

	$(login.init);

});