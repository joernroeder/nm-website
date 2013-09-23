// Generated by CoffeeScript 1.6.3
"use strict";
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

(function($) {
  /*
  	layout a collection of item elements
  	@param {Array} items - array of Packery.Items
  	@param {Boolean} isInstant - disable transitions for setting item position
  */

  var JJPackery, JJPackeryMan, packery_layoutItems;
  packery_layoutItems = Packery.prototype.layoutItems;
  Packery.prototype.layoutItems = function(items, isInstant) {
    this.maxY = 0;
    return packery_layoutItems.call(this, items, isInstant);
  };
  Packery.Item.prototype.removeElem = function() {
    $(this.element).addClass('hidden');
    return false;
  };
  JJPackery = (function() {
    /*
    		 # construct variables
    */

    JJPackery.prototype.members = function() {
      this.$window = $();
      this.$container = $();
      this.$sizing = $();
      this.$packeryEl = $();
      this.packery = null;
      this.resizeTimeout = null;
      this.updateLayout = true;
      this.fitInWindow = true;
      this.rendered = 0;
      this.onResizeLayout = false;
      this.layoutIsComplete = false;
      this.started = false;
      this.itemDimensions = [];
      this.itemSelector = '.packery-item';
      this.transitionDuration = '.4s';
      return this.factor = .3;
    };

    function JJPackery() {
      this.onResize = __bind(this.onResize, this);
      console.log('JJPackery');
      this.members();
      this.init();
      this.start();
    }

    JJPackery.prototype.randomizeDimensions = function() {
      var floor, max, min;
      max = 1;
      min = .5;
      floor = 10;
      return $(this.itemSelector, this.$packeryEl).each(function(i, el) {
        var $el, factor, h, w;
        $el = $(el);
        if (!$el.hasClass('resizable')) {
          return;
        }
        w = $el.width();
        h = $el.height();
        factor = Math.min(max, Math.max(min, Math.random() * (max + min)));
        console.log(factor);
        $el.width(Math.floor(w * factor / floor) * floor);
        return $el.height(Math.floor(h * factor / floor) * floor);
      });
    };

    /*
    		 # fill variables
    */


    JJPackery.prototype.init = function() {
      this.$window = $(window);
      this.$container = $('.packery-wrapper');
      this.$sizing = $('.packery-test', this.$container);
      this.$packeryEl = $('.packery', this.$container);
      if (this.fitInWindow) {
        return this.$packeryEl.addClass('fit-in-window').css('max-height', this.$window.height());
      }
    };

    JJPackery.prototype.calcAndLayout = function() {
      if (this.packery && this.updateLayout) {
        console.log('calc and relayout');
        if (this.fitInWindow) {
          this.calc();
        }
        return this.packery.layout();
      }
    };

    JJPackery.prototype.setToCenter = function() {
      var elHeight, winHeight;
      winHeight = this.$window.height();
      elHeight = this.$packeryEl.height();
      if (elHeight <= winHeight) {
        return this.$packeryEl.css('top', Math.floor((winHeight - elHeight) / 2));
      } else {
        return this.$packeryEl.css('top', 0);
      }
    };

    JJPackery.prototype.hiddenLayout = function(duration) {
      this.onResizeLayout = true;
      this.packery.layout();
      return this.onResizeLayout = false;
    };

    /*
    		 # on resize handler
    		 #
    */


    JJPackery.prototype.onResize = function() {
      if (this.fitInWindow) {
        this.calc();
        this.$packeryEl.css('max-height', this.$window.height());
      }
      if (!this.layoutIsComplete) {
        console.log('not layoutIsComplete');
        this.layoutIsComplete = true;
        this.packery.layout();
      }
      this.packery.layout();
      this.setToCenter();
      if (this.layoutIsComplete && !this.started) {
        console.log('started');
        this.started = true;
        return this.show();
      }
    };

    /*
    		 # returns the centered position of the given element
    		 #
    		 # @return [object] position
    */


    JJPackery.prototype.getCenterPos = function($el) {
      var elCenter, elPos;
      elPos = $el.offset();
      return elCenter = {
        top: elPos.top + $el.height() / 2,
        left: elPos.left + $el.width() / 2
      };
    };

    /*
    		 # returns the distance between two points
    		 #
    		 # @param p1 
    		 # @param p2
    		 #
    		 # @return Number
    */


    JJPackery.prototype.getLineDistance = function(p1, p2) {
      var xs, ys;
      xs = ys = 0;
      xs = p2.left - p1.left;
      xs *= xs;
      ys = p2.top - p1.top;
      ys *= ys;
      return Math.sqrt(xs + ys);
    };

    /*
    		 # applies the radial effect to all ItemElements
    		 #
    */


    JJPackery.prototype.applyRadialGravityEffect = function() {
      var packeryCenter,
        _this = this;
      packeryCenter = this.getCenterPos(this.$packeryEl);
      return $.each(this.packery.getItemElements(), function(i, el) {
        return _this._applyRadialGravityEffectToElement(el, packeryCenter);
      });
    };

    /*
    		 # applies the radial effect to the given element
    		 #
    		 # @param HTMLElement el
    		 # @param point gravity center
    */


    JJPackery.prototype._applyRadialGravityEffectToElement = function(el, center) {
      var $el, ba, bc, elPos, expFactor, margins, third, xFactor, yFactor;
      $el = $(el);
      elPos = this.getCenterPos($el);
      third = {
        top: elPos.top,
        left: center.left
      };
      ba = third.top - center.top;
      bc = elPos.left - third.left;
      expFactor = this.getLineDistance(center, elPos) * this.factor / 200;
      yFactor = (ba / Math.abs(ba)) * expFactor * this.getLineDistance(center, third);
      xFactor = (bc / Math.abs(bc)) * expFactor * this.getLineDistance(elPos, third);
      margins = {
        'margin-top': yFactor,
        'margin-left': xFactor
      };
      $('> div', $el).css(margins);
      return true;
    };

    /*
    		 # init tooltip to all ItemElements
    		 #
    */


    JJPackery.prototype.initTooltips = function() {
      var _this = this;
      $.each(this.packery.getItemElements(), function(i, el) {
        return _this._initTooltip(el);
      });
      return false;
    };

    JJPackery.prototype._initTooltip = function(el) {
      var $el, $metaSection, api, foo, getMargin, hideTimeout, hideTip, marginOffset, mouseOutEl, mouseOutTip, showTimeout,
        _this = this;
      mouseOutEl = true;
      mouseOutTip = true;
      api = {};
      showTimeout = null;
      hideTimeout = null;
      hideTip = function() {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
        }
        return hideTimeout = setTimeout(function() {
          if (mouseOutEl && mouseOutTip) {
            $el.add(api.tooltip).off('mouseleave.tooltip');
            return api.hide();
          }
        }, 200);
      };
      $el = $(el);
      $metaSection = $('section[role=tooltip-content]', $el);
      marginOffset = -20;
      getMargin = function(api) {
        var $tooltip, margin;
        margin = marginOffset;
        $tooltip = $(api.tooltip);
        if ($tooltip.hasClass('qtip-pos-rb')) {
          console.log('inverse margin');
          margin *= -1;
        }
        return margin;
      };
      if ($metaSection.length) {
        foo = this;
        $el.qtip({
          content: {
            text: $metaSection.html()
          },
          show: {
            delay: 500,
            event: 'mouseenter',
            effect: function(api) {
              var _this = this;
              $el.addClass('has-tooltip');
              $(this).stop(true, true).css({
                'margin-left': getMargin(api)
              }).show().animate({
                'margin-left': 0,
                'opacity': 1
              }, 200);
              if (api.tooltip) {
                $(api.tooltip).one('mouseenter.tooltip', function() {
                  return mouseOutTip = false;
                });
              }
              return $el.add(api.tooltip).one('mouseleave.tooltip', function(e) {
                if ($(e.target).closest('.qtip').length) {
                  mouseOutTip = true;
                } else {
                  mouseOutEl = true;
                }
                return hideTip();
              });
            }
          },
          hide: {
            event: false,
            effect: function(api) {
              return $(this).stop(true, true).animate({
                'margin-left': getMargin(api),
                'opacity': 0
              }, 200, function() {
                $el.removeClass('has-tooltip');
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
            viewport: this.$container,
            adjust: {
              method: 'flip shift',
              x: 0,
              y: 10
            }
          }
        });
        api = $el.qtip('api');
        /*
        				@api.tooltip.on('mouseenter', =>
        					mouseOutTip = false
        				)
        				.on('mouseleave', =>
        					mouseOutTip = true
        					hideTip()
        				)
        */

        return $('> div > a', $el).on('mouseleave', function() {
          mouseOutEl = true;
          return hideTip();
        });
      }
    };

    JJPackery.prototype.update = function() {
      if (this.packery) {
        return this.packery.layout();
      }
    };

    JJPackery.prototype.destroy = function() {
      if (this.packery) {
        return this.packery.destroy();
      }
    };

    JJPackery.prototype.calc = function(rewind) {
      var $item, $stamps, buffer, dims, factor, i, imageSquare, item, itemSquare, items, limit, newWidth, square, stampSquare, width, _ref, _ref1, _results, _results1;
      limit = .7;
      buffer = .05;
      square = this.$window.height() * this.$window.width();
      itemSquare = 0;
      imageSquare = 0;
      stampSquare = 0;
      $stamps = this.$packeryEl.find('.stamp');
      $stamps.each(function(i, el) {
        var $item;
        $item = $(el);
        return stampSquare += $item.width() * $item.height();
      });
      _ref = this.packery.getItemElements();
      for (i in _ref) {
        item = _ref[i];
        $item = $(item);
        imageSquare += $item.width() * $item.height();
      }
      itemSquare = imageSquare + stampSquare;
      if (imageSquare / square > limit + buffer) {
        items = this.packery.getItemElements();
        _results = [];
        for (i in items) {
          item = items[i];
          $item = $(item);
          $item.width($item.width() * limit);
          _results.push($item.height($item.height * limit));
        }
        return _results;
      } else if (imageSquare / square < limit - buffer) {
        factor = square / imageSquare - buffer;
        _ref1 = this.packery.items;
        _results1 = [];
        for (i in _ref1) {
          item = _ref1[i];
          dims = item.initialDimensions;
          if (!dims) {
            continue;
          }
          $item = $(item.element);
          width = $item.width();
          newWidth = Math.min(dims.width, width * factor);
          _results1.push($item.width(newWidth));
        }
        return _results1;
      }
    };

    JJPackery.prototype.saveItemDimensions = function() {
      var i, item, _ref;
      _ref = this.packery.items;
      for (i in _ref) {
        item = _ref[i];
        item.initialDimensions = {
          width: item.rect.width,
          height: item.rect.height
        };
      }
      return false;
    };

    JJPackery.prototype.show = function() {
      this.packery.options.transitionDuration = this.transitionDuration;
      this.saveItemDimensions();
      this.setToCenter();
      this.initTooltips();
      this.applyRadialGravityEffect();
      return this.$container.addClass('loaded').addClass('has-gravity');
    };

    JJPackery.prototype.hideElement = function(el) {
      var item;
      if (this.packery) {
        item = this.packery.getItem(el);
        if (!item.isIgnored) {
          this.packery.ignore(el);
          item.remove();
          return this.packery.layout();
        }
      }
    };

    JJPackery.prototype.showElement = function(el) {
      var item;
      if (this.packery) {
        $(el).removeClass('hidden');
        item = this.packery.getItem(el);
        if (item.isIgnored) {
          this.packery.unignore(el);
          item.reveal();
          return this.packery.layout();
        }
      }
    };

    JJPackery.prototype.start = function() {
      var _this = this;
      return this.$container.imagesLoaded(function() {
        if (!_this.$packeryEl.length) {
          return;
        }
        _this.randomizeDimensions();
        _this.packery = new Packery(_this.$packeryEl[0], {
          containerStyle: null,
          itemSelector: _this.itemSelector,
          gutter: 0,
          stamped: '.stamp',
          transitionDuration: 0,
          isResizeBound: false,
          isInitLayout: false
        });
        _this.packery.maxY = _this.$window.height();
        _this.packery.on('layoutComplete', function() {
          _this.rendered++;
          if (_this.rendered === 1) {
            console.log('hidden trigger');
          } else {
            console.log('completed');
            _this.layoutIsComplete = true;
          }
          console.log('layout is complete');
          return false;
        });
        _this.$window.on('resize', function() {
          if (_this.resizeTimeout) {
            clearTimeout(_this.resizeTimeout);
          }
          return _this.resizeTimeout = setTimeout(_this.onResize, 200);
        });
        return _this.onResize();
      });
    };

    return JJPackery;

  })();
  JJPackeryMan = function() {
    console.error('JJPackeryMan is deprecated! Use "new JJPackeryClass()" instead!');
    return new JJPackery;
  };
  window.JJPackeryClass = JJPackery;
  return window.JJPackeryMan = JJPackeryMan;
})(jQuery);
