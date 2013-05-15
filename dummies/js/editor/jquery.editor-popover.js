// Generated by CoffeeScript 1.6.2
"use strict";
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function($) {
  var DateEditable, InlineEditable, JJEditable, JJEditor, JJPopoverEditable, MarkdownEditable, SplitMarkdownEditable, editor, _ref, _ref1, _ref2, _ref3;

  JJEditor = (function() {
    var addComponent, addContentType, createComponent, events, getComponentByContentType, init, _components, _contentTypes, _storage;

    _contentTypes = {};

    _components = {};

    _storage = {};

    events = {};

    JJEditor.prototype.debug = true;

    JJEditor.prototype.attr = {
      _namespace: 'editor-',
      type: 'type',
      name: 'name',
      scope: 'scope',
      placeholder: 'placeholder',
      options: 'options'
    };

    function JJEditor(components) {
      var _this = this;

      if (this.debug) {
        console.group('EDITOR: add Components');
      }
      $.map(components, function(component) {
        if (_this.debug) {
          console.log('- ' + component);
        }
        return addComponent(component);
      });
      if (this.debug) {
        console.groupEnd();
      }
      init.call(this);
    }

    JJEditor.prototype.getAttr = function(name) {
      if (this.attr[name]) {
        return this.attr._namespace + this.attr[name];
      } else {
        return false;
      }
    };

    /*
    		 # on, off, trigger via $.Callbacks() 
    		 #
    		 # @link http://stackoverflow.com/questions/9099555/jquery-bind-events-on-plain-javascript-objects
    */


    JJEditor.prototype.on = function(name, callback) {
      if (!events[name]) {
        events[name] = $.Callbacks();
      }
      return events[name].add(callback);
    };

    JJEditor.prototype.off = function(name, callback) {
      if (!events[name]) {
        return;
      }
      return events[name].remove(callback);
    };

    JJEditor.prototype.trigger = function(name, eventData) {
      if (this.debug && name.indexOf(':' !== -1)) {
        console.group('EDITOR: trigger ' + name);
        console.log(eventData);
        console.groupEnd();
      }
      if (events[name]) {
        return events[name].fire(eventData);
      }
    };

    JJEditor.prototype.triggerScope = function(type, scope, eventData) {
      return '';
    };

    JJEditor.prototype.extractScope = function(o) {
      var k, key, oo, part, parts, t;

      oo = {};
      t = void 0;
      parts = void 0;
      part = void 0;
      for (k in o) {
        t = oo;
        parts = k.split(".");
        key = parts.pop();
        while (parts.length) {
          part = parts.shift();
          t = t[part] = t[part] || {};
        }
        t[key] = o[k];
      }
      return oo;
    };

    JJEditor.prototype.getState = function() {
      return this._storage;
    };

    /*
    		 # @private
    */


    init = function() {
      var _this = this;

      this.on('change:\\', function(e) {
        var obj;

        if (_this.debug) {
          console.group('EDITOR BINDINGS:');
        }
        obj = {};
        obj[e.fullName] = e.value;
        _this._storage = $.extend(_this._storage, _this.extractScope(obj));
        if (_this.debug) {
          console.log(_this._storage);
        }
        if (_this.debug) {
          return console.groupEnd();
        }
      });
      return $('[data-' + this.getAttr('type') + ']').each(function(i, el) {
        var $el, component, contentType;

        $el = $(el);
        contentType = $el.data(_this.getAttr('type'));
        if (-1 !== $.inArray(contentType, Object.keys(_contentTypes))) {
          component = getComponentByContentType.call(_this, contentType);
          $el.data('editor-component-id', component.id);
          return component.init($el);
        }
      });
    };

    /*
    		 # registers a new component
    		 #
    		 # @private
    		 # @param [string] name
    */


    addComponent = function(name) {
      var component,
        _this = this;

      if (!window.editorComponents[name]) {
        throw new ReferenceError("The Component '" + name + "' doesn't exists. Maybe you forgot to add it to the global 'window.editorComponents' namespace?");
      }
      component = new window.editorComponents[name](this);
      return $.map(component.contentTypes, function(type) {
        return addContentType(type, name);
      });
    };

    /*
    		 # @private
    */


    getComponentByContentType = function(type) {
      var componentName, lowerType;

      lowerType = type.toLowerCase();
      componentName = _contentTypes[lowerType];
      if (componentName) {
        return createComponent.call(this, componentName);
      } else {
        return null;
      }
    };

    /*
    		 # @private
    */


    createComponent = function(name) {
      var component;

      if (window.editorComponents[name]) {
        component = new window.editorComponents[name](this);
        _components[component.id] = component;
        return component;
      } else {
        return null;
      }
    };

    JJEditor.prototype.getComponent = function(id) {
      if (_components[id]) {
        return _components[id];
      } else {
        return null;
      }
    };

    JJEditor.prototype.getComponents = function() {
      return _components;
    };

    /*
    		 #
    		 # @private
    		 #
    		 # @param [string] content type
    		 # @param [string] component name
    */


    addContentType = function(type, componentName) {
      var lowerType;

      lowerType = type.toLowerCase();
      if (_contentTypes[lowerType]) {
        throw new Error('Another Component (' + _contentTypes[lowerType] + ') is already handling the content-type "' + type + '"');
      } else {
        return _contentTypes[lowerType] = componentName;
      }
    };

    JJEditor.prototype.save = function() {
      console.log('save state!!');
      return this.trigger('saved');
    };

    return JJEditor;

  })();
  /*
  	 # Abstract Editable Class
  	 # 
  	 # @param [Editor] editor
  */

  JJEditable = (function() {
    var getEventName;

    JJEditable.prototype._prevValue = '';

    JJEditable.prototype._value = '';

    JJEditable.prototype._options = {};

    JJEditable.prototype._dataName = '';

    JJEditable.prototype._dataFullName = '';

    JJEditable.prototype.contentTypes = [];

    function JJEditable(editor) {
      this.editor = editor;
      this.name = this.constructor.name.toLowerCase();
      this.id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r, v;

        r = Math.random() * 16 | 0;
        v = (c === "x" ? r : r & 0x3 | 0x8);
        return v.toString(16);
      });
      if (this.constructor.name === 'Editable') {
        throw new ReferenceError('"Editable" is an abstract class. Please use one of the subclasses instead.');
      }
    }

    JJEditable.prototype.init = function(element) {
      this.element = element;
      this.setDataName(element.data(this.editor.getAttr('name')));
      return this.setOptions(element.data(this.editor.getAttr('options')));
    };

    /*
    		 # returns a namespaced event name
    		 # 
    		 # @param [string] event name
    		 # @return string
    */


    getEventName = function(name) {
      return name = -1 !== name.indexOf('.') ? name : this.name + '.' + name;
    };

    JJEditable.prototype.trigger = function(name, eventData) {
      if (eventData == null) {
        eventData = {};
      }
      eventData['senderId'] = this.id;
      name = getEventName(name);
      return this.editor.trigger(name, eventData);
    };

    JJEditable.prototype.triggerScopeEvent = function(type, eventData) {
      var currScope, i, prefix, scope, scopeName, scopeNames, _results;

      if (eventData == null) {
        eventData = {};
      }
      scope = this.getDataScope();
      scope;
      $.extend(eventData, {
        name: this.getDataName(),
        scope: scope,
        fullName: this.getDataFullName(),
        senderId: this.id
      });
      scopeNames = scope.split('.');
      scopeNames.unshift('\\');
      _results = [];
      for (i in scopeNames) {
        scopeName = scopeNames[i];
        prefix = scopeNames.slice(0, i).join('.');
        if (prefix) {
          prefix += '.';
        }
        currScope = prefix + scopeName;
        currScope = currScope.replace('\\.', '');
        _results.push(this.editor.trigger(type + ':' + currScope, eventData));
      }
      return _results;
    };

    JJEditable.prototype.triggerDataEvent = function(type, eventData) {
      if (eventData == null) {
        eventData = {};
      }
      eventData['senderId'] = this.id;
      return this.editor.trigger(type + ':' + this.getDataFullName(), eventData);
    };

    JJEditable.prototype.on = function(name, callback) {
      name = getEventName(name);
      return this.editor.on(name, callback);
    };

    JJEditable.prototype.off = function(name, callback) {
      name = getEventName(name);
      return this.editor.off(name, callback);
    };

    JJEditable.prototype.setValue = function(value) {
      if (this._prevValue === value) {
        return;
      }
      this._prevValue = this._value;
      this._value = value;
      this.triggerScopeEvent('change', {
        value: this._value,
        prevValue: this._prevValue
      });
      this.triggerDataEvent('change', {
        value: this._value,
        prevValue: this._prevValue
      });
      if (typeof value === 'string') {
        return this.render();
      }
    };

    JJEditable.prototype.getValue = function() {
      return this._value;
    };

    JJEditable.prototype.updateValue = function() {
      return this.setValue(this.getValueFromContent());
    };

    JJEditable.prototype.getValueFromContent = function() {
      return '';
    };

    JJEditable.prototype.getPlaceholder = function() {
      var placeholder;

      placeholder = this.element.attr(this.editor.getAttr('placeholder'));
      if (placeholder) {
        return placeholder;
      } else {
        return 'foo';
      }
    };

    JJEditable.prototype.getValueOrPlaceholder = function() {
      var value;

      value = this.getValue();
      console.log('value or placeholder: ' + value);
      if (value) {
        return value;
      } else {
        return this.getPlaceholder();
      }
    };

    JJEditable.prototype.setDataName = function(dataName) {
      var getElementScope, getName, getNamespace, name, scope,
        _this = this;

      getName = function(dataName) {
        return dataName.split('.').slice(-1)[0];
      };
      getNamespace = function(dataName) {
        var prefix;

        prefix = '.';
        if (dataName[0] === '\\') {
          prefix = '';
          dataName = dataName.slice(1);
        }
        if (dataName.lastIndexOf('.') !== -1) {
          return prefix + dataName.slice(0, dataName.lastIndexOf('.'));
        } else {
          return '';
        }
      };
      getElementScope = function() {
        var cleanUpScopeName, crawlDom, scopeDataName;

        scopeDataName = _this.editor.getAttr('scope');
        cleanUpScopeName = function(name) {
          if (name[0] === '\\') {
            return name.slice(1);
          } else {
            return name;
          }
        };
        crawlDom = function($el, currentScope) {
          var $scopeEl, scopeName;

          $scopeEl = $el.closest("[data-" + scopeDataName + "]");
          if ($scopeEl.length) {
            scopeName = $scopeEl.data(scopeDataName);
            currentScope = scopeName + currentScope;
            if (scopeName[0] !== '\\') {
              return currentScope = crawlDom($scopeEl.parent(), '.' + currentScope);
            } else {
              return cleanUpScopeName(currentScope);
            }
          } else if (currentScope[0] === '\\') {
            return cleanUpScopeName(currentScope);
          } else {
            throw new Error("Couldn't find a complete scope for " + (getName(dataName)) + ". Maybe you forgot to add a Backslash at the beginning of your stack? \Foo.Bar.FooBar");
          }
        };
        return crawlDom(_this.element, getNamespace(dataName));
      };
      if (!dataName) {
        throw new Error('Please add a data-' + this.editor.getAttr('name') + ' attribute');
      }
      if (dataName[0] === '\\') {
        scope = getNamespace(dataName);
      } else {
        scope = getElementScope();
      }
      name = getName(dataName);
      this._dataScope = scope;
      return this._dataName = name;
    };

    JJEditable.prototype.setOptions = function(_options) {
      this._options = _options;
    };

    JJEditable.prototype.getDataScope = function() {
      return this._dataScope;
    };

    JJEditable.prototype.getDataFullName = function() {
      return "" + this._dataScope + "." + this._dataName;
    };

    JJEditable.prototype.getDataName = function() {
      return this._dataName;
    };

    JJEditable.prototype.getOptions = function() {
      return this._options;
    };

    JJEditable.prototype.render = function() {
      if (this.element) {
        return this.element.html(this.getValueOrPlaceholder());
      }
    };

    return JJEditable;

  })();
  /*
  	 # Abstract Popover Class
  */

  JJPopoverEditable = (function(_super) {
    __extends(JJPopoverEditable, _super);

    JJPopoverEditable.prototype._popoverContent = '';

    function JJPopoverEditable(editor) {
      this.editor = editor;
      if (this.constructor.name === 'PopoverEditable') {
        throw new ReferenceError('"PopoverEditable" is an abstract class. Please use one of the subclasses instead.');
      }
      JJPopoverEditable.__super__.constructor.call(this, editor);
    }

    JJPopoverEditable.prototype.init = function(element) {
      var _this = this;

      JJPopoverEditable.__super__.init.call(this, element);
      element.qtip({
        content: {
          text: function() {
            return _this.getPopoverContent();
          },
          title: ''
        },
        position: {
          at: 'right center',
          my: 'left center',
          adjust: {
            x: 10,
            resize: true,
            method: 'flip shift'
          }
        },
        show: {
          event: false
        },
        hide: {
          event: false,
          fixed: true
        },
        style: {
          classes: 'editor-popover',
          tip: {
            width: 20,
            height: 10
          }
        }
      });
      this.api = element.qtip('api');
      this.on('editor.closepopovers', function(eventData) {
        if (eventData.sender !== _this.id) {
          return _this.close();
        }
      });
      return element.on('click', function() {
        return _this.toggle();
      });
    };

    JJPopoverEditable.prototype.open = function() {
      this.trigger('editor.closepopovers');
      return this.api.show();
    };

    JJPopoverEditable.prototype.close = function() {
      return this.api.hide();
    };

    JJPopoverEditable.prototype.toggle = function() {
      if (this.api.tooltip && $(this.api.tooltip).hasClass('qtip-focus')) {
        return this.close();
      } else {
        return this.open();
      }
    };

    JJPopoverEditable.prototype.getPopoverContent = function() {
      var types;

      types = this.contentTypes.join(', ');
      if (this._popoverContent) {
        return this._popoverContent;
      } else {
        return "<h1>" + types + " Editor</h1>";
      }
    };

    /*
    		 # @todo: update current popover content
    */


    JJPopoverEditable.prototype.setPopoverContent = function(value) {
      return this._popoverContent = value;
    };

    return JJPopoverEditable;

  })(JJEditable);
  /*
  	 #
  */

  InlineEditable = (function(_super) {
    __extends(InlineEditable, _super);

    function InlineEditable() {
      _ref = InlineEditable.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    InlineEditable.prototype.contentTypes = ['inline'];

    InlineEditable.prototype.init = function(element) {
      var _this = this;

      InlineEditable.__super__.init.call(this, element);
      return element.attr('contenteditable', true).on('keyup', function(e) {
        return _this.updateValue();
      }).on('click focus', function() {
        return _this.trigger('editor.closepopovers');
      });
    };

    InlineEditable.prototype.getValueFromContent = function() {
      return this.element.text();
    };

    return InlineEditable;

  })(JJEditable);
  /*
  	 # Date Component
  */

  DateEditable = (function(_super) {
    __extends(DateEditable, _super);

    function DateEditable() {
      _ref1 = DateEditable.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    DateEditable.prototype.contentTypes = ['date'];

    DateEditable.prototype.format = 'Y';

    DateEditable.prototype.init = function(element) {
      var _this = this;

      DateEditable.__super__.init.call(this, element);
      this.$input = $('<input type="text">');
      this.$input.on('keyup', function(e) {
        return _this.updateValue();
      });
      return this.setPopoverContent(this.$input);
    };

    DateEditable.prototype.getValueFromContent = function() {
      return this.$input.val();
    };

    return DateEditable;

  })(JJPopoverEditable);
  /*
  	 # Markdown Component
  */

  MarkdownEditable = (function(_super) {
    __extends(MarkdownEditable, _super);

    function MarkdownEditable() {
      _ref2 = MarkdownEditable.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    MarkdownEditable.prototype.contentTypes = ['markdown'];

    MarkdownEditable.prototype.markdown = null;

    MarkdownEditable.prototype.markdownChangeTimeout = null;

    MarkdownEditable.prototype.previewClass = 'preview';

    MarkdownEditable.prototype.init = function(element) {
      var $preview, $text,
        _this = this;

      MarkdownEditable.__super__.init.call(this, element);
      element.on('focus', function() {
        return _this.trigger('editor.closepopovers');
      });
      /*
      				.on 'blur', =>
      					@close()
      */

      $text = $('<textarea>', {
        'class': this.previewClass
      });
      $text.val(element.text());
      $preview = $('<div>', {
        'class': this.previewClass
      });
      this.setPopoverContent($text);
      return this.markdown = new JJMarkdownEditor($text, {
        preview: element,
        contentGetter: 'val',
        onChange: function(val) {
          if (_this.markdownChangeTimeout) {
            clearTimeout(_this.markdownChangeTimeout);
          }
          return _this.markdownChangeTimeout = setTimeout(function() {
            _this.setValue(val);
            if (!val.raw) {
              return _this.element.html(_this.getPlaceholder());
            }
          }, 1000);
        }
      });
    };

    MarkdownEditable.prototype.open = function() {
      return MarkdownEditable.__super__.open.call(this);
    };

    return MarkdownEditable;

  })(JJPopoverEditable);
  SplitMarkdownEditable = (function(_super) {
    __extends(SplitMarkdownEditable, _super);

    function SplitMarkdownEditable() {
      _ref3 = SplitMarkdownEditable.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    SplitMarkdownEditable.prototype.contentTypes = ['markdown-split'];

    SplitMarkdownEditable.prototype.previewClass = 'preview split';

    return SplitMarkdownEditable;

  })(MarkdownEditable);
  window.editorComponents = {};
  window.editorComponents.JJEditable = JJEditable;
  window.editorComponents.JJPopoverEditable = JJPopoverEditable;
  window.editorComponents.InlineEditable = InlineEditable;
  window.editorComponents.DateEditable = DateEditable;
  window.editorComponents.MarkdownEditable = MarkdownEditable;
  window.editorComponents.SplitMarkdownEditable = SplitMarkdownEditable;
  jQuery.event.props.push('dataTransfer');
  $(document).on('dragover drop', function(e) {
    return e.preventDefault();
  });
  editor = new JJEditor(['InlineEditable', 'DateEditable', 'MarkdownEditable', 'SplitMarkdownEditable']);
  editor.on('change:My.Fucki.Image', function(e) {
    return console.log("changed '" + e.name + "' within " + e.scope + " from " + e.prevValue + " to " + e.value);
  });
  editor.on('change:My.Fucki.Image.Test', function(e) {
    return console.log("changed Test from " + e.prevValue + " to " + e.value);
  });
  return window.editor = editor;
})(jQuery);
