// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var SuperProject;

  SuperProject = app.module();
  SuperProject.Model = Backbone.JJRelationalModel.extend({
    hasRelationTo: function(type, id) {
      console.log('check if it has relation to: %o, %o', type, id);
      return console.log(this);
    }
  });
  return SuperProject;
});
