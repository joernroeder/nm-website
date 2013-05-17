// Generated by CoffeeScript 1.6.2
"use strict";(function($) {
  var EditorSidebar, win;

  EditorSidebar = (function() {
    EditorSidebar.prototype.$editorSidebar = null;

    EditorSidebar.prototype.$sidebarHeader = null;

    EditorSidebar.prototype.$sidebarContent = null;

    EditorSidebar.prototype.$imageList = null;

    EditorSidebar.prototype.columnsPrefix = 'columns-';

    function EditorSidebar() {
      var _this = this;

      this.$editorSidebar = $('.editor-sidebar');
      this.$sidebarHeader = $('> header', this.$editorSidebar);
      this.$sidebarContent = $('section.editor-sidebar-content', this.$editorSidebar);
      this.setSidebarHeight();
      this.setColumnCount();
      $.addOnWindowResize('editor.sidebar.height', function() {
        return _this.onResizeSidebar();
      });
      this.initToggleBtn();
      this.initFilter();
      this.initImageList();
    }

    EditorSidebar.prototype.open = function() {
      var _this = this;

      this.$editorSidebar.addClass('open');
      return setTimeout(function() {
        _this.$editorSidebar.addClass('opened');
        return _this.setColumnCount();
      }, 300);
    };

    EditorSidebar.prototype.close = function() {
      var prefColumnsCount,
        _this = this;

      prefColumnsCount = this.getColumnsCount();
      this.$editorSidebar.removeClass('open opened');
      return setTimeout(function() {
        return _this.$editorSidebar.removeClass(_this.columnsPrefix + prefColumnsCount);
      }, 300);
    };

    EditorSidebar.prototype.toggle = function() {
      if (this.$editorSidebar.hasClass('open')) {
        return this.close();
      } else {
        return this.open();
      }
    };

    EditorSidebar.prototype.setSidebarHeight = function() {
      return this.$sidebarContent.css({
        'height': $(window).height() - this.$sidebarHeader.outerHeight()
      });
    };

    EditorSidebar.prototype.getColumnsCount = function() {
      return this.$editorSidebar.data('columns');
    };

    EditorSidebar.prototype.setColumnCount = function() {
      var columnsCount, prefColumnsCount, width;

      width = parseInt(this.$sidebarContent.width(), 10);
      prefColumnsCount = this.getColumnsCount();
      columnsCount = Math.floor(width / 75);
      if (columnsCount) {
        return this.$editorSidebar.removeClass(this.columnsPrefix + prefColumnsCount).addClass(this.columnsPrefix + columnsCount).data('columns', columnsCount);
      }
    };

    EditorSidebar.prototype.initToggleBtn = function() {
      var _this = this;

      return $('#toggle-editor-sidebar').on('click', function(el) {
        $(el).blur().toggleClass('active');
        _this.toggle();
        return false;
      });
    };

    EditorSidebar.prototype.initImageList = function() {
      this.$imageList = $('.image-list', this.$editorSidebar);
      if (this.$imageList.length) {
        $('a', this.$imageList).on('click', function() {
          $('.selected', this.$imageList).not(this).removeClass('selected');
          return $(this).blur().toggleClass('selected');
        });
        return false;
      }
    };

    EditorSidebar.prototype.initFilter = function() {
      var _this = this;

      this.$filter = $('select.filter', this.$editorSidebar);
      if (this.$filter.length) {
        return this.$filter.on('change', function(e) {
          var $filtered, val;

          val = $(e.target).val();
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
    };

    EditorSidebar.prototype.onResizeSidebar = function() {
      this.setSidebarHeight();
      return this.setColumnCount();
    };

    return EditorSidebar;

  })();
  win = window;
  return win.sidebar = new EditorSidebar();
})(jQuery);
