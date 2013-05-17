// Generated by CoffeeScript 1.6.2
define(['app'], function(app) {
  var UserSidebar;

  UserSidebar = app.module();
  UserSidebar.construct = function() {
    return new UserSidebar.Views.Main();
  };
  UserSidebar.Views.Main = Backbone.View.extend({
    el: $('#editor-sidebar'),
    template: 'security/editor-sidebar',
    currentContainerContent: null,
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
      var toShow;

      toShow = $(e.target).data('editor-sidebar-content');
      console.log(this);
      if (this.currentContainer === toShow) {
        this.toggle();
      } else {
        this.setSubview(toShow, true);
        this.open();
      }
      return false;
    },
    setSubview: function(toShow, doRender) {
      var view;

      view = toShow === 'user' ? new UserSidebar.Views.UserSidebar() : new UserSidebar.Views.GallerySidebar();
      this.setView('#editor-sidebar-container', view);
      if (doRender) {
        return view.render();
      }
    },
    open: function() {
      var _this = this;

      this.$el.addClass('open');
      return setTimeout(function() {
        return _this.$el.addClass('opened');
      }, 300);
    },
    close: function() {
      return this.$el.removeClass('open opened');
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
    afterRender: function() {
      return this._afterRender();
    }
  });
  UserSidebar.Views.GallerySidebar = UserSidebar.Views.SidebarContainer.extend({
    tagName: 'div',
    beforeRender: function() {
      return DataRetrieval.forUserGallery().done(function(items) {
        console.log('user gallery fetched. Items:');
        return console.log(items);
      });
    }
  });
  return UserSidebar;
});
