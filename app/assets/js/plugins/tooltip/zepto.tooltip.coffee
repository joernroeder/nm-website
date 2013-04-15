###

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
###

(($, win) ->
	'use strict'

	$.extend $.fn, RadialGravityTooltip: ->

		$container = $(@).closest '.gravity'
		$target = null
		$tooltip = null

		options = 
			offset: 0

		# got this little snippet from https://github.com/jaz303/tipsy/blob/master/src/javascripts/jquery.tipsy.js
		autoBounds = (margin, prefer) ->
			dir =
				ns: prefer[0]
				ew: (if prefer.length > 1 then prefer[1] else false)

			boundTop = $(document).scrollTop() + margin
			boundLeft = $(document).scrollLeft() + margin
			#$this = $(this)

			if $target.offset().top < boundTop then dir.ns = 'n'
			if $target.offset().left < boundLeft then dir.ew = 'w'

			if $(window).width() + $(document).scrollLeft() - $target.offset().left < margin then dir.ew = 'e'
			if $(window).height() + $(document).scrollTop() - $target.offset().top < margin then dir.ns = 's'

			dir.ns + (if dir.ew then dir.ew else '')

		calc = ->
			$tooltip
				.remove()
				.css({
					top			: 0
					left		: 0
					visibility	: 'hidden'
					display		: 'block'
				})
				.prependTo document.body
				
			pos = $.extend {}, $target.offset(), {
				width	: $target[0].offsetWidth,
				height	: $target[0].offsetHeight
			}
			
			actualWidth = $tooltip[0].offsetWidth
			actualHeight = $tooltip[0].offsetHeight
			gravity = autoBounds 10, 'wn'
			console.log gravity

			#gravity = maybeCall(this.options.gravity, this.$element[0]);

			switch gravity.charAt(0)
				when 'n'
					tp = 
						top		: pos.top + pos.height + options.offset
						left	: pos.left + pos.width / 2 - actualWidth / 2
				when 's'
					tp = 
						top		: pos.top - actualHeight - options.offset
						left	: pos.left + pos.width / 2 - actualWidth / 2
				when 'e'
					tp = 
						top		: pos.top + pos.height / 2 - actualHeight / 2
						left	: pos.left - actualWidth - options.offset
				when 'w'
					tp = 
						top		: pos.top + pos.height / 2 - actualHeight / 2
						left	: pos.left + pos.width + options.offset

			if gravity.length is 2
				if gravity.charAt(1) is 'w'
					tp.left = pos.left + pos.width / 2 - 15
				else
					tp.left = pos.left + pos.width / 2 - actualWidth + 15

			tp

		###
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
		###

		init = ->
			pos = calc()
			$tooltip.css({
				left		: pos.left
				top			: pos.top
				visibility	: 'visible'
			}).animate({
				opacity		: 1
			}, 50)

		remove = ->
			if not $tooltip then return

			$tooltip.animate({
				opacity		: 0
			}, 50, 'linear', ->
				$(@).remove()
			)

			$tooltip = null

		$container.on 'gravity.update', ->
			console.log 'gravity triggered update'

		@.on 'mouseover', ->
			$target = $ @
			$tooltip = $ '<div class="tooltip"></div>'

			$tooltip.css({
				visibility: 'hidden'
				opacity: 0
			}).html('foo bar').appendTo 'body'

			init()
			$container.resize init

			$target.bind 'mouseout', remove
			$tooltip.bind 'click', remove


		@ # allow chaining


) this.jQuery or this.Zepto, this