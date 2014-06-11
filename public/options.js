module.exports = {
  appDir: 'www',
  baseUrl: 'js/',
  mainConfigFile: 'www/js/common.js',
  dir: 'www-release',
  modules: [
    // First set up the common build layer.
    {
      // module names are relative to baseUrl
      name: 'common',
      // List common dependencies here. Only need to list
      // top level dependencies, 'include' will find
      // nested dependencies.
      include: [
        'jquery',
        'drop',
        'drag',
        'chart',
        'underscore',
        'global',
        'form'
      ]
    },
    {
      name: 'app/allUsers',
      exclude: ['common']
    },
    {
      name: 'app/login',
      exclude: ['common']
    } 
  ]
};