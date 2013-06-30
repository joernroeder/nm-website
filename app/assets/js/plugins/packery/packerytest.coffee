"use strict"

do ($ = jQuery) ->

	###
	layout a collection of item elements
	@param {Array} items - array of Packery.Items
	@param {Boolean} isInstant - disable transitions for setting item position
	###
	packery_layoutItems = Packery.prototype.layoutItems

	Packery::layoutItems = (items, isInstant) ->
		this.maxY = 0
		packery_layoutItems.call @, items, isInstant

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

			@transitionDuration = '.4s'
			

			# radial effect
			@factor = .3

			# tooltip api
			@api = {}


		constructor: ->
			console.log 'JJPackery'
			@members()

			@init()
			@start()

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

			yFactor = (ba / Math.abs(ba)) * expFactor * @getLineDistance(center, third)
			xFactor = (bc / Math.abs(bc)) * expFactor * @getLineDistance(elPos, third)

			margins = 
				'margin-top': yFactor
				'margin-left': xFactor

			$el.css margins
			true

		###
		 # init tooltip to all ItemElements
		 #
		###
		initTooltips: ->
			console.log 'init tooltips'
			$.each @packery.getItemElements(), (i, el) =>
				@_initTooltip el

			false

		getApi: ->
			@api or {}

		_initTooltip: (el) ->
			$el = $ el
			$metaSection = $ 'section[role=tooltip-content]', $el

			marginOffset = -20

			getMargin = (api) ->
				margin = marginOffset
				$tooltip = $ api.tooltip

				if $tooltip.hasClass('qtip-pos-rb')
					console.log 'inverse margin'
					margin *= -1

				margin


			if $metaSection.length
				$el
				.qtip
					content:
						text: $metaSection.html()
					show:
						event: 'mouseenter'
						
						effect: (api) ->										
							$el.addClass 'has-tooltip'
							$(@)
								.stop(true, true)
								.css
									'margin-left': getMargin api
								.show()
								.animate
									'margin-left': 0
									'opacity': 1
								, 200
						
						#effect: false
						#ready: true

					hide: 
						event: 'mouseleave'
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

				@api = $el.qtip 'api'


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
			
			console.log square
			console.log itemSquare

			console.log itemSquare / square

			if imageSquare / square > limit + buffer
				console.log 'more than ' + limit + '%'
				items = @packery.getItemElements()
				console.log items.length
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
				console.log factor
				for i, item of @packery.items
					dims = item.initialDimensions
					
					continue if not dims

					$item = $ item.element
					width = $item.width()

					console.log width * factor
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
			console.log 'show'
			@packery.options.transitionDuration = @transitionDuration
			@saveItemDimensions()
			@setToCenter()
			@initTooltips()
			@applyRadialGravityEffect()
			@$container.addClass('loaded').addClass 'has-gravity'
				

		# ! --- implementation ----------------------
		start: ->
			@$container.imagesLoaded =>
				@packery = new Packery @$packeryEl[0],
					containerStyle: null
					itemSelector: '.packery-item'
					gutter: 0
					stamped: '.stamp'
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

	
					console.log 'layout is complete'
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


	JJPackeryMan = -> new JJPackery

	# reveal
	window.JJPackeryClass = JJPackery
	window.JJPackeryMan = JJPackeryMan