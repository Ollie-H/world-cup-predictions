define([
  'jquery',
  'underscore',
  'global'
],

function ($, _, Global) {

	'use strict';

	var self, fn = new Global();
	var editUser = {

		init: function(){

			self = editUser;
			
			self.bindEvents();

			fn.init();

		},

		bindEvents: function(){

			$(".displayImage").on("change", function(){
			  var that = this;
			  if (that.files && that.files[0]) {
			      var reader = new FileReader();    
			      $(this).data("file", that.files[0]);  
			      reader.onload = function (e) {
			          $(that).parent().find(".preview").attr('src', e.target.result);
			      }
			      reader.readAsDataURL(this.files[0]);
			  }
			});

			$('.edit-form').on('submit', function(e){

				var form = $('.edit-form')[0];
				var formData = new FormData( form );
				var inputLogo = $(".displayImage")[0];
				formData.append('displayImage', inputLogo.files[0]);
				formData.append("name", "value");
				formData.append("a", 1);
				formData.append("b", 2);
	 
	            $.ajax({
	                url: $(this).attr('action'),
	                type: "POST",
	                xhr: function() { 
		                var myXhr = $.ajaxSettings.xhr();
		                if(myXhr.upload){
		                    // TODO : Add in handleUploadProgress function
		                    // so the user has realtime progress feedback for the image upload. - Ollie
							//myXhr.upload.addEventListener('progress',handleUploadProgress, false);
		                }
		                return myXhr;
		            },
		            beforeSend: function(){
		            },
		            success: function(){
		            }
	            });

				e.preventDefault();

			});


		}

	};

	$(editUser.init);

});