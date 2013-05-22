// Generated by CoffeeScript 1.6.2
define(['app', 'modules/DataRetrieval', 'plugins/editor/jquery.jjdropzone'], function(app, DataRetrieval) {
  var UserSidebar;

  UserSidebar = app.module();
  UserSidebar.construct = function() {
    var view;

    view = new UserSidebar.Views.Main();
    view.$el.appendTo('#editor-sidebar');
    view.render();
    return view;
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

      $target = $(e.target);
      toShow = $target.data('editor-sidebar-content');
      subViewName = this.getSubviewName(toShow);
      if (this.subViewName === subViewName) {
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
        this.setView('#editor-sidebar-container', this.subView);
        if (doRender) {
          return this.subView.render();
        }
      } else {
        return this.subView = null;
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
    }
  });
  UserSidebar.Views.SidebarContainer = Backbone.View.extend({
    $sidebarHeader: null,
    $sidebarContent: null,
    className: 'editor-sidebar-container',
    columnsPrefix: 'columns-',
    galleryData: {},
    initSidebar: function() {
      var _this = this;

      this.$sidebarHeader = $('> header', this.$el);
      this.$sidebarContent = $('section.editor-sidebar-content', this.$el);
      this.setSidebarHeight();
      return (_.once(function() {
        return $.addOnWindowResize('editor.sidebar.height', function() {
          return _this.setSidebarHeight();
        });
      }))();
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

      this.initSidebar();
      (_.once(function() {
        _this.$sidebarContent = $('.editor-sidebar-content', _this.$el);
        if (_this.isOpen) {
          return _this._setColumnCount();
        }
      }))();
      if (this.isOpen) {
        return this._setColumnCount();
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
      return this.uploadZone.cleanup();
    },
    render: function(template, context) {
      var done;

      if (context == null) {
        context = {};
      }
      done = this.async();
      return DataRetrieval.forUserGallery('Person').done(function(gallery) {
        context.PersonImages = gallery.images.Person;
        context.Person = app.CurrentMemberPerson.toJSON();
        context.Member = app.CurrentMember;
        _.each(context.PersonImages, function(img) {
          if (img.id === context.Person.Image.ID) {
            return context.CurrentImage = img;
          }
        });
        return done(template(context));
      });
    },
    initPersonImageList: function() {
      var _this = this;

      return _.each(app.Cache.UserGallery.images.Person, function(image) {
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
          var img;

          img = data[0];
          if (img.UploadedToClass) {
            app.updateGalleryCache(data);
            _this.insertPersonImage(img);
          }
          if (img.id) {
            return _this.uploadZone.$dropzone.html('<img src="' + img.url + '">');
          }
        }
      });
    },
    afterRender: function() {
      this._afterRender();
      this.initDropzone();
      return this.initPersonImageList();
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
      this.uploadZone.cleanup();
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
        return _this.uploadZone.$dropzone.addClass('dragover');
      });
    },
    render: function(template, context) {
      var done,
        _this = this;

      if (context == null) {
        context = {};
      }
      done = this.async();
      return DataRetrieval.forUserGallery('Projects').done(function(gallery) {
        context.Projects = gallery.images.Projects;
        return done(template(context));
      });
    },
    afterRender: function() {
      this._afterRender();
      this.initFilter();
      this.initDropzone();
      return this.initImageList();
    }
  });
  UserSidebar.Views.ImageItem = Backbone.View.extend({
    tagName: 'li',
    serialize: function() {
      return this.model;
    }
  });
  UserSidebar.Views.GalleryImage = UserSidebar.Views.ImageItem.extend({
    template: 'security/editor-sidebar-gallery-image',
    afterRender: function() {}
  });
  UserSidebar.Views.PersonImage = UserSidebar.Views.ImageItem.extend({
    template: 'security/editor-sidebar-person-image'
  });
  return UserSidebar;
});
