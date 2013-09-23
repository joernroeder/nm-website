// Generated by CoffeeScript 1.6.3
define(['app', 'modules/SuperProject'], function(app, SuperProject) {
  var Project;
  Project = app.module();
  JJRestApi.Modules.extend(Project, function(Project) {
    JJRestApi.extendModel('Project', SuperProject.Model, {
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
