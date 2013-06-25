// Generated by CoffeeScript 1.6.2
define(['app', 'modules/DataRetrieval', 'modules/Auth'], function(app, DataRetrieval, Auth) {
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
    }

    Inst.prototype.kickOffRender = function() {
      return app.layout.setViewAndRenderMaybe('#project-editor', this.containerView);
    };

    Inst.prototype.toggleView = function() {
      return this.containerView.toggleView();
    };

    Inst.prototype.galleryImageRemoved = function(id) {
      if (this.model.get('PreviewImage').id === id) {
        return this.previewView.removePreviewImage();
      }
    };

    return Inst;

  })();
  ProjectEditor.Views.Container = Backbone.View.extend({
    tagName: 'div',
    className: 'editor-project-container',
    template: 'security/editor-project-container',
    ACTIVE: 'active',
    beforeRender: function() {
      this.setView('.editor-project-main', app.ProjectEditor.mainView);
      return this.setView('.editor-project-preview', app.ProjectEditor.previewView);
    },
    toggleView: function() {
      return $('.editor-project-main, .editor-project-preview').toggleClass(this.ACTIVE);
    }
  });
  ProjectEditor.Views.Preview = Backbone.View.extend({
    tagName: 'article',
    template: 'security/editor-project-preview',
    FILLED: 'filled',
    cleanup: function() {
      return this.uploadZone.cleanup();
    },
    getFilterID: function() {
      return "" + (this.model.get('ClassName')) + "-" + this.model.id;
    },
    initDropzone: function() {
      var _this = this;

      app.ProjectEditor.PreviewImageZone = this.uploadZone = new JJSingleImageUploadZone('.preview-image', {
        url: app.Config.DocImageUrl,
        additionalData: {
          projectId: app.ProjectEditor.model.id,
          projectClass: app.ProjectEditor.model.get('ClassName')
        },
        getFromCache: function(id) {
          return DataRetrieval.forDocImage(id);
        },
        responseHandler: function(data) {
          var $img, setPreviewImage;

          setPreviewImage = function(model, thumbUrl) {
            var img, sideSubview;

            img = model.get('Urls')['_320'];
            _this.uploadZone.$dropzone.addClass(_this.FILLED).html("<img src=\"" + img.Url + "\" />");
            if (sideSubview = Auth.Cache.userWidget.subView) {
              if (sideSubview.isGallery && sideSubview.isOpen) {
                if (!_this.model.get('Images').get(model.id)) {
                  sideSubview.insertGalleryImage(_this.getFilterID(), {
                    url: thumbUrl,
                    id: model.id
                  });
                }
              }
            }
            if (_this.model.get('PreviewImage') !== model) {
              _this.model.set('PreviewImage', model);
              _this.model.get('Images').add(model);
              return _this.model.rejectAndSave();
            }
          };
          if (data instanceof Backbone.Model === true) {
            $img = $("#editor-sidebar").find("li.DocImage img[data-id=\"" + data.id + "\"]");
            return setPreviewImage(data, $img.attr('src'));
          } else {
            app.updateGalleryCache(data);
            return DataRetrieval.forDocImage(data[0].id).done(function(model) {
              return setPreviewImage(model, data[0].url);
            });
          }
        }
      });
      return this;
    },
    removePreviewImage: function() {
      return this.uploadZone.$dropzone.removeClass(this.FILLED).empty();
    },
    afterRender: function() {
      return this.initDropzone();
    },
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
