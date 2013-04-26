do ($ = jQuery) ->
	
	resizeEvents = {}

	# Resize Handler
	
	$(window).on 'resize', ->
		for key, callback of resizeEvents
			if callback and $.isFunction callback
				callback()

	$.addOnWindowResize = (key, callback) ->
		if $.isFunction callback
			resizeEvents[key] = callback

	$.removeOnWindowResize = (key) ->
		if resizeEvents[key]
			delete resizeEvents[key]


	# ! --- Resize iframes ---
	
	resizeIframes = ->
		$iframes = $ 'iframe', 'article.portfolio-detail'

		console.log $iframes

		if not $iframes.length then return

		$iframes.each (i, iframe) ->
			$iframe = $ iframe

			attrWidth = $iframe.attr 'width'
			attrHeight = $iframe.attr 'height'

			if not attrWidth or not attrHeight then return

			width = $iframe.width()
			console.log width
			scaleFactor = width / attrWidth

			$iframe.height attrHeight * scaleFactor
			console.log $iframe.height()


	$(document).on 'portfoliodetail:rendered', resizeIframes
	$.addOnWindowResize 'iframe', resizeIframes




