// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var SuperProject;

  SuperProject = app.module();
  SuperProject.Model = Backbone.JJRelationalModel.extend({
    idArrayOfRelationToClass: function(classType) {
      if (this.get('ClassName') === 'Project' && classType === 'Project') {
        return this.get('ChildProjects').getIDArray().concat(this.get('ParentProjects').getIDArray());
      } else if (this.get('ClassName') === classType) {
        return [];
      }
      return this.get(classType + 's').getIDArray();
    },
    hasRelationTo: function(classType, id) {
      var idArray;

      idArray = this.idArrayOfRelationToClass(classType);
      if (_.indexOf(idArray, id) < 0) {
        return false;
      } else {
        return true;
      }
    }
  });
  return SuperProject;
});
