// Generated by CoffeeScript 1.6.2
"use strict";(function($) {
  var JJPackeryMan;

  JJPackeryMan = function() {
    var $container, $packeryEl, $sizing, $window, applyRadialGravityEffect, applyRadialGravityEffectToElement, factor, getCenterPos, getLineDistance, onResize, packery, rendered, resizeTimeout, updateLayout,
      _this = this;

    $window = $(window);
    $container = $('.packery-wrapper');
    $sizing = $('.packery-test', $container);
    $packeryEl = $('.packery', $container);
    packery = null;
    resizeTimeout = null;
    updateLayout = true;
    rendered = 0;
    factor = .3;
    onResize = function() {
      var elHeight, newHeight;

      newHeight = $window.height();
      $container.height(newHeight);
      $packeryEl.width(Math.floor($container.width() / 3) * 2);
      if (packery && updateLayout) {
        packery.layout();
      }
      elHeight = $packeryEl.height();
      if (elHeight <= newHeight) {
        return $packeryEl.css('top', Math.floor((newHeight - elHeight) / 2));
      } else {
        return $packeryEl.css('top', 0);
      }
    };
    getCenterPos = function($el) {
      var elCenter, elPos;

      elPos = $el.offset();
      return elCenter = {
        top: elPos.top + $el.height() / 2,
        left: elPos.left + $el.width() / 2
      };
    };
    getLineDistance = function(p1, p2) {
      var xs, ys;

      xs = ys = 0;
      xs = p2.left - p1.left;
      xs *= xs;
      ys = p2.top - p1.top;
      ys *= ys;
      return Math.sqrt(xs + ys);
    };
    applyRadialGravityEffect = function() {
      var packeryCenter;

      packeryCenter = getCenterPos($packeryEl);
      return $.each(packery.getItemElements(), function(i, el) {
        return applyRadialGravityEffectToElement(el, packeryCenter);
      });
    };
    applyRadialGravityEffectToElement = function(el, center) {
      var $el, ba, bc, elPos, expFactor, margins, third, xFactor, yFactor;

      $el = $(el);
      elPos = getCenterPos($el);
      third = {
        top: elPos.top,
        left: center.left
      };
      ba = third.top - center.top;
      bc = elPos.left - third.left;
      expFactor = getLineDistance(center, elPos) * factor / 200;
      yFactor = (ba / Math.abs(ba)) * expFactor * getLineDistance(center, third);
      xFactor = (bc / Math.abs(bc)) * expFactor * getLineDistance(elPos, third);
      margins = {
        'margin-top': yFactor,
        'margin-left': xFactor
      };
      $el.css(margins);
      return true;
    };
    return $container.imagesLoaded(function() {
      packery = new Packery($packeryEl[0], {
        containerStyle: null,
        itemSelector: '.packery-item',
        gutter: 0,
        stamped: '.stamp',
        isResizeBound: false,
        isInitLayout: false
      });
      packery.on('layoutComplete', function() {
        rendered++;
        if (rendered === 1) {
          console.log('hidden trigger');
        } else if (!$container.hasClass('loaded') && rendered === 2) {
          console.log('renderd 2 -> not .loaded');
          $(window).trigger('resize');
        } else if (rendered === 3) {
          applyRadialGravityEffect();
          $container.addClass('loaded').addClass('has-gravity');
          console.log('loaded');
        }
        console.log('layout is complete');
        return false;
      });
      onResize();
      packery.layout();
      return $window.on('resize', function() {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        return resizeTimeout = setTimeout(onResize, 100);
      });
    });
  };
  return window.JJPackeryMan = JJPackeryMan;
})(jQuery);