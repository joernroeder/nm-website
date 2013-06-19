// Generated by CoffeeScript 1.6.2
"use strict";
/*
 # --- jQuery outer-click Plugin --------------------------
 # 
 # @see https://gist.github.com/kkosuge/3669605
 # 
 #  指定した要素以外のクリックでイベントを発火させる
 #  例： $("#notification-list").outerClick(function (event) { ... });
*/

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

(function($, elements, OUTER_CLICK) {
  var check;

  check = function(event) {
    var el, i, l, target, _results;

    i = 0;
    l = elements.length;
    target = event.target;
    el = void 0;
    _results = [];
    while (i < l) {
      el = elements[i];
      if (el !== target && !(el.contains ? el.contains(target) : (el.compareDocumentPosition ? el.compareDocumentPosition(target) & 16 : 1))) {
        $.event.trigger(OUTER_CLICK, event, el);
      }
      _results.push(i++);
    }
    return _results;
  };
  $.event.special[OUTER_CLICK] = {
    setup: function() {
      var i;

      i = elements.length;
      if (!i) {
        $.event.add(document, "click", check);
      }
      if ($.inArray(this, elements) < 0) {
        return elements[i] = this;
      }
    },
    teardown: function() {
      var i;

      i = $.inArray(this, elements);
      if (i >= 0) {
        elements.splice(i, 1);
        if (!elements.length) {
          return jQuery(this).unbind("click", check);
        }
      }
    }
  };
  return $.fn[OUTER_CLICK] = function(fn) {
    if (fn) {
      return this.bind(OUTER_CLICK, fn);
    } else {
      return this.trigger(OUTER_CLICK);
    }
  };
})(jQuery, [], "outerClick");

(function($) {
  /*
  	 # select ranges within input fields
  	 #
  	 # @param int start
  	 # @param int end
  */

  var DateEditable, InlineEditable, JJEditable, JJEditor, JJPopoverEditable, MarkdownEditable, SplitMarkdownEditable, _ref, _ref1, _ref2, _ref3;

  $.fn.selectRange = function(start, end) {
    if (!end) {
      end = start;
    }
    return this.each(function() {
      var range;

      if (this.setSelectionRange) {
        this.focus();
        return this.setSelectionRange(start, end);
      } else if (this.createTextRange) {
        range = this.createTextRange();
        range.collapse(true);
        range.moveEnd("character", end);
        range.moveStart("character", start);
        return range.select();
      }
    });
  };
  JJEditor = (function() {
    var addComponent, addContentType, createComponent, destroyComponent, extractScope, getComponentByContentType, trimObject, _components, _contentTypes, _events, _storage;

    _contentTypes = {};

    _components = {};

    _storage = {};

    _events = {};

    JJEditor.prototype.debug = true;

    JJEditor.prototype.attr = {
      _namespace: 'editor-',
      type: 'type',
      name: 'name',
      scope: 'scope',
      placeholder: 'placeholder',
      options: 'options',
      handledBy: 'handled-by',
      componentId: 'component-id'
    };

    function JJEditor(scope, components) {
      var _this = this;

      if (components === void 0) {
        components = scope;
        scope = $(document);
      }
      this.scope = scope instanceof jQuery ? scope : $(scope);
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
      this.on('change:\\', function(e) {
        return _this.updateState(e.fullName, e.value);
      });
      this.on('editor.removeComponent', function(fullName) {
        return _this.updateState(fullName, null);
      });
      this.updateElements();
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
    		 # @see http://stackoverflow.com/questions/9099555/jquery-bind-events-on-plain-javascript-objects
    */


    JJEditor.prototype.on = function(name, callback) {
      if (!_events[name]) {
        _events[name] = $.Callbacks('unique');
      }
      return _events[name].add(callback);
    };

    JJEditor.prototype.off = function(name, callback) {
      if (!_events[name]) {
        return;
      }
      return _events[name].remove(callback);
    };

    JJEditor.prototype.trigger = function(name, eventData) {
      if (name.indexOf(':' !== -1 && this.debug)) {
        console.group('EDITOR: trigger ' + name);
        console.log(eventData);
        console.groupEnd();
      }
      if (_events[name]) {
        return _events[name].fire(eventData);
      }
    };

    JJEditor.prototype.updateState = function(scope, value, silent) {
      var obj;

      if (this.debug) {
        console.group('EDITOR: update state');
      }
      if (this.debug) {
        console.log('scope: %s -> %O', scope, value);
      }
      obj = {};
      obj[scope] = value;
      _storage = $.extend(true, _storage, extractScope.call(this, obj));
      if (this.debug) {
        console.log(_storage);
      }
      if (this.debug) {
        console.groupEnd();
      }
      if (!silent) {
        console.log(_storage);
        console.log(this.getState());
        return this.trigger('stateUpdate', _storage);
      }
    };

    JJEditor.prototype.getState = function() {
      return _storage;
    };

    /*
    		 # adds a new component with the settings of the DOM element to the editor.
    		 #
    		 # @param $el jQuery element
    		 #
    		 # @return JJEditable
    */


    JJEditor.prototype.addElement = function($el) {
      var component, contentType;

      contentType = $el.data(this.getAttr('type'));
      component = false;
      if ($el.attr(this.getAttr('handledBy'))) {
        if (this.debug) {
          console.log('already handled by the editor!');
        }
        return component;
      }
      if (-1 !== $.inArray(contentType, Object.keys(_contentTypes))) {
        component = getComponentByContentType.call(this, contentType);
        $el.data(this.getAttr('componentId'), component.id);
        component.init($el);
        if (this.debug) {
          console.log('added element: %s', component.getDataFullName());
        }
      }
      return component;
    };

    /*
    		 # removes the component instance associated with the given element
    */


    JJEditor.prototype.removeElement = function($el) {
      var component, componentId;

      if (this.debug) {
        console.group('EDITOR: remove component');
      }
      componentId = $el.data(this.getAttr('componentId'));
      component = this.getComponent(componentId);
      if (component) {
        destroyComponent.call(this, component);
        if (this.debug) {
          console.groupEnd();
        }
        return true;
      }
      return false;
    };

    /*
    		 # removes an element by scope
    		 #
    		 # @example editor.removeElementByScope('Foo.Bar.Title');
    */


    JJEditor.prototype.removeElementByScope = function(fullName) {
      var component, components, i, removed;

      components = this.getComponents();
      removed = false;
      if (this.debug) {
        console.group('EDITOR: remove component by scope: %s', fullName);
      }
      for (i in components) {
        component = components[i];
        if (fullName === component.getDataFullName()) {
          destroyComponent.call(this, component);
          removed = true;
        }
      }
      if (this.debug) {
        console.groupEnd();
      }
      return removed;
    };

    /*
    		 # remove elements by scope
    		 #
    		 # @example editor.removeElementsByScope('Foo.Bar');
    		 # @example editor.removeElementsByScope('Foo.Bar', ['Title, Description']);
    */


    JJEditor.prototype.removeElementsByScope = function(scope, names) {
      var all, component, components, i, removed;

      if (names == null) {
        names = [];
      }
      components = this.getComponents();
      removed = false;
      if (!names.length) {
        all = true;
      }
      if (this.debug) {
        console.group('EDITOR: remove components by scope: %s, names: %O', scope, names);
      }
      for (i in components) {
        component = components[i];
        if (scope === component.getDataScope()) {
          if (all || -1 !== $.inArray(component.getDataName(), names)) {
            destroyComponent.call(this, component);
            removed = true;
          }
        }
      }
      if (this.debug) {
        console.groupEnd();
      }
      return removed;
    };

    /*
    		 # syncs the editor components with the current DOM-Structure
    */


    JJEditor.prototype.updateElements = function() {
      var component, handledBy, id, _ref,
        _this = this;

      handledBy = this.getAttr('handledBy');
      if (this.debug) {
        console.group('EDITOR: update Elements');
      }
      $('[data-' + this.getAttr('type') + ']', this.scope).each(function(i, el) {
        var $el;

        $el = $(el);
        if (!$el.attr(handledBy)) {
          return _this.addElement($el);
        }
      });
      _ref = this.getComponents();
      for (id in _ref) {
        component = _ref[id];
        if (!component.elementExists()) {
          destroyComponent.call(this, component);
        }
      }
      if (this.debug) {
        console.groupEnd();
      }
      return null;
    };

    /*
    		 # removes all component bindings and destroys the editor.
    */


    JJEditor.prototype.destroy = function() {
      var callbacks, component, id, name, _ref;

      console.log('going to destroy the editor and remove all');
      _ref = this.getComponents();
      for (id in _ref) {
        component = _ref[id];
        destroyComponent.call(this, component);
      }
      this.off();
      for (name in _events) {
        callbacks = _events[name];
        callbacks.disable();
        callbacks.empty();
      }
      return false;
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

    /*
    		 # @private
    		 #
    */


    destroyComponent = function(component) {
      var id;

      id = component.getId();
      if (this.debug) {
        console.log('EDITOR: destroy component %s', component.getDataFullName());
      }
      component.destroy();
      _components[id] = null;
      return delete _components[id];
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

    /*
    		 #
    		 # @private
    		 #
    		 # @param [object] Object
    */


    trimObject = function(obj) {
      var key, value;

      for (key in obj) {
        value = obj[key];
        if (typeof value === 'object') {
          value = trimObject(value);
        }
        if (value === null || value === void 0 || $.isEmptyObject(obj[key])) {
          delete obj[key];
        }
      }
      return obj;
    };

    /*
    		 # keys with dot syntax are divided into multi-dimensional objects.
    		 #
    		 # @private
    		 #
    		 # @param [object] Object
    		 #
    */


    extractScope = function(o) {
      var k, key, oo, part, parts, t;

      oo = {};
      t = void 0;
      parts = void 0;
      part = void 0;
      for (k in o) {
        t = oo;
        parts = k.split('.');
        key = parts.pop();
        while (parts.length) {
          part = parts.shift();
          t = t[part] = t[part] || {};
        }
        t[key] = o[k];
      }
      return oo;
    };

    return JJEditor;

  })();
  /*
  	 # Abstract Editable Class
  	 #
  	 # @param [Editor] editor
  	 # 
  	 #
  	 # Custom event names can be easily created and destroyed with the 'getNamespacedEventName' function
  	 # @example
  	 # 		$foo.on(this.getNamespacedEventName('click'), function() {
  	 #			console.log('clicked');
  	 #		});
  	 #
  	 #		$foo.off(this.getNamespacedEventName('click'));
  	 #
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
      this.setOptions(element.data(this.editor.getAttr('options')));
      element.attr(this.editor.getAttr('handledBy'), this.id);
      return this.updateValue(true);
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

    JJEditable.prototype.getNamespacedEventName = function(name) {
      var eventNames, n, names, _i, _len;

      names = name.split(' ');
      eventNames = [];
      for (_i = 0, _len = names.length; _i < _len; _i++) {
        n = names[_i];
        eventNames.push("" + n + "." + this.id);
      }
      return eventNames.join(' ');
    };

    JJEditable.prototype.trigger = function(name, eventData) {
      if (eventData == null) {
        eventData = {};
      }
      eventData['senderId'] = this.id;
      name = getEventName.call(this, name);
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
      name = getEventName.call(this, name);
      name = this.getNamespacedEventName(name);
      if (!this.editor) {
        return this.editor.on(name, callback);
      }
    };

    JJEditable.prototype.off = function(name, callback) {
      name = getEventName.call(this, name);
      name = this.getNamespacedEventName(name);
      if (!this.editor) {
        return this.editor.off(name, callback);
      }
    };

    JJEditable.prototype.getElement = function() {
      return this.element;
    };

    /*
    		 # returns true if the element is still present in the documents DOM
    		 # @see http://stackoverflow.com/a/4040848/520544
    		 #
    		 # @return boolean
    */


    JJEditable.prototype.elementExists = function() {
      return this.element.closest('body').length > 0;
    };

    JJEditable.prototype.getId = function() {
      return this.id;
    };

    /*
    		 # sets the value of the component
    		 #
    		 # @param [object] value
    		 # @param [boolean] silent
    */


    JJEditable.prototype.setValue = function(value, silent) {
      if (!silent && this._prevValue === value) {
        return;
      }
      this._prevValue = this._value;
      this._value = value;
      if (silent) {
        this.editor.updateState(this.getDataFullName(), this._value, silent);
      } else {
        this.triggerScopeEvent('change', {
          value: this._value,
          prevValue: this._prevValue
        });
        this.triggerDataEvent('change', {
          value: this._value,
          prevValue: this._prevValue
        });
        if (typeof value === 'string') {
          this.render();
        }
      }
      return true;
    };

    JJEditable.prototype.getValue = function() {
      return this._value;
    };

    /*
    		 # use this method if you're going bind an element property to the component value.
    		 #
    		 # @use DateEditable.updateValue as an example
    		 #
    */


    JJEditable.prototype.updateValue = function(silent) {
      return this.setValue(this.getValueFromContent(), silent);
    };

    JJEditable.prototype.getValueFromContent = function() {
      return null;
    };

    JJEditable.prototype.getPlaceholder = function() {
      var placeholder;

      placeholder = this.element.attr(this.editor.getAttr('placeholder'));
      if (placeholder) {
        return placeholder;
      } else {
        return 'PLACEHOLDER';
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

    JJEditable.prototype.destroy = function() {
      this.element.removeAttr(this.editor.getAttr('handledBy'));
      this.trigger('editor.removeComponent', this.getDataFullName());
      this.editor.off(this.getNamespacedEventName('editor'));
      return this.editor = null;
    };

    return JJEditable;

  })();
  /*
  	 # Abstract Popover Class
  */

  JJPopoverEditable = (function(_super) {
    __extends(JJPopoverEditable, _super);

    JJPopoverEditable.prototype._popoverContent = '';

    JJPopoverEditable.prototype.popoverClasses = [];

    JJPopoverEditable.prototype.closeOnOuterClick = true;

    JJPopoverEditable.prototype.position = {
      at: 'right center',
      my: 'left center'
    };

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
        events: {
          visible: function(event, api) {
            var $input;

            $input = $('input, textarea', _this.api.tooltip).eq(0);
            $input.selectRange($input.val().length);
            if (_this.closeOnOuterClick) {
              _this.api.tooltip.one(_this.getNamespacedEventName('outerClick'), function() {
                return _this.close();
              });
            }
            return _this;
          }
        },
        content: {
          text: function() {
            return _this.getPopoverContent();
          },
          title: ''
        },
        position: {
          at: this.position.at,
          my: this.position.my,
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
          classes: this.getPopOverClasses(),
          tip: {
            width: 20,
            height: 10
          }
        }
      });
      this.api = element.qtip('api');
      this.on('editor.closepopovers', function(eventData) {
        if (eventData.senderId !== _this.id) {
          return _this.close();
        }
      });
      return element.on(this.getNamespacedEventName('click'), function() {
        return _this.toggle();
      });
    };

    JJPopoverEditable.prototype.getValueFromContent = function() {
      return this.element.html();
    };

    JJPopoverEditable.prototype.open = function() {
      this.element.addClass('active');
      this.trigger('editor.closepopovers');
      return this.api.show();
    };

    JJPopoverEditable.prototype.close = function() {
      this.element.removeClass('active');
      this.api.tooltip.unbind(this.getNamespacedEventName('outerClick'));
      return this.api.hide();
    };

    JJPopoverEditable.prototype.toggle = function() {
      if (this.api.tooltip && $(this.api.tooltip).hasClass('qtip-focus')) {
        return this.close();
      } else {
        return this.open();
      }
    };

    JJPopoverEditable.prototype.getPopOverClasses = function() {
      return ['editor-popover'].concat([this.name], this.popoverClasses).join(' ');
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

    JJPopoverEditable.prototype.destroy = function() {
      this.api.tooltip.unbind(this.getNamespacedEventName('outerClick'));
      this.element.off(this.getNamespacedEventName('click'));
      return JJPopoverEditable.__super__.destroy.call(this);
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
      return element.attr('contenteditable', true).on(this.getNamespacedEventName('blur'), function(e) {
        return _this.updateValue();
      }).on(this.getNamespacedEventName('click focus'), function() {
        return _this.trigger('editor.closepopovers');
      });
    };

    InlineEditable.prototype.getValueFromContent = function() {
      return this.element.text();
    };

    InlineEditable.prototype.destroy = function() {
      this.element.removeAttr('contenteditable');
      this.element.off(this.getNamespacedEventName('keyup click focus'));
      return InlineEditable.__super__.destroy.call(this);
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

    DateEditable.prototype.position = {
      at: 'top left',
      my: 'bottom left'
    };

    DateEditable.prototype.format = 'Y';

    DateEditable.prototype.init = function(element) {
      var _this = this;

      this.$input = $('<input type="text">');
      DateEditable.__super__.init.call(this, element);
      this.$input.on(this.getNamespacedEventName('keyup'), function(e) {
        return _this.updateValue();
      });
      return this.setPopoverContent(this.$input);
    };

    DateEditable.prototype.getValueFromContent = function() {
      return this.$input.val();
    };

    DateEditable.prototype.destroy = function() {
      this.$input.off(this.getNamespacedEventName('keyup'));
      return DateEditable.__super__.destroy.call(this);
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

    MarkdownEditable.prototype.popoverClasses = ['markdown'];

    MarkdownEditable.prototype.init = function(element) {
      var $preview, $text, initialTriggerDone, options,
        _this = this;

      MarkdownEditable.__super__.init.call(this, element);
      element.on(this.getNamespacedEventName('focus'), function() {
        return _this.trigger('editor.closepopovers');
      });
      $text = $('<textarea>', {
        'class': this.previewClass
      });
      $text.val(element.text());
      /*
      			 # @todo set silent value
      			@setValue
      				images: {}
      				raw: $text.val()
      */

      $preview = $('<div>', {
        'class': this.previewClass
      });
      this.setPopoverContent($text);
      initialTriggerDone = false;
      options = {
        preview: element,
        contentGetter: 'val',
        onChange: function(val) {
          if (!initialTriggerDone) {
            initialTriggerDone = true;
            return;
          }
          console.log('markdown changed');
          if (_this.markdownChangeTimeout) {
            clearTimeout(_this.markdownChangeTimeout);
          }
          return _this.markdownChangeTimeout = setTimeout(function() {
            _this.setValue(val);
            if (!val.raw) {
              return _this.element.html(_this.getPlaceholder());
            }
          }, 500);
        }
      };
      $.extend(options, this._options || {});
      return this.markdown = new JJMarkdownEditor($text, options);
    };

    MarkdownEditable.prototype.getValueFromContent = function() {
      return {
        raw: this.element.text()
      };
    };

    MarkdownEditable.prototype.destroy = function() {
      this.element.off(this.getNamespacedEventName('focus'));
      this.markdown.cleanup();
      this.markdown = null;
      return MarkdownEditable.__super__.destroy.call(this);
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
  window.JJEditor = JJEditor;
  window.editorComponents = {};
  window.editorComponents.JJEditable = JJEditable;
  window.editorComponents.JJPopoverEditable = JJPopoverEditable;
  window.editorComponents.InlineEditable = InlineEditable;
  window.editorComponents.DateEditable = DateEditable;
  window.editorComponents.MarkdownEditable = MarkdownEditable;
  return window.editorComponents.SplitMarkdownEditable = SplitMarkdownEditable;
  /*
  	# init file transfer
  	jQuery.event.props.push 'dataTransfer'
  	# disable drag'n'drop for whole document
  	
  	$(document).on 'dragover drop', (e) ->
  		e.preventDefault()
  
  
  	editor = new JJEditor [
  		'InlineEditable'
  		'DateEditable'
  		'MarkdownEditable',
  		'SplitMarkdownEditable'
  	]
  
  	editor.on 'change:Foo.My.Fucki.Image', (e) ->
  		console.log "changed '#{e.name}' within #{e.scope} from #{e.prevValue} to #{e.value}"
  
  	editor.on 'change:Foo.My.Fucki.Image.Test', (e) ->
  		console.log "changed Test from #{e.prevValue} to #{e.value}"
  
  	window.$test = $test = $ '<h1 data-editor-type="inline" data-editor-name="\My.Fucki.Image.TestTitle">FooBar</h1>'
  	$('.overview').prepend $test
  	editor.updateElements()
  */

  /*
  	testComponent = editor.addElement $test
  	console.log testComponent
  	console.log testComponent.getId()
  */

})(jQuery);
