// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var ProjectEditor;

  ProjectEditor = app.module();
  ProjectEditor.Inst = (function() {
    function Inst(model) {
      this.model = model;
      this.containerView = new ProjectEditor.Views.Container({
        model: this.model
      });
      this.previewView = new ProjectEditor.Views.Preview({
        model: this.model
      });
      this.mainView = new ProjectEditor.Views.Main({
        model: this.model
      });
      this.modelJSON = this.model.toJSON();
      app.layout.setViewAndRenderMaybe('#project-editor', this.containerView);
    }

    Inst.prototype.toggleView = function() {
      return this.containerView.toggleView();
    };

    return Inst;

  })();
  ProjectEditor.Views.Container = Backbone.View.extend({
    tagName: 'div',
    className: 'editor-project-container',
    template: 'security/editor-project-container',
    beforeRender: function() {
      this.setView('.editor-project-main', app.ProjectEditor.mainView);
      return this.setView('.editor-project-preview', app.ProjectEditor.previewView);
    },
    toggleView: function() {
      var ACTIVE;

      ACTIVE = 'active';
      return $('.editor-project-main, .editor-project-preview').toggleClass(ACTIVE);
    }
  });
  ProjectEditor.Views.Preview = Backbone.View.extend({
    tagName: 'div',
    template: 'security/editor-project-preview',
    serialize: function() {
      return app.ProjectEditor.modelJSON;
    }
  });
  ProjectEditor.Views.Main = Backbone.View.extend({
    tagName: 'div',
    template: 'security/editor-project-main',
    serialize: function() {
      return app.ProjectEditor.modelJSON;
    }
  });
  return ProjectEditor;
});
