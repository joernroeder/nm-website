// Generated by CoffeeScript 1.6.2
"use strict";
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function($) {
  var DateEditable, Editable, Editor, InlineEditable, MarkdownEditable, PopoverEditable, _ref, _ref1, _ref2;

  Editor = (function() {
    var addComponent, addContentType, createComponent, events, getComponentByContentType, init, _components, _contentTypes;

    _contentTypes = {};

    _components = {};

    events = {};

    Editor.prototype.attrName = 'data-editor-type';

    function Editor(components) {
      var _this = this;

      $.map(components, function(component) {
        return addComponent(component);
      });
      init.call(this);
    }

    /*
    		 # on, off, trigger via $.Callbacks() 
    		 #
    		 # @link http://stackoverflow.com/questions/9099555/jquery-bind-events-on-plain-javascript-objects
    */


    Editor.prototype.on = function(name, callback) {
      if (!events[name]) {
        events[name] = $.Callbacks();
      }
      return events[name].add(callback);
    };

    Editor.prototype.off = function(name, callback) {
      if (!events[name]) {
        return;
      }
      return events[name].remove(callback);
    };

    Editor.prototype.trigger = function(name, eventData) {
      if (events[name]) {
        return events[name].fire(eventData);
      }
    };

    /*
    		 # @private
    */


    init = function() {
      var _this = this;

      return $('[' + this.attrName + ']').each(function(i, el) {
        var $el, component, contentType;

        $el = $(el);
        contentType = $el.data('editor-type');
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
      console.log('add Component: ' + name);
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

    Editor.prototype.getComponent = function(id) {
      if (_components[id]) {
        return _components[id];
      } else {
        return null;
      }
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

    return Editor;

  })();
  /*
  	 # Abstract Editable Class
  	 # 
  	 # @param [Editor] editor
  */

  Editable = (function() {
    var getEventName;

    Editable.prototype._value = null;

    Editable.prototype.contentTypes = [];

    function Editable(editor) {
      this.editor = editor;
      this.name = this.constructor.name.toLowerCase();
      this.setValue(this.name);
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

    Editable.prototype.init = function(element) {
      this.element = element;
      return console.log('subclass this method to run your custom code');
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

    Editable.prototype.trigger = function(name, eventData) {
      if (eventData == null) {
        eventData = {};
      }
      eventData['senderId'] = this.id;
      name = getEventName(name);
      return this.editor.trigger(name, eventData);
    };

    Editable.prototype.on = function(name, callback) {
      name = getEventName(name);
      console.log(name);
      return this.editor.on(name, callback);
    };

    Editable.prototype.off = function(name, callback) {
      name = getEventName(name);
      return this.editor.off(name, callback);
    };

    Editable.prototype.setValue = function(value) {
      this._value = value;
      return this.render();
    };

    Editable.prototype.getValue = function() {
      return this._value;
    };

    Editable.prototype.render = function() {
      if (this.element) {
        return this.element.html(this.getValue());
      }
    };

    return Editable;

  })();
  /*
  	 # Abstract Popover Class
  */

  PopoverEditable = (function(_super) {
    __extends(PopoverEditable, _super);

    PopoverEditable.prototype._popoverContent = '';

    function PopoverEditable(editor) {
      this.editor = editor;
      if (this.constructor.name === 'PopoverEditable') {
        throw new ReferenceError('"PopoverEditable" is an abstract class. Please use one of the subclasses instead.');
      }
      PopoverEditable.__super__.constructor.call(this, editor);
    }

    PopoverEditable.prototype.init = function(element) {
      var _this = this;

      this.element = element;
      element.qtip({
        content: {
          text: function() {
            console.log(_this.name);
            console.log(_this.getValue());
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

    PopoverEditable.prototype.open = function() {
      this.trigger('editor.closepopovers');
      return this.api.show();
    };

    PopoverEditable.prototype.close = function() {
      return this.api.hide();
    };

    PopoverEditable.prototype.toggle = function() {
      if (this.api.tooltip && $(this.api.tooltip).hasClass('qtip-focus')) {
        return this.close();
      } else {
        return this.open();
      }
    };

    PopoverEditable.prototype.getPopoverContent = function() {
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


    PopoverEditable.prototype.setPopoverContent = function(value) {
      return this._popoverContent = value;
    };

    return PopoverEditable;

  })(Editable);
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

      this.element = element;
      return element.attr('contenteditable', true).on('click', function() {
        return _this.trigger('editor.closepopovers');
      });
    };

    return InlineEditable;

  })(Editable);
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
      DateEditable.__super__.init.call(this, element);
      return this.setPopoverContent($('<input type="text">'));
    };

    return DateEditable;

  })(PopoverEditable);
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

    MarkdownEditable.prototype.init = function(element) {
      MarkdownEditable.__super__.init.call(this, element);
      return this.setPopoverContent('Fucka');
    };

    return MarkdownEditable;

  })(PopoverEditable);
  window.editorComponents = {};
  window.editorComponents.Editable = Editable;
  window.editorComponents.PopoverEditable = PopoverEditable;
  window.editorComponents.InlineEditable = InlineEditable;
  window.editorComponents.DateEditable = DateEditable;
  window.editorComponents.MarkdownEditable = MarkdownEditable;
  return window.editor = new Editor(['InlineEditable', 'DateEditable', 'MarkdownEditable']);
})(jQuery);
