// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var Person;

  Person = app.module();
  JJRestApi.Modules.extend('Person', function(Person) {
    JJRestApi.extendModel('Person', {
      sayHello: function() {
        return alert('Hi. My name is ' + this.get('name'));
      }
    });
    return JJRestApi.extendCollection('Person', function() {});
  });
  return Person;
});
