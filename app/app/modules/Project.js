// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var Project;

  Project = app.module();
  JJRestApi.Modules.extend(Project, function(Project) {
    JJRestApi.extendModel('Project', {
      foo: 'bar'
    });
    JJRestApi.extendCollection('Project', {
      foo: 'bar'
    });
    return Project.Views.Test = Backbone.View.extend({
      template: 'head',
      tagName: 'div',
      className: 'head'
    });
  });
  return Project;
});