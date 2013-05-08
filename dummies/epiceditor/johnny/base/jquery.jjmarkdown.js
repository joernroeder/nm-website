// Generated by CoffeeScript 1.6.2
(function() {
  var $, JJMarkdownEditor;

  $ = jQuery;

  JJMarkdownEditor = (function() {
    JJMarkdownEditor.prototype.defaults = {
      preview: '#preview',
      convertingDelay: 200,
      hideDropzoneDelay: 1000,
      imageUrl: '/_md_/images/docimage',
      errorMsg: 'Sorry, but there has been an error.'
    };

    JJMarkdownEditor.prototype.$input = null;

    JJMarkdownEditor.prototype.$preview = null;

    JJMarkdownEditor.prototype.currentDrag = null;

    JJMarkdownEditor.prototype.dragCount = 0;

    JJMarkdownEditor.prototype.imageCache = [];

    JJMarkdownEditor.prototype.rules = {
      img: /\[img\s{1,}(.*?)\]/gim
    };

    function JJMarkdownEditor(selector, opts) {
      this.options = $.extend({}, this.defaults, opts);
      this.$input = $(selector);
      this.$preview = $(this.options.preview);
      this.initialize();
    }

    JJMarkdownEditor.prototype._cleanupEvents = function() {
      this.$input.off('keyup scroll');
      this.$preview.off('scroll dragover dragleave');
      return this.$dropzone.off('drop');
    };

    JJMarkdownEditor.prototype.initialize = function() {
      var $els, $input, $preview, scrollArea, _this;

      $input = this.$input;
      $input.tabby().trigger('keyup');
      $preview = this.$preview;
      _this = this;
      this.delayTimeout = null;
      $input.off('keyup').on('keyup', function(e) {
        var $this, delayTimeout;

        $this = $(this);
        if (delayTimeout) {
          clearTimeout(delayTimeout);
        }
        return delayTimeout = setTimeout(function() {
          return _this.parseMarkdown();
        }, _this.options.convertingDelay);
      });
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
      this.dragAndDropSetup();
      return this;
    };

    JJMarkdownEditor.prototype.parseMarkdown = function() {
      var cap, imgIds, imgReplacements, markdown, markdownImageDfd, tocheck,
        _this = this;

      tocheck = markdown = marked(this.$input.val());
      imgIds = [];
      imgReplacements = [];
      while (cap = this.rules.img.exec(tocheck)) {
        imgReplacements.push(cap);
        imgIds.push(parseInt(cap[1]));
      }
      console.log(imgReplacements);
      markdownImageDfd = this.requestImagesByIds(imgIds);
      markdownImageDfd.done(function() {
        var cache;

        cache = _this.imageCache;
        return $.each(imgReplacements, function(i, replace) {
          return (function(replace) {
            return $.each(cache, function(j, obj) {
              if (obj.id === parseInt(replace[1])) {
                return markdown = markdown.replace(replace[0], obj.tag);
              }
            });
          })(replace);
        });
      });
      return $.when(markdownImageDfd).then(function() {
        _this.$preview.html(markdown);
        return window.picturefill();
      });
    };

    JJMarkdownEditor.prototype.requestImagesByIds = function(ids) {
      var dfd, reqIds, url,
        _this = this;

      dfd = new $.Deferred();
      _this = this;
      reqIds = [];
      $.each(ids, function(i, id) {
        return (function(id) {
          var found;

          found = false;
          $.each(_this.imageCache, function(j, obj) {
            return found = true;
          });
          if (!found) {
            return reqIds.push(id);
          }
        })(id);
      });
      if (!reqIds.length) {
        dfd.resolve();
        return dfd;
      }
      url = this.options.imageUrl + '?ids=' + reqIds.join(',');
      return $.getJSON(url).done(function(data) {
        if ($.isArray(data)) {
          return _this.imageCache = _this.imageCache.concat(data);
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
            $dropzone: $('<div />', {
              "class": 'dropzone'
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
        $target = $(e.originalEvent.originalTarget);
        if (!$target.is($dropzone)) {
          isContainer = false;
          if ($target.is($preview)) {
            isContainer = true;
          } else {
            if ($target.is('a, strong, span')) {
              $temp = $target.closest('p');
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
          var $dropzone, $progressBar, $target, errorMsg, files, formData, hideDropzoneTimeout, req, _xhrProgress;

          $dropzone = _this.currentDrag.$dropzone;
          $target = _this.currentDrag.$target;
          hideDropzoneTimeout = _this.currentDrag.hideDropzoneTimeout;
          if (hideDropzoneTimeout) {
            clearTimeout(hideDropzoneTimeout);
          }
          $dropzone.off('drop');
          _this.currentDrag = null;
          if (e.dataTransfer.files.length) {
            errorMsg = null;
            $progressBar = $('<div />', {
              "class": 'progress-bar'
            }).appendTo($dropzone);
            $progressBar.append($('<div />'));
            _xhrProgress = function(e) {
              var completed;

              if (e.lengthComputable) {
                completed = (e.loaded / e.total) * 100;
                return $progressBar.find('div').css('width', completed + '%');
              }
            };
            files = e.dataTransfer.files;
            formData = new FormData();
            $.each(files, function(index, file) {
              if (!file.type.match('image.*')) {
                return errorMsg = 'Sorry, but ' + file.name + ' is no image, bitch!';
              } else {
                return formData.append(file.name, file);
              }
            });
            if (errorMsg) {
              console.log(errorMsg);
              req = new $.Deferred();
              req.reject({
                error: errorMsg
              });
            } else {
              req = $.ajax({
                url: _this.options.imageUrl,
                data: formData,
                processData: false,
                contentType: false,
                type: 'POST',
                xhr: function() {
                  var xhr;

                  xhr = new XMLHttpRequest();
                  xhr.upload.addEventListener('progress', _xhrProgress, false);
                  return xhr;
                }
              });
            }
            return req.pipe(function(res) {
              if (!res.error) {
                return res;
              } else {
                return $.Deferred().reject(res);
              }
            }).fail(function(res) {
              return $dropzone.append('<p>' + _this.options.errorMsg + '</p>');
            }).done(function(data) {
              var imgs, nl, obj, rawMd, _i, _len;

              data = $.parseJSON(data);
              imgs = [];
              rawMd = '';
              for (_i = 0, _len = data.length; _i < _len; _i++) {
                obj = data[_i];
                _this.imageCache.push(obj);
                rawMd += '[img ' + obj.id + ']';
              }
              $dropzone.remove();
              nl = '  \n\n';
              if ($target.is($preview)) {
                _this.$input.val(_this.$input.val() + rawMd + nl);
              } else {
                _this.insertAtEditorPos($target, rawMd + nl);
              }
              return _this.parseMarkdown();
            }).always(function() {
              return $progressBar.remove();
            });
          }
        });
      };
    };

    JJMarkdownEditor.prototype.insertAtEditorPos = function($el, md) {
      var pos, val;

      if (!$el.is('div')) {
        pos = $el.data('editor-pos');
        val = this.$input.val();
        val = [val.slice(0, pos), md, val.slice(pos)].join('');
        return this.$input.val(val);
      }
    };

    return JJMarkdownEditor;

  })();

  window.JJMarkdownEditor = JJMarkdownEditor;

}).call(this);
