//The build will inline common dependencies into this file.

requirejs.config({
  baseUrl: './js',
  paths: {
    'jquery': 'vendor/jquery',
    'drop': 'vendor/jquery.event.drop',
    'drag' : 'vendor/jquery.event.drag',
    'chart' : 'vendor/jquery.chart',
    'underscore' : 'vendor/underscore-min',
    'global' : 'vendor/global',
    'form' : 'vendor/jquery.form'
  },
  shim: {
    'global' : ['jquery'], 
    'drop': ['jquery'],
    'drag': ['jquery'],
    'chart': ['jquery'], 
    'form' : ['jquery']
  }
}); 
          