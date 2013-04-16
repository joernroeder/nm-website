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

 - - - - - - - - - - - - - - - - - - - - - - - - -
 
 Based on "Zepto Tooltip"
 https://github.com/ptech/zepto-tooltip

 SHA: 0149aaff71f65ffcf348ffdec5253e6b9b1178a2
 Last Commit ID: 0149aaff71
*/
(function($, win) {
  'use strict';  return $.extend($.fn, {
    RadialGravityTooltip: function() {
      var $container, $target, $tooltip, autoBounds, calc, init, options, remove;

      $container = $(this).closest('.gravity');
      $target = null;
      $tooltip = null;
      options = {
        offset: 0
      };
      autoBounds = function(margin, prefer) {
        var boundLeft, boundTop, dir;

        dir = {
          ns: prefer[0],
          ew: (prefer.length > 1 ? prefer[1] : false)
        };
        boundTop = $(document).scrollTop() + margin;
        boundLeft = $(document).scrollLeft() + margin;
        if ($target.offset().top < boundTop) {
          dir.ns = 'n';
        }
        if ($target.offset().left < boundLeft) {
          dir.ew = 'w';
        }
        if ($(window).width() + $(document).scrollLeft() - $target.offset().left < margin) {
          dir.ew = 'e';
        }
        if ($(window).height() + $(document).scrollTop() - $target.offset().top < margin) {
          dir.ns = 's';
        }
        return dir.ns + (dir.ew ? dir.ew : '');
      };
      calc = function() {
        var actualHeight, actualWidth, gravity, pos, tp;

        $tooltip.remove().css({
          top: 0,
          left: 0,
          visibility: 'hidden',
          display: 'block'
        }).prependTo(document.body);
        pos = $.extend({}, $target.offset(), {
          width: $target[0].offsetWidth,
          height: $target[0].offsetHeight
        });
        actualWidth = $tooltip[0].offsetWidth;
        actualHeight = $tooltip[0].offsetHeight;
        gravity = autoBounds(10, 'we');
        console.log(gravity);
        switch (gravity.charAt(0)) {
          case 'n':
            tp = {
              top: pos.top + pos.height + options.offset,
              left: pos.left + pos.width / 2 - actualWidth / 2
            };
            break;
          case 's':
            tp = {
              top: pos.top - actualHeight - options.offset,
              left: pos.left + pos.width / 2 - actualWidth / 2
            };
            break;
          case 'e':
            tp = {
              top: pos.top + pos.height / 2 - actualHeight / 2,
              left: pos.left - actualWidth - options.offset
            };
            break;
          case 'w':
            tp = {
              top: pos.top + pos.height / 2 - actualHeight / 2,
              left: pos.left + pos.width + options.offset
            };
        }
        if (gravity.length === 2) {
          if (gravity.charAt(1) === 'w') {
            tp.left = pos.left + pos.width / 2 - 15;
          } else {
            tp.left = pos.left + pos.width / 2 - actualWidth + 15;
          }
        }
        return tp;
      };
      /*
      		update = ->
      			if $container.width() < $tooltip.width() * 1.5
      				$tooltip.css 'max-width', $container.width() / 2
      			else
      				$tooltip.css 'max-width', 340
      
      			pos_left = $target.offset().left + ($target.width() / 2) - ($tooltip.width() / 2)
      			pos_top = $target.offset().top - $tooltip.height() - 20
      
      			if pos_left < 0
      				pos_left = $target.offset().left + $target.width() / 2 - 20
      				$tooltip.addClass 'left'
      			else
      				$tooltip.removeClass 'left'
      		
      
      			if pos_left + $tooltip.width() > $container.width()
      				pos_left = $target.offset().left - $tooltip.width() + $target.width() / 2 + 20
      				$tooltip.addClass 'right'
      			else
      				$tooltip.removeClass 'right'
      
      			if pos_top < 0
      				pos_top = $target.offset().top + $target.height()
      				$tooltip.addClass 'top'
      			else
      				$tooltip.removeClass 'top'
      
      			return {
      				top: pos_top
      				left: pos_left
      			}
      */

      init = function() {
        var pos;

        pos = calc();
        return $tooltip.css({
          left: pos.left,
          top: pos.top,
          visibility: 'visible'
        }).animate({
          opacity: 1
        }, 50);
      };
      remove = function() {
        if (!$tooltip) {
          return;
        }
        $tooltip.animate({
          opacity: 0
        }, 50, 'linear', function() {
          return $(this).remove();
        });
        return $tooltip = null;
      };
      $container.on('gravity.update', function() {
        return console.log('gravity triggered update');
      });
      this.on('mouseover', function() {
        $target = $(this);
        $tooltip = $('<div class="tooltip"></div>');
        $tooltip.css({
          visibility: 'hidden',
          opacity: 0
        }).html('foo bar').appendTo('body');
        init();
        $container.resize(init);
        $target.bind('mouseout', remove);
        return $tooltip.bind('click', remove);
      });
      return this;
    }
  });
})(this.jQuery || this.Zepto, this);
