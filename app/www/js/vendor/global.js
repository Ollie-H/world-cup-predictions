define([
  'jquery',
  'underscore'
],

function ($, _) {

   'use strict';

    var that;

    var fn = function(){

      that=this;

    }
 
    fn.prototype = { 

      init : function(){

      },

      formValidate : function($form, callback){

        // Add in resuatble form validation here
        callback($form);

      },

      navigate: function(d, url){

        if($('.message').length > 0){
          
          var $sp = $("<span></span>").text(d.message);
          $('.message').html($sp).addClass('message--'+d.type);

        }

        if(d.type != 'error'){

          window.setTimeout(function(){

            window.location.href = url;

          },400);
          
        }

      }

    }

    return fn;

});