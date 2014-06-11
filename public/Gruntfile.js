'use strict';

var opt = require('./options');

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({

      clean: {
        release: 'www-release'
      },

      requirejs: {
        compile: {
          options: opt
        }
      },

      watch: {
          options: {
              livereload: true
          },  
          scss: {
              files: ['www/scss/*.scss', 'www/scss/*/*.scss'],
              tasks: ['compass', 'cssmin'],
              options: {
                  spawn: false
              }
          },
          js : {
            files : ['www/js/*.js', 'www/js/app/*.js', 'www/js/vendor/*.js'],
            tasks : ['requirejs'],
            options : {
                spawn : false 
            }
          }
      },

      compass: {                  
        dist: {                  
          options: {              
            sassDir: 'www/scss',
            cssDir: 'www/css',
            environment: 'production'
          }
        }
      },

      cssmin: {
        compile: {
          files: {
            'www-release/css/style.css': 'www/css/style.css'
          }
        }
      }
    });

    // Load tasks from NPM
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task.
    grunt.registerTask('default', ['clean', 'requirejs', 'compass', 'cssmin']);

};
