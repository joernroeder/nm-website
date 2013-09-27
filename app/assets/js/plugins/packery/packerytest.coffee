define [
		'jquery'
		'get-style-property/get-style-property'
		'packery/packery'
	], ($, getStyleProperty, Packery) ->

		'use strict'
		
		# ! --- CSS3 support (Packery Helpers) ------------------------------------

		transitionProperty = getStyleProperty 'transition'
		transformProperty = getStyleProperty 'transform'
		supportsCSS3 = transitionProperty && transformProperty
		is3d = !!getStyleProperty 'perspective'

		transitionEndEvent = {
			WebkitTransition: 'webkitTransitionEnd',
			MozTransition: 'transitionend',
			OTransition: 'otransitionend',
			transition: 'transitionend'
		}[ transitionProperty ]

		transformCSSProperty = {
			WebkitTransform: '-webkit-transform',
			MozTransform: '-moz-transform',
			OTransform: '-o-transform',
			transform: 'transform'
		}[ transformProperty ]

		# transform translate function
		translate = (if is3d then (x, y) ->
			"translate3d( " + x + "px, " + y + "px, 0)"
		else (x, y) ->
			"translate( " + x + "px, " + y + "px)"
		)


		# ! --- Packery Overrides -------------------------------------------------

		###
		 # layout a collection of item elements
		 #
		 # @param {Array} items - array of Packery.Items
		 # @param {Boolean} isInstant - disable transitions for setting item position
		###
		packery_layoutItems = Packery.prototype.layoutItems

		Packery::layoutItems = (items, isInstant) ->
			this.maxY = 0
			packery_layoutItems.call @, items, isInstant
		

		#packery_item_remove = Packery.Item.prototype.remove
		Packery.Item::removeElem = ->
			$(@.element).addClass 'hidden'
			false

		###
		 # get item elements to be used in layout
		 #
		 # @param {Array or NodeList or HTMLElement} elems
		 # @returns {Array} items - collection of new Packery Items
		###
		Packery::_getItems = (elems) ->
			itemElems = this._filterFindItemElements elems

			# create new Packery Items for collection
			items = [];
			for elem in itemElems
				# update Item to Packery.Item to use the custom overrides
				item = new Packery.Item elem, this
				items.push item

			return items;


		# ! --- JJPackery ---------------------------------------------------------

		###
		 #
		###
		class JJPackery

			###
			 # construct variables
			###
			members: ->
				@$window = $()
				@$container = $()
				@$sizing = $()
				@$packeryEl = $()
		
				@packery = null
				@resizeTimeout = null
				
				@updateLayout = true
				@fitInWindow = true
				@rendered = 0

				@onResizeLayout = false
				@layoutIsComplete = false
				@started = false

				@itemDimensions = []

				@itemSelector = '.packery-item'
				@transitionDuration = '.4s'
				

				# radial effect
				@factor = .3

				# tooltip api
				#@api = {}


			constructor: ->
				console.log 'JJPackery'
				@members()

				@init()
				@start()

			randomizeDimensions: ->
				max = 1
				min = .5
				floor = 10

				$(@itemSelector, @$packeryEl).each (i, el) ->
					$el = $ el
					return if not $el.hasClass 'resizable'

					w = $el.width()
					h = $el.height()
					factor = Math.min(max, Math.max(min, Math.random() * (max+min)))
					console.log factor
					$el.width Math.floor (w * factor / floor) * floor
					$el.height Math.floor (h * factor / floor) * floor

			###
			 # fill variables
			###
			init: ->
				@$window = $ window
				@$container = $ '.packery-wrapper'
				@$sizing = $ '.packery-test', @$container
				@$packeryEl = $ '.packery', @$container

				if @fitInWindow
					@$packeryEl
						.addClass('fit-in-window')
						.css('max-height', @$window.height())


			calcAndLayout: ->
				if @packery and @updateLayout
					console.log 'calc and relayout'
					@calc() if @fitInWindow
					@packery.layout()

			setToCenter: ->
				winHeight = @$window.height()
				elHeight = @$packeryEl.height()

				if elHeight <= winHeight
					@$packeryEl.css 'top', Math.floor((winHeight - elHeight) / 2)
				else
					@$packeryEl.css 'top', 0

			hiddenLayout: (duration) ->
				@onResizeLayout = true
				#@packery.options.transitionDuration = 0
				@packery.layout()
				#@packery.options.transitionDuration = duration
				@onResizeLayout = false

			###
			 # on resize handler
			 #
			###
			onResize: =>
				if @fitInWindow
					@calc()
					@$packeryEl.css 'max-height', @$window.height()


				if not @layoutIsComplete
					#newHeight = @$window.height()
					#@$container.height newHeight
					console.log 'not layoutIsComplete'
					@layoutIsComplete = true
					@packery.layout()
				
				@packery.layout()
				@setToCenter()
				#@$packeryEl[0].style.height = 0;

				if @layoutIsComplete and not @started
					console.log 'started'
					@started = true
					@show()

			###
			 # returns the centered position of the given element
			 #
			 # @return [object] position
			###
			getCenterPos: ($el) ->
				elPos = $el.offset()
				elCenter = 
					top: elPos.top + $el.height() / 2
					left: elPos.left + $el.width() / 2

			###
			 # returns the distance between two points
			 #
			 # @param p1 
			 # @param p2
			 #
			 # @return Number
			###
			getLineDistance: (p1, p2) ->
				xs = ys = 0

				xs = p2.left - p1.left
				xs *= xs
				ys = p2.top - p1.top
				ys *= ys

				Math.sqrt xs + ys

			###
			 # applies the radial effect to all ItemElements
			 #
			###
			applyRadialGravityEffect: ->
				packeryCenter = @getCenterPos @$packeryEl

				$.each @packery.getItemElements(), (i, el) =>
					@_applyRadialGravityEffectToElement el, packeryCenter

			###
			 # applies the radial effect to the given element
			 #
			 # @param HTMLElement el
			 # @param point gravity center
			###
			_applyRadialGravityEffectToElement: (el, center) ->
				$el = $ el
				elPos = @getCenterPos $el

				third = 
					top: elPos.top
					left: center.left

				ba = third.top - center.top
				bc = elPos.left - third.left

				expFactor = @getLineDistance(center, elPos) * @factor / 200

				yFactor = Math.floor((ba / Math.abs(ba)) * expFactor * @getLineDistance(center, third))
				xFactor = Math.floor((bc / Math.abs(bc)) * expFactor * @getLineDistance(elPos, third))

				margins = 
					'margin-top': yFactor
					'margin-left': xFactor

				$('> div', $el).css margins
				true

			###
			 # init tooltip to all ItemElements
			 #
			###
			initTooltips: ->
				#console.log 'init tooltips'
				$.each @packery.getItemElements(), (i, el) =>
					@_initTooltip el

				false

			#getApi: ->
			#	@api or {}

			_initTooltip: (el) ->
				mouseOutEl = true
				mouseOutTip = true

				api = {}

				showTimeout = null
				hideTimeout = null

				hideTip = =>
					if hideTimeout
						clearTimeout hideTimeout

					hideTimeout = setTimeout =>
						if mouseOutEl and mouseOutTip
							$el.add(api.tooltip).off 'mouseleave.tooltip'
							api.hide()
					, 200

				$el = $ el
				$metaSection = $ 'section[role=tooltip-content]', $el

				marginOffset = -20
				startOffset = 10

				getMargin = (api) ->
					margin = marginOffset
					
					if $(api.tooltip).hasClass('qtip-pos-rb')
						margin *= -1

					console.log margin
					Math.floor margin

				getStartOffset = (api) ->
					offset = startOffset
					if $(api.tooltip).hasClass('qtip-pos-rb')
						console.log 'is invert'
						offset *= -1

					console.log offset
					Math.floor offset


				if $metaSection.length
					foo = @
					$el
					.qtip
						#prerender: true
						content:
							text: $metaSection.html()
						show:
							delay: 500
							event: 'mouseenter'
							effect: (api) ->
								$el.addClass 'has-tooltip'
								debugger
								$(@)
									.stop(true, true)
									.css
										'margin-left'	: getMargin api
									.show()
									.animate
										'margin-left': getStartOffset api
										'opacity': 1
									, 200

								if api.tooltip
									$(api.tooltip).one 'mouseenter.tooltip', =>
										mouseOutTip = false

								$el.add(api.tooltip).one 'mouseleave.tooltip', (e) =>
									if $(e.target).closest('.qtip').length
										mouseOutTip = true
									else 
										mouseOutEl = true

									hideTip()


							
							#event: false
							#ready: true

						hide: 
							event: false
							effect: (api) ->
								$(@)
									.stop(true, true)
									.animate
										'margin-left': getMargin api
										'opacity': 0
									, 200, () ->
										$el.removeClass 'has-tooltip'
										$(@).hide()
						###
						events:
							show: (e, api) ->
								window.currentTooltip = 
									tip			: @
									target		: api.target
									targetId	: $(api.target).attr 'data-gravity-item'
									api			: api

							hide: (e, api) ->
								window.currentTooltip = {}
						###

						position:
							at: "right bottom"
							my: "left bottom"
							viewport: @$container
							adjust:
								method: 'flip shift'
								x: 0
								y: 10

					api = $el.qtip 'api'

					###
					@api.tooltip.on('mouseenter', =>
						mouseOutTip = false
					)
					.on('mouseleave', =>
						mouseOutTip = true
						hideTip()
					)
					###

					$('> div > a', $el).on('mouseleave', =>
						mouseOutEl = true
						hideTip()
					)


			# ---------------

			update: ->
				@packery.layout() if @packery

			destroy: ->
				@packery.destroy() if @packery

			calc: (rewind) ->
				limit = .7
				buffer = .05

				square = @$window.height() * @$window.width()

				itemSquare = 0
				imageSquare = 0
				stampSquare = 0

				$stamps = @$packeryEl.find '.stamp'
				$stamps.each (i, el) ->
					$item = $ el

					stampSquare += $item.width() * $item.height()

				for i, item of @packery.getItemElements()
					$item = $ item

					imageSquare += $item.width() * $item.height()

				itemSquare = imageSquare + stampSquare
				
				#console.log square
				#console.log itemSquare

				#console.log itemSquare / square

				if imageSquare / square > limit + buffer
					#console.log 'more than ' + limit + '%'
					items = @packery.getItemElements()
					#console.log items.length
					for i, item of items
						$item = $ item

						$item.width $item.width() * limit
						$item.height $item.height * limit

					#$stamps.each (i, el) ->
					#	$item = $ el
					#	$item.width $item.width() * limit
					#	$item.height $item.height * limit
				else if imageSquare / square < limit - buffer
					factor = square / imageSquare - buffer
					#console.log factor
					for i, item of @packery.items
						dims = item.initialDimensions
						
						continue if not dims

						$item = $ item.element
						width = $item.width()

						#console.log width * factor
						newWidth = Math.min dims.width, width * factor

						$item.width newWidth

			#	if not rewind
			#		@calc true

			saveItemDimensions: ->
				#@itemDimensions

				for i, item of @packery.items
					item.initialDimensions = 
						width: item.rect.width
						height: item.rect.height

					#@packery.items[i]

				false


			show: ->
				@packery.options.transitionDuration = @transitionDuration
				@saveItemDimensions()
				@setToCenter()
				@initTooltips()
				@applyRadialGravityEffect()
				@$container.addClass('loaded').addClass 'has-gravity'


			# ! --- filter elements ---------------------------
			
			hideElement: (el) ->
				if @packery
					item = @packery.getItem el

					if not item.isIgnored
						@packery.ignore el
						item.remove()
						@packery.layout()

			showElement: (el) ->
				if @packery
					$(el).removeClass 'hidden'

					item = @packery.getItem el
					if item.isIgnored
						@packery.unignore el
						item.reveal()
						@packery.layout()
					

			# ! --- implementation ----------------------------
			start: ->
				console.log 'start method'
				@$container.imagesLoaded =>
					if not @$packeryEl.length then return

					@randomizeDimensions()

					@packery = new Packery @$packeryEl[0],
						containerStyle: null
						itemSelector: @itemSelector
						gutter: 0
						stamped: $('.stamp, .badge')
						#columnWidth: 20
						#rowHeight: 20
						transitionDuration: 0
						isResizeBound: false
						isInitLayout: false

					@packery.maxY = @$window.height()
					
					@packery.on 'layoutComplete', =>
						@rendered++
						if @rendered is 1
							console.log 'hidden trigger'
							#@packery.layout()
							#@packery.options.transitionDuration = @transitionDuration
						else
							#console.log 'completed'
							@layoutIsComplete = true
						#if @rendered is 2

						#else if not @$container.hasClass('loaded') and @rendered is 2
						#	console.log 'renderd 2 -> not .loaded'
						#	# fix element positions.
						#	# @todo vielleicht hängt das mit dem nachladen der bilder zusammen...
						#	@$window.trigger 'resize'
						#else if @rendered is 3
						#	@packery.options.transitionDuration = @transitionDuration
						#	@setToCenter()
						#	@initTooltips()
						#	@applyRadialGravityEffect()
		
						#	@$container.addClass('loaded').addClass 'has-gravity'
						#	console.log 'loaded'

		
						#console.log 'layout is complete'
						false
		
					#@rendered++

					@$window.on 'resize', =>
						clearTimeout @resizeTimeout if @resizeTimeout
						@resizeTimeout = setTimeout @onResize, 200

					@onResize()
					
					#@packery.layout()
					
					# initial trigger
					#@onResize()
		
					#@packery.layoutItems [], true
					#@packery.layout()


		JJPackeryMan = -> 
			console.error 'JJPackeryMan/JJPackeryClass is deprecated! Use "new JJPackery()" instead!'
			new JJPackery

		# reveal
		window.JJPackeryClass = JJPackery
		window.JJPackeryMan = JJPackeryMan

		return JJPackery