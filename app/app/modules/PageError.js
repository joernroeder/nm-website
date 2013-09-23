// Generated by CoffeeScript 1.6.3
define(['app'], function(app) {
  var PageError;
  PageError = app.module();
  PageError.Views.FourOhFour = Backbone.View.extend({
    template: '404',
    tagName: 'div',
    className: 'page-error',
    serialize: function() {
      return {
        url: this.attributes['data-url']
      };
    }
  });
  return PageError;
});
