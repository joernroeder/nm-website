// Generated by CoffeeScript 1.6.2
define(['app', 'modules/DataRetrieval', 'modules/Auth', 'modules/Portfolio', 'modules/NMMarkdownParser'], function(app, DataRetrieval, Auth, Portfolio) {
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
      this.modelJSON = _.extend(this.model.toJSON(), {
        CurrentMemberPerson: app.CurrentMemberPerson.toJSON()
      });
      Backbone.Events.trigger('projectEdited', this.model);
      this.model.on('saved', this.modelHasSaved, this);
    }

    Inst.prototype.kickOffRender = function() {
      return app.layout.setViewAndRenderMaybe('#project-editor', this.containerView);
    };

    Inst.prototype.getFilterID = function() {
      return "" + (this.model.get('ClassName')) + "-" + this.model.id;
    };

    Inst.prototype.toggleView = function() {
      return this.containerView.toggleView();
    };

    Inst.prototype.galleryImageRemoved = function(id) {
      var previewImage;

      previewImage = this.model.get('PreviewImage');
      if (previewImage && previewImage.id === id) {
        return this.previewView.removePreviewImage();
      }
    };

    Inst.prototype.modelHasSaved = function() {
      var selector, title;

      title = this.model.get('Title');
      selector = '[data-editor-name="Title"]';
      this.previewView.$el.find(selector).text(title);
      return this.mainView.$el.find(selector).text(title);
    };

    Inst.prototype.cleanup = function() {
      return this.model.off('saved', this.modelHasChanged);
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
      var name, view, _ref;

      _ref = this.views;
      for (name in _ref) {
        view = _ref[name];
        if (view.editor) {
          view.editor.trigger('editor.closepopovers');
        }
      }
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
            var img;

            img = model.get('Urls')['_320'];
            _this.uploadZone.$dropzone.addClass(_this.FILLED).html("<img src=\"" + img.Url + "\" />");
            if (_.indexOf(_this.model.get('Images').getIDArray(), model.id) < 0) {
              img = [
                {
                  FilterID: app.ProjectEditor.getFilterID(),
                  UploadedToClass: 'DocImage',
                  id: model.id,
                  url: thumbUrl
                }
              ];
              app.updateGalleryCache(img);
              Backbone.Events.trigger('DocImageAdded', img);
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
            return DataRetrieval.forDocImage(data[0].id).done(function(model) {
              return setPreviewImage(model, data[0].url);
            });
          }
        }
      });
      return this;
    },
    initEditor: function() {
      var _this = this;

      this.editor = new JJEditor($('.meta'), ['InlineEditable', 'DateEditable', 'MarkdownEditable']);
      this.editor.on('stateUpdate', function(e) {
        var key, val, _changed, _ref;

        _changed = false;
        _ref = e.ProjectPreview;
        for (key in _ref) {
          val = _ref[key];
          if (key === 'TeaserText' && val) {
            val = val.raw;
          }
          if (!val) {
            continue;
          }
          if (_this.model.get(key) !== val) {
            _changed = true;
            _this.model.set(key, val);
          }
        }
        if (_changed) {
          return _this.model.rejectAndSave();
        }
      });
      return this;
    },
    removePreviewImage: function() {
      return this.uploadZone.$dropzone.removeClass(this.FILLED).empty();
    },
    afterRender: function() {
      this.initDropzone();
      return this.initEditor();
    },
    serialize: function() {
      return app.ProjectEditor.modelJSON;
    }
  });
  ProjectEditor.Views.Main = Backbone.View.extend({
    tagName: 'article',
    template: 'security/editor-project-main',
    initEditor: function() {
      var markdownEditor,
        _this = this;

      this.editor = new JJEditor(this.$el, ['InlineEditable', 'DateEditable', 'SplitMarkdownEditable', 'SelectEditable', 'SelectPersonEditable', 'SelectListEditable']);
      markdownEditor = this.editor.getComponentByName('ProjectMain.Text').markdown;
      _.extend(markdownEditor.options, {
        additionalPOSTData: {
          projectId: app.ProjectEditor.model.id,
          projectClass: app.ProjectEditor.model.get('ClassName')
        },
        uploadResponseHandler: function(data) {
          app.updateGalleryCache(data);
          return Backbone.Events.trigger('DocImageAdded', data);
        }
      });
      this.editor.on('editor.open-split-markdown', function() {
        return $('#layout').addClass('open-split-markdown');
      });
      this.editor.on('editor.close-split-markdown', function() {
        return $('#layout').removeClass('open-split-markdown');
      });
      this.editor.on('stateUpdate', function(e) {
        return _this.stateUpdate(e);
      });
      return this;
    },
    stateUpdate: function(e) {
      var key, relKey, text, toPost, val, _changed, _populateEditors, _ref,
        _this = this;

      console.group('STATE UPDATE');
      console.log('this: %o', this);
      console.log('state: ', e.ProjectMain);
      _changed = false;
      _populateEditors = false;
      _ref = e.ProjectMain;
      for (key in _ref) {
        val = _ref[key];
        if (key === 'Text') {
          text = val.raw ? val.raw : '';
          if (text !== this.model.get('Text')) {
            _changed = true;
            this.model.set('Text', text);
          }
          if (val.images) {
            _.each(val.images.ids, function(id, i) {
              var found;

              found = false;
              _this.model.get('Images').each(function(projImage) {
                if (projImage.id === id) {
                  return found = true;
                }
              });
              if (!found) {
                return DataRetrieval.forDocImage(id).done(function(model) {
                  var existImg, theImg;

                  _this.model.get('Images').add(model);
                  existImg = app.getFromGalleryCache('DocImage', model.id);
                  theImg = [
                    {
                      FilterID: app.ProjectEditor.getFilterID(),
                      UploadedToClass: 'DocImage',
                      id: model.id,
                      url: existImg.url
                    }
                  ];
                  app.updateGalleryCache(theImg);
                  return Backbone.Events.trigger('DocImageAdded', theImg);
                });
              }
            });
          }
        } else if (_.indexOf(['Excursion', 'Exhibition', 'Workshop', 'Project'], key) >= 0) {
          relKey = key === 'Project' && this.model.get('ClassName') === 'Project' ? 'ChildProjects' : key + 's';
          if (this.model.setRelCollByIds(relKey, val)) {
            _changed = true;
          }
        } else if (key === 'Person') {
          val.push(app.CurrentMemberPerson.id);
          if (this.model.setRelCollByIds('Persons', val)) {
            _populateEditors = true;
            _changed = true;
          }
        } else if (key === 'Category') {
          if (this.model.setRelCollByIds('Categories', val)) {
            _changed = true;
          }
        } else if (key === 'BlockedEditors' || key === 'Editors') {
          console.log('Editors: %o', val);
          if (_.difference(val, app.ProjectEditor[key]).length > 0 || _.difference(app.ProjectEditor[key], val).length > 0) {
            console.log('something changed');
            console.log('post to server %o', val);
            app.ProjectEditor[key] = val;
            toPost = {
              className: this.model.get('ClassName'),
              id: this.model.id,
              editors: val
            };
          }
        } else if (key === 'Title' && this.model.get('Title') !== val) {
          this.model.set('Title', val);
          _changed = true;
        }
      }
      console.groupEnd();
      if (_changed) {
        return this.model.rejectAndSave().done(function(model) {
          return _this.populateEditorsSelectable(_this.model.getEditorsKey(), false);
        });
      }
    },
    populateSelectEditables: function() {
      var sanitize, type, _fn, _i, _j, _len, _len1, _ref, _ref1, _results,
        _this = this;

      sanitize = {
        'Person': function(list) {
          var personId, source, values;

          source = [];
          personId = app.CurrentMemberPerson.id;
          _.each(list, function(person) {
            if (person.ID !== personId) {
              return source.push(person);
            }
          });
          values = _.without(_this.model.get('Persons').getIDArray(), personId);
          return {
            source: source,
            values: values
          };
        },
        'Category': function(list) {
          return {
            source: list,
            values: _this.model.get('Categories').getIDArray()
          };
        }
      };
      _ref = ['Project', 'Excursion', 'Exhibition', 'Workshop'];
      _fn = function(type) {
        return sanitize[type] = function(list) {
          var source, values;

          source = [];
          _.each(list, function(obj) {
            if (!(_this.model.get('ClassName') === type && _this.model.id === obj.ID)) {
              return source.push(obj);
            }
          });
          values = _this.model.idArrayOfRelationToClass(type);
          return {
            source: source,
            values: values
          };
        };
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        type = _ref[_i];
        _fn(type);
      }
      $.getJSON(app.Config.BasicListUrl).done(function(res) {
        var selectSubClasses, selectables, subClass, _j, _len1;

        if (_.isObject(res)) {
          _this.basicList = res;
        }
        selectSubClasses = ['select-list', 'select-person'];
        selectables = _this.editor.getComponentsByType('select');
        for (_j = 0, _len1 = selectSubClasses.length; _j < _len1; _j++) {
          subClass = selectSubClasses[_j];
          selectables = selectables.concat(_this.editor.getComponentsByType(subClass));
        }
        if (selectables && _this.basicList) {
          return $.each(selectables, function(i, selectable) {
            var name, source_vals;

            name = selectable.getDataName();
            if (_this.basicList[name]) {
              if (sanitize[name]) {
                source_vals = sanitize[name](_this.basicList[name]);
              }
              if (source_vals) {
                selectable.setSource(source_vals.source, true);
                return selectable.setValue(source_vals.values, true);
              }
            }
          });
        }
      });
      _ref1 = ['BlockedEditors', 'Editors'];
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        type = _ref1[_j];
        _results.push((function(type) {
          var selectable;

          if (selectable = _this.editor.getComponentByName('ProjectMain.' + type)) {
            return $.getJSON(app.Config.GetEditorsUrl, {
              className: _this.model.get('ClassName'),
              id: _this.model.id
            }).done(function(ids) {
              console.log('editors from server %o', ids);
              if (_.isArray(ids)) {
                app.ProjectEditor[type] = ids;
                return _this.populateEditorsSelectable(type);
              }
            });
          }
        })(type));
      }
      return _results;
    },
    serialize: function() {
      return app.ProjectEditor.modelJSON;
    },
    afterRender: function() {
      this.initEditor();
      return this.populateSelectEditables();
    },
    populateEditorsSelectable: function(type, silent) {
      var personsIdArray, personsIdList, selectable;

      if (silent == null) {
        silent = true;
      }
      if (selectable = this.editor.getComponentByName('ProjectMain.' + type)) {
        personsIdList = this.model.basicListWithoutCurrentMember('Persons');
        personsIdArray = _.map(personsIdList, function(o) {
          return o.ID;
        });
        console.log('setting source to %o', personsIdList);
        selectable.setSource(personsIdList, silent);
        console.log(app.ProjectEditor[type]);
        app.ProjectEditor[type] = _.intersection(app.ProjectEditor[type], personsIdArray);
        console.log('setting values to %o', app.ProjectEditor[type]);
        return selectable.setValue(app.ProjectEditor[type], silent);
      }
    }
  });
  return ProjectEditor;
});
