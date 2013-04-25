// Generated by CoffeeScript 1.6.2
/*

    000000  0000000000    000000000000000000
    000000  0000000000    00000000000000000000
    000000      000000    000000   00000  000000
    000000      000000    000000     000  000000
     00000      000000    000000       0  000000
       000      000000    000000          000000
         0      000000    000000          000000

    Neue Medien - Kunsthochschule Kassel
    http://neuemedienkassel.de
*/

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

(function($, window) {
  var Border, Box2DHolder, Entity, GravityCenter, RadialGravityStorage, RectangleEntity, _ref;

  window.requestAnimFrame = (function() {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
      return window.setTimeout(callback, 1000 / 60);
    };
  })();
  window.debugGravity = false;
  window.logger = function() {
    if (window.debugGravity) {
      return console.log(arguments[0]);
    }
  };
  /*
  	 # Creates a basic Entity with the given parameters
  	 # this should be just the base class to extend.
  	 #
  	 # @param int id
  	 # @param float x
  	 # @param float y
  	 # @param float angle (optional)
  */

  Entity = (function() {
    function Entity(id, x, y, scaleFactor) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.scaleFactor = scaleFactor != null ? scaleFactor : 30;
    }

    Entity.prototype.update = function(x, y, angle) {
      this.x = x;
      this.y = y;
      this.angle = angle;
    };

    Entity.prototype.setAwake = function(isAwake) {
      this.isAwake = isAwake;
    };

    Entity.prototype.scale = function() {
      return this.scaleFactor;
    };

    Entity.prototype.draw = function() {};

    return Entity;

  })();
  /*
  	 # Creates a Rectangle with the given parameters
  	 #
  	 # @param int id
  	 # @param float x
  	 # @param float y
  	 # @param float width
  	 # @param float height
  	 # @param float angle (optional)
  */

  RectangleEntity = (function(_super) {
    __extends(RectangleEntity, _super);

    RectangleEntity.prototype.color = 'red';

    RectangleEntity.prototype.sleepColor = 'gray';

    function RectangleEntity(id, x, y, width, height, scaleFactor) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.width = width != null ? width : 0;
      this.height = height != null ? height : 0;
      this.scaleFactor = scaleFactor != null ? scaleFactor : 30;
      /*
      			$item = $("[data-gravity-item=#{@id}]")
      
      			if not $item.length
      				$('<div class="entity" data-gravity-item="' + @id + '">' + @id + '</div>')
      					.appendTo('.gravity')
      */

      RectangleEntity.__super__.constructor.call(this, this.id, this.x, this.y, this.scaleFactor);
    }

    RectangleEntity.prototype.halfWidth = function() {
      return this.width / 2;
    };

    RectangleEntity.prototype.halfHeight = function() {
      return this.height / 2;
    };

    RectangleEntity.prototype.draw = function() {
      var $item;

      $item = $("[data-gravity-item=" + this.id + "]");
      if ($item.length) {
        /*
        				tooltip = window.currentTooltip
        				if tooltip.targetId and tooltip.targetId is @id
        					$item.qtip 'reposition'
        
        					logger 'update tooltip'
        */

        return $("[data-gravity-item=" + this.id + "]").css({
          'top': this.y * this.scale(),
          'left': this.x * this.scale(),
          'margin-top': -this.height * this.scale() / 2,
          'margin-left': -this.width * this.scale() / 2,
          'height': this.height * this.scale(),
          'width': this.width * this.scale()
        });
      }
    };

    return RectangleEntity;

  })(Entity);
  Border = (function(_super) {
    __extends(Border, _super);

    function Border(id, x, y, width, height, scaleFactor) {
      var $item;

      this.id = id;
      this.x = x;
      this.y = y;
      this.width = width != null ? width : 0;
      this.height = height != null ? height : 0;
      this.scaleFactor = scaleFactor != null ? scaleFactor : 30;
      $item = $("[data-gravity-item=" + this.id + "]");
      if (!$item.length) {
        $('<div class="entity" data-gravity-item="' + this.id + '">' + this.id + '</div>').appendTo('.gravity');
      }
      Border.__super__.constructor.call(this, this.id, this.x, this.y, this.scaleFactor);
    }

    return Border;

  })(RectangleEntity);
  GravityCenter = (function(_super) {
    __extends(GravityCenter, _super);

    function GravityCenter() {
      _ref = GravityCenter.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    GravityCenter.prototype.color = 'green';

    GravityCenter.prototype.draw = function() {};

    return GravityCenter;

  })(RectangleEntity);
  Box2DHolder = (function() {
    Box2DHolder.prototype.useWorker = false;

    Box2DHolder.prototype.worker = null;

    Box2DHolder.prototype.bodiesState = {};

    Box2DHolder.prototype.world = {};

    Box2DHolder.prototype.border = {};

    Box2DHolder.prototype.box = null;

    Box2DHolder.prototype.msgID = 0;

    Box2DHolder.prototype.needToDraw = true;

    Box2DHolder.prototype.scaleFactor = 30;

    Box2DHolder.prototype.setScale = function(val) {
      logger("box2DHolder set scale to " + val);
      this.scaleFactor = val;
      if (this.worker) {
        return this.worker.postMessage({
          key: 'setscale',
          value: val
        });
      }
    };

    Box2DHolder.prototype.setDimensions = function(width, height) {
      this.width = width;
      this.height = height;
      if (this.worker) {
        this.worker.postMessage({
          key: 'dimensions',
          width: this.n(this.width),
          height: this.n(this.height)
        });
        logger("set dimensions: " + (this.n(this.width)) + " - " + (this.n(this.height)));
        return this.needToDraw = true;
      }
    };

    /*
    		 # constructs the Box2DHolder
    		 #
    		 # @param int width
    		 # @param int height
    */


    function Box2DHolder(width, height, padding, scale, workerOpts) {
      this.width = width;
      this.height = height;
      this.padding = padding;
      this.workerOpts = workerOpts;
      this.loop = __bind(this.loop, this);
      this.init = function() {
        var _this = this;

        logger('Box2DHolder init');
        this.setScale(scale);
        this.useWorker = this.hasWebWorker();
        document.addEventListener('webkitvisibilitychange', (function() {
          if (document.webkitHidden) {
            return _this.stop();
          } else {
            return _this.start();
          }
        }), false);
        if (this.useWorker) {
          this.initWorker();
        } else {
          this.initNonWorker();
        }
        this.setDimensions(this.width, this.height);
        return this.loop();
      };
      /*
      			 # Returns whether the page supports web workers
      */

      this.hasWebWorker = function() {
        return typeof Worker !== 'undefined';
      };
      /*
      			 # creates the worker and sends the entities down the wire
      */

      this.initWorker = function() {
        var _this = this;

        this.worker = new Worker(this.workerOpts.physics);
        return this.worker.onmessage = function(e) {
          var id, newBodies, newBody, _results;

          if ('log' === e.data.key) {
            logger(e.data.log);
            return;
          }
          newBodies = e.data.bodiesState;
          _this.bodiesState = $.extend({}, _this.bodiesState, newBodies);
          _results = [];
          for (id in _this.bodiesState) {
            newBody = newBodies[id];
            if (_this.world[id]) {
              if (newBody) {
                _this.world[id].setAwake(true);
                _this.bodiesState[id] = newBody;
                _results.push(_this.needToDraw = true);
              } else if (_this.world[id].isAwake) {
                _this.needToDraw = true;
                _results.push(_this.world[id].setAwake(false));
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        };
      };
      /*
      			 # creates the worker fallback
      */

      this.initNonWorker = function() {
        alert('no webworker support :(');
        return logger('init non worker');
      };
      this.init();
    }

    /*
    		 # public add
    */


    Box2DHolder.prototype.add = function(obj) {
      var entity, gravity;

      if (obj.id === 'gravity') {
        gravity = new GravityCenter(obj.id, this.n(obj.left), this.n(obj.top), this.scaleFactor);
        return this.addGravity(gravity);
      } else if (obj.width && obj.height) {
        entity = new RectangleEntity(obj.id, this.n(obj.left), this.n(obj.top), this.n(obj.width), this.n(obj.height), this.scaleFactor);
        return this.addEntity(entity);
      }
    };

    /*
    		 # n pixel to float values
    */


    Box2DHolder.prototype.n = function(num) {
      return num / this.scaleFactor;
    };

    Box2DHolder.prototype.w = function(num) {
      return num += this.n(this.padding * this.width);
    };

    Box2DHolder.prototype.h = function(num) {
      return num += this.n(this.padding * this.height);
    };

    /*
    		 # running thread
    */


    Box2DHolder.prototype.looper = 0;

    Box2DHolder.prototype.loop = function(animStart) {
      this.update(animStart);
      this.draw();
      return window.requestAnimFrame(this.loop);
    };

    /*
    		 # (re)-starts the simulation
    */


    Box2DHolder.prototype.start = function() {
      return this.worker.postMessage({
        key: 'start'
      });
    };

    /*
    		 # stops the simulation
    */


    Box2DHolder.prototype.stop = function() {
      return this.worker.postMessage({
        key: 'stop'
      });
    };

    /*
    */


    Box2DHolder.prototype.addGravity = function(gravity) {
      logger('add Gravity');
      return this.worker.postMessage({
        key: 'addEntity',
        entity: gravity
      });
    };

    /*
    */


    Box2DHolder.prototype.addEntity = function(entity) {
      logger("added entity '" + entity.id + "'");
      this.world[entity.id] = entity;
      this.worker.postMessage({
        key: 'addEntity',
        entity: this.world[entity.id]
      });
      return this.needToDraw = true;
    };

    /*
    		 # triggers the update
    		 # uses the worker if possible and sends him a message down the pipe
    		 #
    */


    Box2DHolder.prototype.update = function(animStart) {
      var entity, id, state, _results;

      if (this.useWorker) {
        if (this.needToDraw) {
          this.worker.postMessage({
            key: 'req',
            id: this.msgID
          });
          this.msgID++;
        }
      } else {
        this.box.update();
        this.bodiesState = this.box.getState();
        this.needToDraw = true;
      }
      _results = [];
      for (id in this.bodiesState) {
        entity = this.world[id];
        state = this.bodiesState[id];
        if (entity) {
          _results.push(entity.update(this.w(state.x), this.h(state.y), state.a));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    /*
    		 # redraws the world entities if nessessary
    		 #
    		 # @use this.needToDraw
    */


    Box2DHolder.prototype.draw = function() {
      var entity, id, _ref1;

      if (!this.needToDraw) {
        return;
      }
      _ref1 = this.world;
      for (id in _ref1) {
        entity = _ref1[id];
        entity = this.world[id];
        entity.draw();
      }
      return this.needToDraw = false;
    };

    return Box2DHolder;

  })();
  RadialGravityStorage = {
    itemIdCount: 0,
    implementationCount: 0,
    implementations: {}
  };
  window.Storage = RadialGravityStorage;
  window.currentTooltip = {};
  return $.extend($.fn, {
    RadialGravity: function(methodOrOptions) {
      var dataIdName, methods, self, storage;

      this.defaultOptions = {
        elementSelector: null,
        itemIdPrefix: 'gravity-item-',
        padding: 0,
        box2d: {
          scale: 100
        },
        worker: {
          physics: 'physics.js'
        }
      };
      dataIdName = 'gravity-id';
      self = this;
      storage = function(count) {
        return RadialGravityStorage.implementations[count];
      };
      methods = {
        init: function(options) {
          var getCountId, opts,
            _this = this;

          opts = $.extend({}, this.defaultOptions, options);
          getCountId = function() {
            RadialGravityStorage.itemIdCount++;
            return RadialGravityStorage.itemIdCount;
          };
          return this.each(function(i, el) {
            var addGravity, addItemEvents, findItems, getItemId, getStorageId, init, initResize, initTooltip, layoutItems, resizeTimeoutId, setAndUpdateDimensions, setDimensions, storageId, updateItemDimensions;

            storageId = RadialGravityStorage.implementationCount;
            RadialGravityStorage.implementationCount++;
            RadialGravityStorage.implementations[storageId] = {
              $container: null,
              box2DHolder: null,
              width: 0,
              height: 0,
              options: opts
            };
            storage = function() {
              return RadialGravityStorage.implementations[storageId];
            };
            setDimensions = function() {
              var height, store, width;

              store = storage();
              store.$container.css('min-height', $(window).height());
              width = store.$container.width();
              height = store.$container.height();
              width = width - (opts.padding * width);
              height = height - (opts.padding * height);
              store.width = width;
              store.height = height;
              if (store.height <= 0) {
                return store.height = $(window).height();
              }
            };
            setAndUpdateDimensions = function() {
              var store;

              setDimensions();
              store = storage();
              return store.box2DHolder.setDimensions(store.width, store.height);
            };
            init = function() {
              storage().$container = $(el).data(dataIdName, storageId);
              setDimensions();
              storage().box2DHolder = new Box2DHolder(storage().width, storage().height, opts.padding, opts.box2d.scale, opts.worker);
              initResize();
              addGravity();
              return findItems();
            };
            resizeTimeoutId = null;
            initResize = function() {
              var _this = this;

              return window.onresize = function(event) {
                clearTimeout(resizeTimeoutId);
                return resizeTimeoutId = setTimeout(function() {
                  setAndUpdateDimensions();
                  logger('on resize');
                  return addGravity();
                }, 10);
              };
            };
            getStorageId = function() {
              return opts.itemIdPrefix + ("" + storageId + "-");
            };
            getItemId = function() {
              return getStorageId() + getCountId();
            };
            addGravity = function() {
              return methods.add({
                id: 'gravity',
                top: storage().height / 2,
                left: storage().width / 2
              }, storageId);
            };
            layoutItems = function($items) {
              var angle, inc, store, x, y;

              inc = Math.PI * 2 / $items.length;
              x = y = angle = 0;
              store = storage();
              return $items.each(function(i, el) {
                var $item, d, noise;

                noise = Math.random() * 100;
                $item = $(el);
                if (Math.random() > .5) {
                  noise *= -1;
                }
                d = Math.min(store.width, store.height) / 2;
                x = Math.max(0, Math.min(store.width - $item.width(), d * Math.cos(angle) + d + noise));
                y = Math.max(0, Math.min(store.height - $item.height(), d * Math.sin(angle) + d + noise));
                console.log(store.height);
                console.log($item.height());
                console.log(y);
                el.style.position = 'absolute';
                el.style.left = x + 'px';
                el.style.top = y + 'px';
                return angle += inc;
              });
            };
            updateItemDimensions = function($items) {
              return $items.each(function(i, el) {
                var $item, height, rand, width;

                $item = $(el);
                if (!$item.hasClass('resizable')) {
                  return;
                }
                rand = Math.max(.7, Math.random() * 1.7);
                width = $item.width() * rand;
                height = $item.height() * rand;
                $item.width(width);
                return $item.height(height);
              });
            };
            initTooltip = function($item) {
              var $metaSection, getMargin, marginOffset;

              $metaSection = $('section[role=tooltip-content]', $item);
              marginOffset = -20;
              getMargin = function(api) {
                var $tooltip, margin;

                margin = marginOffset;
                $tooltip = $(api.tooltip);
                if ($tooltip.hasClass('qtip-pos-rb')) {
                  logger('inverse margin');
                  margin *= -1;
                }
                return margin;
              };
              if ($metaSection.length) {
                $item.qtip({
                  content: {
                    text: $metaSection.html()
                  },
                  /*
                  								events:
                  									render: (event, api) ->
                  										# Grab the tooltip element from the API elements object
                  
                  										#updateMargin api
                  */

                  show: {
                    event: 'mouseenter',
                    effect: function(api) {
                      $item.addClass('has-tooltip');
                      return $(this).stop(true, true).css({
                        'margin-left': getMargin(api)
                      }).show().animate({
                        'margin-left': 0,
                        'opacity': 1
                      }, 200);
                    }
                  },
                  hide: {
                    event: 'mouseleave',
                    effect: function(api) {
                      return $(this).stop(true, true).animate({
                        'margin-left': getMargin(api),
                        'opacity': 0
                      }, 200, function() {
                        $item.removeClass('has-tooltip');
                        return $(this).hide();
                      });
                    }
                  },
                  /*
                  								events:
                  									show: (e, api) ->
                  										window.currentTooltip = 
                  											tip			: @
                  											target		: api.target
                  											targetId	: $(api.target).attr 'data-gravity-item'
                  											api			: api
                  
                  									hide: (e, api) ->
                  										window.currentTooltip = {}
                  */

                  position: {
                    at: "right bottom",
                    my: "left bottom",
                    viewport: storage().$container,
                    adjust: {
                      method: 'flip shift',
                      x: 0,
                      y: 10
                    }
                  }
                });
                return logger($item.qtip('api').tooltip);
              }
            };
            addItemEvents = function($item) {
              return $item.imagesLoaded().done(function($images) {
                $item.addClass('loaded');
                return initTooltip($item);
              });
            };
            findItems = function() {
              var $items,
                _this = this;

              $items = opts.elementSelector ? storage().$container.find(opts.elementSelector) : storage().$container.children();
              updateItemDimensions($items);
              layoutItems($items);
              return $.each($items, function(index, item) {
                var $item, itemData, itemId, pos;

                $item = $(item);
                pos = $item.position();
                itemId = getItemId();
                addItemEvents($item);
                itemData = {
                  id: itemId,
                  width: $item.width(),
                  height: $item.height(),
                  top: pos.top,
                  left: pos.left
                };
                $item.attr('data-gravity-item', itemId);
                return methods.add(itemData, storageId);
              });
            };
            init();
            return true;
          });
        },
        show: function() {},
        hide: function() {},
        update: function(content) {},
        /*
        			setPadding: (p) ->
        				@
        */

        /*
        			 # adds an item to the gravity world
        			 #
        			 # @param object data
        			 #
        			 # @example
        			 # 		$('selector').RadialGravity('add', {
        			 #			id: 'foobar',
        			 #			width: 100,
        			 #			height: 100,
        			 #			top: 0,
        			 #			left: 0
        			 #		});
        */

        add: function(data, implementationCount) {
          if (implementationCount === void 0) {
            implementationCount = $(this).data(dataIdName);
          } else if (typeof implementationCount !== 'number') {
            console.error('Couldn\'t add items to gravity container.');
          }
          return storage(implementationCount).box2DHolder.add(data);
        }
      };
      if (methods[methodOrOptions]) {
        return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
      } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
        return methods.init.apply(this, arguments);
      } else {
        console.error("Method " + method + " does not exist on $.RadialGravity");
      }
      return this;
    }
  });
})(this.jQuery || this.Zepto, this);
