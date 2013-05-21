// Generated by CoffeeScript 1.6.2
define(['app', 'modules/DataRetrieval', 'plugins/editor/jquery.jjdropzone'], function(app, DataRetrieval) {
  var UserSidebar;

  UserSidebar = app.module();
  UserSidebar.construct = function() {
    return new UserSidebar.Views.Main();
  };
  UserSidebar.Views.Main = Backbone.View.extend({
    el: $('#editor-sidebar'),
    template: 'security/editor-sidebar',
    availableSubViews: {
      'user': 'UserSidebar',
      'gallery': 'GallerySidebar'
    },
    subView: null,
    events: {
      'click [data-editor-sidebar-content]': 'toggleSidebarCheck'
    },
    serialize: function() {
      var json;

      json = {};
      if (app.currentLayoutName === 'editor') {
        json.isEditor = true;
      }
      return json;
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
      this.$el.removeClass('open');
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
    galleryData: {},
    initSidebar: _.once(function() {
      var _this = this;

      this.$sidebarHeader = $('> header', this.$el);
      this.$sidebarContent = $('section.editor-sidebar-content', this.$el);
      this.setSidebarHeight();
      return $.addOnWindowResize('editor.sidebar.height', function() {
        return _this.setSidebarHeight();
      });
    }),
    setSidebarHeight: function() {
      return this.$sidebarContent.css({
        'height': $(window).height() - this.$sidebarHeader.outerHeight()
      });
    },
    _afterRender: function() {
      return this.initSidebar();
    }
  });
  /**
  		 * @todo : cleanup function!
  		 *
  */

  UserSidebar.Views.UserSidebar = UserSidebar.Views.SidebarContainer.extend({
    tagName: 'div',
    template: 'security/editor-sidebar-user',
    onOpened: function(switched) {
      var delay,
        _this = this;

      delay = switched ? 0 : 300;
      return setTimeout(function() {
        return _this.$sidebarContent.addClass('test');
      }, delay);
    },
    onClose: function() {
      var _this = this;

      return setTimeout(function() {
        return _this.$sidebarContent.removeClass('test');
      }, 300);
    },
    afterRender: function() {
      var _this = this;

      (_.once(function() {
        return _this.$sidebarContent = $('.editor-sidebar-content', _this.$el);
      }))();
      return this._afterRender();
    }
  });
  UserSidebar.Views.GallerySidebar = UserSidebar.Views.SidebarContainer.extend({
    tagName: 'div',
    template: 'security/editor-sidebar-gallery',
    columnsPrefix: 'columns-',
    $sidebarContent: null,
    cleanup: function() {
      return this.uploadZone.cleanup();
    },
    getColumnsCount: function() {
      return this.$sidebarContent.data('columns');
    },
    setColumnCount: function() {
      var columnsCount, prefColumnsCount, width;

      if (!this.$sidebarContent) {
        return;
      }
      width = parseInt(this.$sidebarContent.width(), 10);
      prefColumnsCount = this.getColumnsCount();
      columnsCount = Math.floor(width / 75);
      if (columnsCount) {
        return this.$sidebarContent.removeClass(this.columnsPrefix + prefColumnsCount).addClass(this.columnsPrefix + columnsCount).data('columns', columnsCount);
      }
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

      return this.uploadZone = new JJSimpleImagesUploadZone('#uploadzone', {
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
    },
    onOpened: function(switched) {
      var delay,
        _this = this;

      delay = switched ? 0 : 300;
      return setTimeout(function() {
        return _this.setColumnCount();
      }, delay);
    },
    onClose: function() {
      var prefColumnsCount,
        _this = this;

      prefColumnsCount = this.getColumnsCount();
      return setTimeout(function() {
        return _this.$sidebarContent.removeClass(_this.columnsPrefix + prefColumnsCount);
      }, 300);
    },
    render: function(template, context) {
      var done,
        _this = this;

      if (context == null) {
        context = {};
      }
      done = this.async();
      return DataRetrieval.forUserGallery().done(function(gallery) {
        if (gallery.fetched) {
          context.Projects = gallery.images.Projects;
        }
        return done(template(context));
      });
    },
    afterRender: function() {
      var _this = this;

      this._afterRender();
      this.setColumnCount();
      this.initFilter();
      this.initDropzone();
      this.initImageList();
      return (_.once(function() {
        return _this.$sidebarContent = $('.editor-sidebar-content', _this.$el);
      }))();
    }
  });
  UserSidebar.Views.GalleryImage = Backbone.View.extend({
    tagName: 'li',
    template: 'security/editor-sidebar-gallery-image',
    serialize: function() {
      return this.model;
    }
  });
  return UserSidebar;
});
