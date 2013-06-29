"use strict"

do ($ = jQuery) ->

	class JJPackery

		members: ->
			@$window = $ window
			@$container = $ '.packery-wrapper'
			@$sizing = $ '.packery-test', @$container
			@$packeryEl = $ '.packery', @$container
	
			@packery = null
			@resizeTimeout = null
			
			@updateLayout = true
			@rendered = 0
	
			@factor = .3


		constructor: ->
			@members()

			@start()

		onResize: =>
			newHeight = @$window.height()
			@$container.height newHeight
			@$packeryEl.width Math.floor(@$container.width() / 3) * 2

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
		 #
		###
		getLineDistance: (p1, p2) ->
			xs = ys = 0

			xs = p2.left - p1.left
			xs *= xs
			ys = p2.top - p1.top
			ys *= ys

			Math.sqrt xs + ys


		applyRadialGravityEffect: ->
			packeryCenter = @getCenterPos @$packeryEl

			$.each @packery.getItemElements(), (i, el) =>
				@_applyRadialGravityEffectToElement el, packeryCenter


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
						@applyRadialGravityEffect()
	
						@$container.addClass('loaded').addClass 'has-gravity'
						console.log 'loaded'
	
					console.log 'layout is complete'
					false
	
				# initial trigger
				@onResize()
	
				@packery.layout()
	
				@$window.on 'resize', =>
					clearTimeout resizeTimeout if resizeTimeout
					resizeTimeout = setTimeout @onResize, 100


	JJPackeryMan = -> new JJPackery

	# reveal
	window.JJPackeryClass = JJPackery
	window.JJPackeryMan = JJPackeryMan