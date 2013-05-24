// Generated by CoffeeScript 1.6.2
"use strict";
/**
 *
 * JJMarkdownEditor 
 * v.0.0.1
 *
 * (2013)
 * 
 * A jQuery Markdown Editor with input & preview area, featuring several extra markdown syntax extensions like [img {id}] and [embed {url}]
 * Requirements: 
 * 	- jQuery
 * 	- Tabby jQuery plugin
 * 	- marked_jjedit.js
 * 	- jquery.jjfileupload.js
 *
*/

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function($) {
  var CustomMarkdownParser, JJMarkdownEditor, OEmbedMarkdownParser, SingleImgMarkdownParser, _ref, _ref1;

  JJMarkdownEditor = (function() {
    /**
    		 * 
    		 * Default options
    		 *
    */

    var setAsActiveDraggable;

    JJMarkdownEditor.prototype.defaults = {
      preview: '#preview',
      parsingDelay: 200,
      dragAndDropAllowed: true,
      hideDropzoneDelay: 1000,
      errorMsg: 'Sorry, but there has been an error.',
      contentGetter: 'val',
      customParsers: ['SingleImgMarkdownParser', 'OEmbedMarkdownParser'],
      customParserOptions: {},
      afterRender: null,
      onChange: null,
      onBlur: null,
      imageUrl: '/imagery/images/docimage'
    };

    JJMarkdownEditor.prototype.$input = null;

    JJMarkdownEditor.prototype.$preview = null;

    JJMarkdownEditor.prototype.currentDrag = null;

    JJMarkdownEditor.prototype.inlineElementDragged = null;

    JJMarkdownEditor.prototype.dragCount = 0;

    JJMarkdownEditor.prototype.fileDragPermitted = true;

    JJMarkdownEditor.prototype.pendingAjax = [];

    JJMarkdownEditor.prototype.customParsers = {};

    function JJMarkdownEditor(selector, opts) {
      this.options = $.extend({}, this.defaults, opts);
      this.$input = selector instanceof jQuery ? selector : $(selector);
      this.$input._val = this.$input[this.options.contentGetter];
      this.$preview = this.options.preview instanceof jQuery ? this.options.preview : $(this.options.preview);
      this.initialize();
    }

    /**
    		 *
    		 * Static functions that allow DOM Elements to be dragged into the Preview area of any JJMarkdown Editor
    		 *
    */


    setAsActiveDraggable = function(e) {
      var set;

      if (e.type === 'dragstart') {
        set = $(e.target).data('md-tag');
        if (!set) {
          set = $(e.target).parent().data('md-tag');
        }
        set = set.replace('\\[', '[').replace('\\]', ']');
      } else {
        set = null;
      }
      $.fireGlobalDragEvent(e.type, e.target);
      return JJMarkdownEditor._activeDraggable = set;
    };

    JJMarkdownEditor.setAsDraggable = function($els) {
      if (!JJMarkdownEditor.draggables) {
        JJMarkdownEditor.draggables = [];
      }
      $els = $els.filter('[data-md-tag]');
      if ($els.length) {
        JJMarkdownEditor.draggables.push($els);
        return $els.on('dragstart dragend', setAsActiveDraggable);
      }
    };

    JJMarkdownEditor.cleanupDraggables = function() {
      if (JJMarkdownEditor.draggables) {
        return $.each(JJMarkdownEditor.draggables, function(i, $els) {
          return $els.off('dragstart dragend');
        });
      }
    };

    JJMarkdownEditor.prototype.cleanup = function() {
      this.$input.remove();
      this.$preview.remove();
      return this.$dropzone.remove();
    };

    JJMarkdownEditor.prototype.initialize = function() {
      var $els, $input, $preview, func, scrollArea,
        _this = this;

      $.each(this.options.customParsers, function(i, parser) {
        var opts, p;

        p = window[parser];
        if (p) {
          opts = _this.options.customParserOptions[parser];
          return _this.customParsers[parser] = new p(opts);
        }
      });
      $input = this.$input;
      $preview = this.$preview;
      _this = this;
      $input.tabby().trigger('keyup');
      this.delayTimeout = null;
      $input.off('keyup').on('keyup', function(e) {
        var $this, delayTimeout;

        $this = $(this);
        if (delayTimeout) {
          clearTimeout(delayTimeout);
        }
        return delayTimeout = setTimeout(function() {
          return _this.parseMarkdown();
        }, _this.options.parsingDelay);
      });
      if (func = this.options.onBlur) {
        $input.on('blur', func);
      }
      $els = $input.add($preview);
      scrollArea = null;
      $els.on('scroll', function(e) {
        var $partner, $this;

        $this = $(this);
        $partner = $this.is($input) ? $preview : $input;
        if (scrollArea && scrollArea.is($partner)) {
          return false;
        }
        scrollArea = $this;
        $partner[0].scrollTop = this.scrollTop * $partner[0].scrollHeight / this.scrollHeight;
        return setTimeout(function() {
          return scrollArea = null;
        }, 200);
      });
      _this.parseMarkdown();
      if (this.options.dragAndDropAllowed) {
        this.dragAndDropSetup();
      }
      return this;
    };

    JJMarkdownEditor.prototype.parseMarkdown = function() {
      var markdown, raw, seeds,
        _this = this;

      $.each(this.pendingAjax, function(i, pending) {
        if (pending.readyState !== 4 && pending.abort) {
          return pending.abort();
        }
      });
      raw = this.$input._val();
      markdown = marked(raw);
      seeds = [];
      $.each(this.customParsers, function(i, parser) {
        var seed;

        seed = parser.requestData(raw);
        seeds.push(seed);
        if (!parser.noAjax) {
          return _this.pendingAjax.push(seed);
        }
      });
      return $.when.apply($, seeds).then(function() {
        var data;

        _this.pendingAjax = [];
        $.each(_this.customParsers, function(i, parser) {
          return markdown = parser.parseMarkdown(markdown);
        });
        _this.$preview.trigger('markdown:replaced');
        _this.$preview.html(markdown);
        _this.inlineDragAndDropSetup();
        if (_this.options.afterRender) {
          _this.options.afterRender();
        }
        data = {
          raw: raw
        };
        if (_this.customParsers.SingleImgMarkdownParser) {
          data.images = _this.customParsers.SingleImgMarkdownParser.returnIds();
        }
        if (_this.options.onChange) {
          return _this.options.onChange(data);
        }
      });
    };

    JJMarkdownEditor.prototype.dragAndDropSetup = function() {
      var $preview, dropzoneDelay, _bindDropHandler, _setHideDropzoneTimeout,
        _this = this;

      $preview = this.$preview;
      dropzoneDelay = this.options.hideDropzoneDelay;
      $preview.on('dragover', function(e) {
        var $dropzone, $target, $temp, currDrag, func, isContainer;

        if (!_this.currentDrag) {
          _this.currentDrag = {
            $dropzone: $('<div>', {
              'class': 'dropzone'
            })
          };
          _this.dragCount++;
          $preview.data('dragid', _this.dragCount);
          _this.currentDrag.$dropzone.data('dragid', _this.dragCount);
        }
        _bindDropHandler();
        currDrag = _this.currentDrag;
        $dropzone = currDrag.$dropzone;
        if (currDrag.hideDropzoneTimeout) {
          clearTimeout(_this.currentDrag.hideDropzoneTimeout);
        }
        $target = $(e.target);
        if (!$target.is($dropzone)) {
          isContainer = false;
          if ($target.is($preview)) {
            isContainer = true;
          } else {
            if (!$target.attr('data-editor-pos')) {
              $temp = $target.closest('[data-editor-pos]');
              if ($temp.length) {
                $target = $temp;
              } else {
                $target = $preview;
                isContainer = true;
              }
            }
          }
          func = isContainer ? 'appendTo' : 'insertBefore';
          currDrag.$target = $target;
          return $dropzone[func].call($dropzone, $target);
        }
      });
      $preview.on('drop', function(e) {
        var $target;

        $target = $(e.originalEvent.originalTarget);
        if (_this.currentDrag && !$target.is(_this.currentDrag.$dropzone)) {
          _setHideDropzoneTimeout();
          return false;
        }
      });
      _setHideDropzoneTimeout = function() {
        if (!_this.currentDrag) {
          return;
        }
        clearTimeout(_this.currentDrag.hideDropzoneTimeout);
        return _this.currentDrag.hideDropzoneTimeout = setTimeout(function() {
          return _this.currentDrag.$dropzone.hide().detach().show();
        }, dropzoneDelay);
      };
      $preview.on('dragleave', _setHideDropzoneTimeout);
      return _bindDropHandler = function() {
        if (_this.currentDrag.dropHandlerBound) {
          return false;
        }
        _this.currentDrag.dropHandlerBound = true;
        return _this.currentDrag.$dropzone.on('drop', function(e) {
          var $dropzone, $target, dfdParse, el, hideDropzoneTimeout, md, uploadDfd;

          $dropzone = _this.currentDrag.$dropzone;
          $target = _this.currentDrag.$target;
          hideDropzoneTimeout = _this.currentDrag.hideDropzoneTimeout;
          if (hideDropzoneTimeout) {
            clearTimeout(hideDropzoneTimeout);
          }
          $dropzone.off('drop');
          _this.currentDrag = null;
          dfdParse = new $.Deferred();
          dfdParse.done(function() {
            $dropzone.remove();
            return _this.parseMarkdown();
          });
          if (el = _this.inlineElementDragged) {
            _this.moveInlineElement($(el), $target);
            _this.inlineElementDragged = null;
            return dfdParse.resolve();
          } else if (md = JJMarkdownEditor._activeDraggable) {
            _this.insertAtEditorPosByEl($target, md);
            JJMarkdownEditor._activeDraggable = null;
            return dfdParse.resolve();
          } else if (e.dataTransfer.files.length) {
            uploadDfd = JJFileUpload["do"](e, $dropzone, _this.options.imageUrl, null, _this.options.errorMsg, 'image.*');
            return uploadDfd.done(function(data) {
              var imgParser, nl, obj, rawMd, _i, _len;

              data = $.parseJSON(data);
              if (imgParser = _this.customParsers.SingleImgMarkdownParser) {
                imgParser.updateCache(data);
              }
              rawMd = '';
              for (_i = 0, _len = data.length; _i < _len; _i++) {
                obj = data[_i];
                rawMd += '[img ' + obj.id + ']';
              }
              nl = '  \n\n';
              _this.insertAtEditorPosByEl($target, rawMd + nl);
              return dfdParse.resolve();
            });
          } else {
            return $dropzone.remove();
          }
        });
      };
    };

    JJMarkdownEditor.prototype.inlineDragAndDropSetup = function() {
      var $imgs, $preview,
        _this = this;

      $preview = this.$preview;
      $imgs = $preview.find('[data-md-tag]');
      _this = this;
      $imgs.on('dragstart', function(e) {
        return _this.inlineElementDragged = this;
      });
      $imgs.on('dragend', function(e) {
        return _this.inlineElementDragged = null;
      });
      return $preview.on('markdown:replace', function() {
        return $imgs.off('dragstart dragend');
      });
    };

    JJMarkdownEditor.prototype.moveInlineElement = function($el, $target) {
      var mdTag, pos;

      mdTag = $el.data('md-tag').replace(/\\/g, '');
      pos = $el.data('editor-pos');
      if (!($target.is(this.$preview)) && ($target.data('editor-pos') < pos)) {
        pos += mdTag.length;
      }
      this.insertAtEditorPosByEl($target, mdTag);
      return this.removeAtEditorPos(pos, mdTag);
    };

    JJMarkdownEditor.prototype.removeAtEditorPos = function(pos, md) {
      var val;

      val = this.$input._val();
      val = [val.slice(0, pos), val.slice(pos + md.length)].join('');
      return this.$input._val(val);
    };

    JJMarkdownEditor.prototype.insertAtEditorPosByEl = function($el, md) {
      var pos, val;

      val = this.$input._val();
      if ($el.is(this.$preview)) {
        val = val + md;
      } else {
        pos = $el.data('editor-pos');
        val = [val.slice(0, pos), md, val.slice(pos)].join('');
      }
      return this.$input._val(val);
    };

    return JJMarkdownEditor;

  })();
  CustomMarkdownParser = (function() {
    CustomMarkdownParser.prototype.rule = null;

    CustomMarkdownParser.prototype.url = '';

    CustomMarkdownParser.prototype.defaultCache = [];

    CustomMarkdownParser.prototype.usedIds = [];

    CustomMarkdownParser.prototype._tempReplacements = null;

    CustomMarkdownParser.prototype._raw = null;

    function CustomMarkdownParser(opts) {
      var a, b;

      if (opts) {
        for (a in opts) {
          b = opts[a];
          this[a] = b;
        }
      }
    }

    CustomMarkdownParser.prototype.updateCache = function(data) {
      return this.defaultCache = this.defaultCache.concat(data);
    };

    CustomMarkdownParser.prototype.fromCache = function(id) {
      var found;

      found = null;
      $.each(this.defaultCache, function(j, obj) {
        if (obj.id === id) {
          found = obj;
        }
      });
      return found;
    };

    CustomMarkdownParser.prototype.requestData = function(raw) {
      var cap, dfd, found, founds, replacements, reqIds, url,
        _this = this;

      this._raw = raw;
      replacements = [];
      founds = [];
      while (cap = this.rule.exec(raw)) {
        replacements.push(cap);
        found = this.parseFound(cap[1]);
        if ($.inArray(found, founds) < 0) {
          founds.push(found);
        }
      }
      this._tempReplacements = replacements;
      dfd = new $.Deferred();
      _this = this;
      reqIds = [];
      $.each(founds, function(i, id) {
        found = _this.fromCache(id);
        if (!found) {
          return reqIds.push(id);
        }
      });
      if (!reqIds.length) {
        dfd.resolve();
        return dfd;
      }
      url = this.url + '?ids=' + reqIds.join(',');
      return $.getJSON(url).done(function(data) {
        if ($.isArray(data)) {
          return _this.updateCache(data);
        }
      });
    };

    CustomMarkdownParser.prototype.parseMarkdown = function(md) {
      var patternsUsed, raw, usedIds,
        _this = this;

      patternsUsed = [];
      raw = this._raw;
      usedIds = [];
      $.each(this._tempReplacements, function(i, replace) {
        var obj, pattern, tag;

        obj = _this.fromCache(_this.parseFound(replace[1]));
        if (obj) {
          usedIds.push(obj.id);
          pattern = replace[0].replace('[', '\\[').replace(']', '\\]');
          tag = _this.insertDataIntoRawTag(obj.tag, 'editor-pos', replace['index']);
          tag = _this.insertDataIntoRawTag(tag, 'md-tag', pattern);
          return md = md.replace(replace[0], tag);
        }
      });
      this._raw = null;
      this._tempReplacements = null;
      this.usedIds = $.unique(usedIds);
      return md;
    };

    CustomMarkdownParser.prototype.parseFound = function(data) {
      return data;
    };

    CustomMarkdownParser.prototype.insertDataIntoRawTag = function(rawTag, dataName, dataVal) {
      var ltp;

      ltp = rawTag.indexOf('>');
      return [rawTag.slice(0, ltp), ' data-' + dataName + '="' + dataVal + '"', rawTag.slice(ltp)].join('');
    };

    CustomMarkdownParser.prototype.returnIds = function() {
      var out;

      out = {
        ids: this.usedIds
      };
      if (this.className) {
        out.className = this.className;
      }
      return out;
    };

    return CustomMarkdownParser;

  })();
  SingleImgMarkdownParser = (function(_super) {
    __extends(SingleImgMarkdownParser, _super);

    function SingleImgMarkdownParser() {
      _ref = SingleImgMarkdownParser.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    SingleImgMarkdownParser.prototype.className = 'DocImage';

    SingleImgMarkdownParser.prototype.rule = /\[img\s{1,}(.*?)\]/gi;

    SingleImgMarkdownParser.prototype.url = '/imagery/images/docimage';

    SingleImgMarkdownParser.prototype.parseFound = function(data) {
      return parseInt(data);
    };

    return SingleImgMarkdownParser;

  })(CustomMarkdownParser);
  OEmbedMarkdownParser = (function(_super) {
    __extends(OEmbedMarkdownParser, _super);

    function OEmbedMarkdownParser() {
      _ref1 = OEmbedMarkdownParser.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    OEmbedMarkdownParser.prototype.rule = /\[embed\s{1,}(.*?)\]/gi;

    OEmbedMarkdownParser.prototype.url = '/_md_/oembed';

    return OEmbedMarkdownParser;

  })(CustomMarkdownParser);
  window.JJMarkdownEditor = JJMarkdownEditor;
  window.SingleImgMarkdownParser = SingleImgMarkdownParser;
  return window.OEmbedMarkdownParser = OEmbedMarkdownParser;
})(jQuery);
