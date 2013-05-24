// Generated by CoffeeScript 1.6.2
define(['app', 'modules/DataRetrieval', 'modules/RecycleBin', 'plugins/misc/spin.min', 'plugins/misc/jquery.list', 'plugins/editor/jquery.jjdropzone', 'plugins/editor/jquery.jjmarkdown'], function(app, DataRetrieval, RecycleBin, Spinner) {
  "use strict";
  var UserSidebar;

  UserSidebar = app.module();
  UserSidebar.config = {};
  UserSidebar.config.spinner = {
    lines: 13,
    length: 6,
    width: 2,
    radius: 7,
    corners: 1,
    rotate: 0,
    direction: 1,
    color: '#fff',
    speed: 1,
    trail: 70,
    shadow: false,
    hwaccel: false,
    className: 'spinner',
    zIndex: 2e9,
    top: 'auto',
    left: 'auto'
  };
  UserSidebar.construct = function() {
    var view;

    view = new UserSidebar.Views.Main();
    view.$el.appendTo('#editor-sidebar');
    view.render();
    return view;
  };
  UserSidebar.setPendingReq = function(req) {
    var _this = this;

    if (this.pendingRequest) {
      this.pendingRequest.reject();
    }
    this.pendingRequest = req;
    return this.pendingRequest.always(function() {
      return _this.pendingRequest = null;
    });
  };
  UserSidebar.Views.Main = Backbone.View.extend({
    tagName: 'div',
    className: 'editor-sidebar',
    template: 'security/editor-sidebar',
    availableSubViews: {
      'user': 'UserSidebar',
      'gallery': 'GallerySidebar'
    },
    subView: null,
    events: {
      'click [data-editor-sidebar-content]': 'toggleSidebarCheck'
    },
    toggleSidebarCheck: function(e) {
      var $target, subViewName, toShow;

      e.preventDefault();
      $target = $(e.target);
      toShow = $target.data('editor-sidebar-content');
      subViewName = this.getSubviewName(toShow);
      if (this.subViewName === subViewName) {
        if (!this.subView.__manager__.hasRendered) {
          return false;
        }
        $target.toggleClass('active');
        this.toggle();
      } else if (subViewName) {
        $target.parents('nav').find('.active').removeClass('active').end().end().addClass('active');
        this.setSubview(subViewName, true);
        this.open(true);
      }
      return false;
    },
    toggleEditorClass: function(isEditor) {
      var method;

      method = isEditor ? 'addClass' : 'removeClass';
      if (method === 'removeClass' && this.$el.hasClass('is-editor')) {
        this.close();
        this.setSubview();
      }
      return this.$el[method]('is-editor');
    },
    triggerSubview: function(method) {
      var args, methodName;

      args = Array.prototype.slice.call(arguments);
      methodName = 'on' + method.charAt(0).toUpperCase() + method.slice(1);
      if (this.subView) {
        if (this.subView[methodName]) {
          return this.subView[methodName].apply(this.subView, args.slice(1));
        }
      }
    },
    getSubviewName: function(toShow) {
      if (this.availableSubViews[toShow]) {
        return this.availableSubViews[toShow];
      } else {
        return false;
      }
    },
    setSubview: function(subViewName, doRender) {
      if (subViewName) {
        this.subViewName = subViewName;
        this.subView = new UserSidebar.Views[subViewName]();
        this.subView.parentView = this;
        this.startSpinner();
        this.setView('#editor-sidebar-container', this.subView);
        if (doRender) {
          return this.subView.render();
        }
      } else {
        if (this.subView) {
          this.subView.remove();
        }
        this.subView = null;
        return this.subViewName = null;
      }
    },
    open: function(switched) {
      var _this = this;

      this.$el.addClass('open');
      return setTimeout(function() {
        _this.triggerSubview('opened', switched);
        return _this.$el.addClass('opened');
      }, 300);
    },
    close: function() {
      var _this = this;

      this.triggerSubview('close');
      this.$el.removeClass('open').find('nav .active').removeClass('active');
      return setTimeout(function() {
        return _this.$el.removeClass('opened');
      }, 300);
    },
    toggle: function() {
      if (this.$el.hasClass('open')) {
        return this.close();
      } else {
        return this.open();
      }
    },
    initSpinner: function() {
      return this.spinner = {
        inst: new Spinner(UserSidebar.config.spinner),
        target: $('#editor-sidebar-spinner', this.$el)[0]
      };
    },
    startSpinner: function() {
      var spinner;

      spinner = this.spinner;
      $(spinner.target).addClass('active');
      return spinner.inst.spin(spinner.target);
    },
    stopSpinner: function() {
      var spinner;

      spinner = this.spinner;
      $(spinner.target).removeClass('active');
      return spinner.inst.stop();
    },
    afterRender: function() {
      return this.initSpinner();
    }
  });
  UserSidebar.Views.SidebarContainer = Backbone.View.extend({
    $sidebarHeader: null,
    $sidebarContent: null,
    parentView: null,
    className: 'editor-sidebar-container',
    columnsPrefix: 'columns-',
    galleryData: {},
    initSidebar: function() {
      var _this = this;

      this.$sidebarHeader = $('> header', this.$el);
      this.$sidebarContent = $('section.editor-sidebar-content', this.$el);
      this.setSidebarHeight();
      return $.addOnWindowResize('editor.sidebar.height', function() {
        _this.setSidebarHeight();
        return _this._setColumnCount();
      });
    },
    hideSpinner: function() {
      if (this.parentView) {
        return this.parentView.stopSpinner();
      }
    },
    _cleanup: function() {
      if (this.uploadZone) {
        this.uploadZone.cleanup();
      }
      return $.removeOnWindowResize('editor.sidebar.height');
    },
    setSidebarHeight: function() {
      return this.$sidebarContent.css({
        'height': $(window).height() - this.$sidebarHeader.outerHeight()
      });
    },
    _getColumnsCount: function() {
      return this.$sidebarContent.data('columns');
    },
    _setColumnCount: function() {
      var columnsCount, prefColumnsCount, width;

      if (!this.$sidebarContent) {
        return;
      }
      width = parseInt(this.$sidebarContent.width(), 10);
      prefColumnsCount = this._getColumnsCount();
      columnsCount = Math.floor(width / 75);
      if (columnsCount) {
        return this.$sidebarContent.removeClass(this.columnsPrefix + prefColumnsCount).addClass(this.columnsPrefix + columnsCount).data('columns', columnsCount);
      }
    },
    _afterRender: function() {
      var _this = this;

      this.hideSpinner();
      this.initSidebar();
      (_.once(function() {
        _this.$sidebarContent = $('.editor-sidebar-content', _this.$el);
        if (_this.isOpen) {
          return _this._setColumnCount();
        }
      }))();
      if (this.isOpen) {
        this._setColumnCount();
      }
      if (this.$sidebarContent.hasClass('scrollbox')) {
        return this.$sidebarContent.list({
          headerSelector: 'header'
        });
      }
    },
    _onOpened: function(switched) {
      var delay,
        _this = this;

      delay = switched ? 0 : 300;
      this.isOpen = true;
      return setTimeout(function() {
        return _this._setColumnCount();
      }, delay);
    },
    onOpened: function(switched) {
      return this._onOpened(switched);
    },
    _onClose: function() {
      var prefColumnsCount,
        _this = this;

      this.isOpen = false;
      prefColumnsCount = this._getColumnsCount();
      return setTimeout(function() {
        if (_this.$sidebarContent) {
          return _this.$sidebarContent.removeClass(_this.columnsPrefix + prefColumnsCount);
        }
      }, 300);
    },
    onClose: function() {
      return this._onClose();
    }
  });
  /**
  		 * @todo : cleanup function!
  		 *
  */

  UserSidebar.Views.UserSidebar = UserSidebar.Views.SidebarContainer.extend({
    tagName: 'div',
    template: 'security/editor-sidebar-user',
    events: {
      'submit form.user-settings': 'changeUserCredentials'
    },
    cleanup: function() {
      this._cleanup();
      return this.bioEditor.cleanup();
    },
    render: function(template, context) {
      var done, req;

      if (context == null) {
        context = {};
      }
      done = this.async();
      req = DataRetrieval.forUserGallery('Person').done(function(gallery) {
        context.PersonImages = gallery.images.Person;
        context.Person = app.CurrentMemberPerson.toJSON();
        context.Member = app.CurrentMember;
        _.each(context.PersonImages, function(img) {
          if (context.Person.Image && img.id === context.Person.Image.ID) {
            return context.CurrentImage = img;
          }
        });
        return done(template(context));
      });
      return UserSidebar.setPendingReq(req);
    },
    initProjectList: function() {
      var projects, type, _i, _len, _ref,
        _this = this;

      projects = [];
      _ref = ['Projects', 'Exhibitions', 'Excursions', 'Workshops'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        type = _ref[_i];
        projects = projects.concat(app.CurrentMemberPerson.get(type).toJSON());
      }
      projects = _.sortBy(projects, function(project) {
        return project.Title.toLowerCase();
      });
      return _.each(projects.reverse(), function(project) {
        var view;

        if (project.EditableByMember) {
          view = new UserSidebar.Views.ProjectItem({
            model: project
          });
          _this.insertView('.editor-sidebar-content .project-list', view);
          return view.render();
        }
      });
    },
    initPersonImageList: function() {
      var sortedImgs,
        _this = this;

      sortedImgs = _.sortBy(app.Cache.UserGallery.images.Person, 'id');
      return _.each(sortedImgs, function(image) {
        return _this.insertPersonImage(image);
      });
    },
    insertPersonImage: function(image) {
      var uploadZone, view;

      uploadZone = this.uploadZone;
      view = new UserSidebar.Views.PersonImage({
        model: image
      });
      this.insertView('.editor-sidebar-content .image-list', view);
      view.afterRender = function() {
        this._afterRender();
        return uploadZone.setAsDraggable(this.$el.find('[data-id]'));
      };
      return view.render();
    },
    initDropzone: function() {
      var _this = this;

      return this.uploadZone = new JJSingleImageUploadZone('#current-person-image', {
        url: app.Config.PersonImageUrl,
        getFromCache: function(id) {
          var result;

          result = null;
          _.each(app.Cache.UserGallery.images.Person, function(image) {
            if (image.id === id) {
              return result = image;
            }
          });
          return [result];
        },
        responseHandler: function(data) {
          var id, img, personImg;

          img = data[0];
          if (img.UploadedToClass) {
            app.updateGalleryCache(data);
            _this.insertPersonImage(img);
          }
          if (id = img.id) {
            _this.uploadZone.$dropzone.html('<img src="' + img.url + '">');
            personImg = app.CurrentMemberPerson.get('Image');
            if (id !== personImg && (!personImg || id !== personImg.id)) {
              return app.CurrentMemberPerson.save('Image', id);
            }
          }
        }
      });
    },
    initBioEditor: function() {
      var $bio, $preview, $textarea, bioEditor;

      $bio = this.$el.find('#bio');
      $textarea = $bio.find('.markdown-editor');
      $preview = $bio.find('.markdown-editor-preview');
      return this.bioEditor = bioEditor = new JJMarkdownEditor($textarea, {
        preview: $preview,
        dragAndDropAllowed: false,
        customParsers: [],
        onBlur: function(e) {
          var newbio, oldbio;

          newbio = $(e.target).val();
          oldbio = app.CurrentMemberPerson.get('Bio');
          if (newbio !== oldbio) {
            return app.CurrentMemberPerson.save('Bio', newbio);
          }
        }
      });
    },
    afterRender: function() {
      this._afterRender();
      this.initDropzone();
      this.initPersonImageList();
      this.initProjectList();
      return this.initBioEditor();
    },
    changeUserCredentials: function(e) {
      var $form, data, dfd,
        _this = this;

      e.preventDefault();
      $form = $(e.target);
      data = $form.serialize();
      dfd = $.ajax({
        url: app.Config.ChangeCredentialsUrl,
        data: data,
        type: 'POST'
      });
      dfd.done(function(res) {
        var msg;

        if (res.email) {
          $form.find('[name="email"]').val(res.email);
          _this.$el.find('.editor-header .email').text(res.email);
          app.CurrentMember.Email = res.email;
        }
        if (msg = res.msg) {
          return _this.showMessageAt(msg.text, $form.parent(), msg.type);
        }
      });
      return false;
    }
  });
  UserSidebar.Views.GallerySidebar = UserSidebar.Views.SidebarContainer.extend({
    tagName: 'div',
    template: 'security/editor-sidebar-gallery',
    $sidebarContent: null,
    cleanup: function() {
      this._cleanup();
      return this.$el.parent().off('dragenter');
    },
    initImageList: function() {
      /*
      				@.$imageList = $ '.image-list', @.$el unless @.$imageList
      
      				if @.$imageList.length
      					$('a', @.$imageList).on 'click', (e) ->
      						e.preventDefault()
      						$('.selected', @.$imageList).not(@).removeClass 'selected'
      
      						$(@).blur().toggleClass 'selected'
      
      
      					false
      */

      var _this = this;

      return _.each(app.Cache.UserGallery.images.Projects, function(proj) {
        return _.each(proj.Images, function(img) {
          return _this.insertGalleryImage(proj.FilterID, img);
        });
      });
    },
    insertGalleryImage: function(filterID, img) {
      var view;

      view = new UserSidebar.Views.GalleryImage({
        model: img
      });
      this.insertView('[data-filter-id="' + filterID + '"] .image-list', view);
      return view.render();
    },
    initFilter: function() {
      var _this = this;

      if (!this.$filter) {
        this.$filter = $('select.filter', this.$el);
      }
      if (this.$filter.length) {
        return this.$filter.on('change', function(e) {
          var $filtered, val;

          val = $(e.target).blur().val();
          if (val) {
            $filtered = $("[data-filter-id=" + val + "]", _this.$sidebarContent);
            if ($filtered.length) {
              _this.$sidebarContent.addClass('filtered');
              return $filtered.addClass('active').siblings().removeClass('active');
            }
          } else {
            return _this.$sidebarContent.removeClass('filtered').find('.active').removeClass('active');
          }
        });
      }
    },
    initDropzone: function() {
      var _this = this;

      this.uploadZone = new JJSimpleImagesUploadZone('#uploadzone', {
        url: app.Config.DocImageUrl,
        additionalData: {
          projectId: app.CurrentlyEditingProject.id,
          projectClass: app.CurrentlyEditingProject.get('ClassName')
        },
        responseHandler: function(data) {
          app.updateGalleryCache(data);
          return _.each(data, function(img) {
            return _this.insertGalleryImage(img.FilterID, img);
          });
        }
      });
      return this.$el.parent().on('dragenter', function(e) {
        if (!$('body').hasClass('drag-inline')) {
          _this.uploadZone.$dropzone.addClass('dragover');
          return $.fireGlobalDragEvent('dragstart', e.target, 'file');
        }
      });
    },
    render: function(template, context) {
      var done, req,
        _this = this;

      if (context == null) {
        context = {};
      }
      done = this.async();
      req = DataRetrieval.forUserGallery('Projects').done(function(gallery) {
        var currentProj, editFilter, old_i, projects;

        projects = _.sortBy(gallery.images.Projects, function(project) {
          return project.Title.toLowerCase();
        });
        currentProj = app.CurrentlyEditingProject;
        editFilter = currentProj.get('ClassName') + '-' + currentProj.id;
        old_i = 0;
        _.each(projects, function(project, i) {
          if (project.FilterID === editFilter) {
            return old_i = i;
          }
        });
        if (old_i) {
          projects.splice(0, 0, projects.splice(old_i, 1)[0]);
        }
        context.Projects = projects;
        return done(template(context));
      });
      return UserSidebar.setPendingReq(req);
    },
    afterRender: function() {
      this._afterRender();
      this.initFilter();
      this.initDropzone();
      return this.initImageList();
    }
  });
  UserSidebar.Views.ListItem = Backbone.View.extend({
    tagName: 'li',
    _cleanup: function() {
      this.$el.data('recyclable', null);
      return this.$el.off('dragstart dragend');
    },
    cleanup: function() {
      return this._cleanup();
    },
    serialize: function() {
      return this.model;
    },
    insert: function(root, child) {
      return $(root).prepend(child);
    },
    _afterRender: function() {
      return RecycleBin.setViewAsRecyclable(this);
    },
    afterRender: function() {
      return this._afterRender();
    }
  });
  UserSidebar.Views.GalleryImage = UserSidebar.Views.ListItem.extend({
    template: 'security/editor-sidebar-gallery-image',
    className: 'DocImage',
    cleanup: function() {
      this.$el.find('[data-md-tag]').trigger('dragend');
      return this._cleanup();
    },
    afterRender: function() {
      this._afterRender();
      return JJMarkdownEditor.setAsDraggable(this.$el.find('[data-md-tag]'));
    },
    liveRemoval: function() {
      var _this = this;

      _.each(this.__manager__.parent.views, function(viewGroups) {
        return _.each(viewGroups, function(view) {
          if (view.model.id === _this.model.id && view !== _this) {
            return view.remove();
          }
        });
      });
      return this.remove();
    }
  });
  UserSidebar.Views.PersonImage = UserSidebar.Views.ListItem.extend({
    template: 'security/editor-sidebar-person-image',
    className: 'PersonImage',
    cleanup: function() {
      this.$el.find('[data-id]').trigger('dragend');
      return this._cleanup();
    },
    liveRemoval: function() {
      var personImg;

      personImg = app.CurrentMemberPerson.get('Image');
      if (personImg.id === this.model.id) {
        $('#current-person-image').empty();
      }
      return this.remove();
    }
  });
  UserSidebar.Views.ProjectItem = UserSidebar.Views.ListItem.extend({
    template: 'security/editor-sidebar-project-item'
  });
  return UserSidebar;
});
