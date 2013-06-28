"use strict"

do ($ = jQuery) ->
	$window = $ window
	$container = $ '.packery-wrapper'
	$sizing = $ '.packery-test', $container
	$packeryEl = $ '.packery', $container
	resizeTimeout = null
	onResize = ->
		newHeight = $window.height()
		$container.height newHeight
		$packeryEl.width Math.floor($container.width() / 3) * 2

		packery.layout()

		elHeight = $packeryEl.height()

		if elHeight < newHeight
			$packeryEl.css 'top', Math.floor((newHeight - elHeight) / 2)
		else
			$packeryEl.css 'top', 0

	#$packeryEl.height $window.height()

	packery = new Packery $packeryEl[0],
		containerStyle: null
		itemSelector: '.packery-item'
		gutter: 0
		stamped: '.stamp'
		#columnWidth: 20
		#rowHeight: 20
		isResizeBound: false

	$window.on 'resize', ->
		clearTimeout resizeTimeout if resizeTimeout
		resizeTimeout = setTimeout onResize, 100

	# initial trigger
	onResize()