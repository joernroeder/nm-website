// Generated by CoffeeScript 1.6.2
define(['app', 'plugins/gravity/jquery.gravity'], function(app) {
  var Gravity;

  Gravity = app.module();
  Gravity.Views.Container = Backbone.View.extend({
    id: 'gravity-container',
    afterRender: function() {
      return $(this.el).height($(window).height()).RadialGravity({
        worker: {
          physics: '/app/assets/js/plugins/gravity/backend/physics.js'
        }
      });
    }
  });
  return Gravity;
});