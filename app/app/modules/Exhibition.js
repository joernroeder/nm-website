// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var Exhibition;

  Exhibition = app.module();
  JJRestApi.Modules.extend('Exhibition', function(Exhibition) {
    JJRestApi.extendModel('Exhibition', {
      foo: 'bar'
    });
    return JJRestApi.extendCollection('Exhibition', {
      foo: 'bar'
    });
  });
  return Exhibition;
});