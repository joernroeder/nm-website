"use strict"

do ($ = jQuery) ->

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
			@rendered = 0
	
			@factor = .3

			@api = {}


		constructor: ->
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

		###
		 # on resize handler
		 #
		###
		onResize: =>
			newHeight = @$window.height()
			@$container.height newHeight
			@$packeryEl.width Math.floor(@$container.width() / 3) * 2

			@calc()

			@packery.layout() if @packery and @updateLayout # @todo: remove @updateLayout

			elHeight = @$packeryEl.height()

			if elHeight <= newHeight
				@$packeryEl.css 'top', Math.floor((newHeight - elHeight) / 2)
			else
				@$packeryEl.css 'top', 0

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
			$.each @packery.getItemElements(), (i, el) =>
				@_initTooltip el

		getApi: ->
			@api or {}

		_initTooltip: (el) ->
			console.log 'init tooltip %O', el
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

		calc: ->
			limit = .9

			square = @$window.height() * @$window.width()

			itemSquare = 0

			$stamps = @$packeryEl.find '.stamp'
			$stamps.each (i, el) ->
				$item = $ el

				itemSquare += $item.width() * $item.height()

			for i, item of @packery.getItemElements()
				$item = $ item

				itemSquare += $item.width() * $item.height()

			if itemSquare / square > limit
				for i, item of @packery.getItemElements()
					$item = $ item

					$item.width $item.width() * limit
					$item.height $item.height * limit

				$stamps.each (i, el) ->
					$item = $ el
					$item.width $item.width() * limit
					$item.height $item.height * limit
				

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
					#transitionDuration: 0
					isResizeBound: false
					isInitLayout: false
	
				@packery.on 'layoutComplete', =>
					@rendered++
					if @rendered is 1
						console.log 'hidden trigger'
					else if not @$container.hasClass('loaded') and @rendered is 2
						console.log 'renderd 2 -> not .loaded'
						# fix element positions.
						# @todo vielleicht hängt das mit dem nachladen der bilder zusammen...
						@$window.trigger 'resize'
					else if @rendered is 3
						@initTooltips()
						@applyRadialGravityEffect()
	
						@$container.addClass('loaded').addClass 'has-gravity'
						console.log 'loaded'
	
					console.log 'layout is complete'
					false
	
				# initial trigger
				@onResize()
	
				#@packery.layoutItems [], true
				@packery.layout()
	
				@$window.on 'resize', =>
					clearTimeout resizeTimeout if resizeTimeout
					resizeTimeout = setTimeout @onResize, 100


	JJPackeryMan = -> new JJPackery

	# reveal
	window.JJPackeryClass = JJPackery
	window.JJPackeryMan = JJPackeryMan