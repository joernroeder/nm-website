// Generated by CoffeeScript 1.4.0

define(['app'], function(app) {
  var Router;
  Router = Backbone.Router.extend({
    routes: {
      '': 'index',
      ':hash': 'index'
    },
    index: function(hash) {
      return console.log('index');
    }
  });
  return Router;
});
