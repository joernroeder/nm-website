// Generated by CoffeeScript 1.6.2
"use strict";
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function($) {
  var JJSimpleImagesUploadZone, JJSingleImageUploadZone, JJUploadZone;

  JJUploadZone = (function() {
    JJUploadZone.prototype.fileMatch = 'image.*';

    JJUploadZone.prototype.defaults = {
      url: null,
      errorMsg: 'Sorry, but there has been an error.',
      additionalData: null,
      responseHandler: function(data) {
        console.log('UPLOAD DATA');
        return console.log(data);
      }
    };

    JJUploadZone.prototype.$dropzone = null;

    JJUploadZone.prototype.maxAllowed = null;

    function JJUploadZone(selector, opts) {
      this.options = $.extend({}, this.defaults, opts);
      this.$dropzone = selector instanceof jQuery ? selector : $(selector);
    }

    JJUploadZone.prototype.cleanup = function() {
      return this.$dropzone.off('dragenter dragleave drop');
    };

    JJUploadZone.prototype.deferredUpload = function(e) {
      var uploadDfd,
        _this = this;

      uploadDfd = JJFileUpload["do"](e, this.$dropzone, this.options.url, this.options.additionalData, this.options.errorMsg, this.fileMatch, this.maxAllowed);
      return uploadDfd.done(function(data) {
        data = $.parseJSON(data);
        return _this.options.responseHandler(data);
      });
    };

    return JJUploadZone;

  })();
  JJSimpleImagesUploadZone = (function(_super) {
    __extends(JJSimpleImagesUploadZone, _super);

    function JJSimpleImagesUploadZone(selector, opts) {
      JJSimpleImagesUploadZone.__super__.constructor.call(this, arguments);
      this.dragAndDropSetup();
    }

    JJSimpleImagesUploadZone.prototype.dragAndDropSetup = function() {
      var $dropzone,
        _this = this;

      $dropzone = this.$dropzone;
      $dropzone.on('dragenter', function(e) {
        return $(this).addClass('dragactive');
      });
      $dropzone.on('dragleave drop', function(e) {
        return $(this).removeClass('dragactive');
      });
      return $dropzone.on('drop', function(e) {
        return _this.deferredUpload(e);
      });
    };

    return JJSimpleImagesUploadZone;

  })(JJUploadZone);
  JJSingleImageUploadZone = (function(_super) {
    __extends(JJSingleImageUploadZone, _super);

    function JJSingleImageUploadZone(selector, opts) {
      JJSingleImageUploadZone.__super__.constructor.call(this, selector, opts);
      this.dragAndDropSetup();
    }

    JJSingleImageUploadZone.prototype.setAsActiveDraggable = function(e) {
      if (e.type === 'dragstart') {
        return this._activeDraggableId = $(e.target).data('id');
      } else {
        return this._activeDraggableId = null;
      }
    };

    JJSingleImageUploadZone.prototype.setAsDraggable = function($el) {
      var _this = this;

      if (!this.draggables) {
        this.draggables = [];
      }
      if ($el.length) {
        this.draggables.push($el);
        return $el.on('dragstart dragend', function(e) {
          return _this.setAsActiveDraggable(e);
        });
      }
    };

    JJSingleImageUploadZone.prototype.cleanup = function() {
      var $draggable, _i, _len, _ref, _results;

      JJSingleImageUploadZone.__super__.cleanup.call(this);
      if (this.draggables) {
        _ref = this.draggables;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          $draggable = _ref[_i];
          _results.push($draggable.off('dragstart dragend'));
        }
        return _results;
      }
    };

    JJSingleImageUploadZone.prototype.dragAndDropSetup = function() {
      var $dropzone,
        _this = this;

      $dropzone = this.$dropzone;
      $dropzone.on('dragenter', function(e) {
        return $(this).addClass('dragactive');
      });
      $dropzone.on('dragleave drop', function(e) {
        return $(this).removeClass('dragactive');
      });
      return $dropzone.on('drop', function(e) {
        var data, id;

        if (id = _this._activeDraggableId) {
          _this._activeDraggableId = null;
          data = _this.options.getFromCache(id);
          return _this.options.responseHandler(data);
        } else if (e.dataTransfer.files.length) {
          return _this.deferredUpload(e);
        }
      });
    };

    return JJSingleImageUploadZone;

  })(JJUploadZone);
  window.JJSimpleImagesUploadZone = JJSimpleImagesUploadZone;
  return window.JJSingleImageUploadZone = JJSingleImageUploadZone;
})(jQuery);