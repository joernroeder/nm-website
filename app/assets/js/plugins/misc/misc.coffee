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


	# ! --- Methods ---
	
	###
	 # @example
	 #	resizeParentOrChilds([
	 #		# resize .group-image > img to .group-image.width()
	 #		{
	 #			parent: '.group-image'
	 #			child: 'img'
	 #			resize: 'child'
	 #		},
	 #		# resize .statement to (.statement > p).width()
	 #		{
	 #			parent: '.statement'
	 #			child: 'p'
	 #			resize: 'parent'
	 #		}	 
	 #	]);
	 #
	###
	resizeParentOrChilds = (els) ->

		if not els then return

		$.each els, (i, el) ->
			$parent = $ el.parent
			$child = $ el.child, $parent

			if not $child.length then return
			#if not $child.length or $child.hasClass 'loaded' then return

			parentWidth = $parent.width()
			parentHeight = $parent.height()

			childWidth = $child.outerWidth true

			if $child.length > 1
				childHeight = 0
				$child.each ->
					childHeight += $(@).outerHeight true
			else
				childHeight = $child.height()

			if el.resize is 'child'
				$child.height parentWidth / childWidth * childHeight 

			else if el.resize is 'parent'
				$parent.height childHeight



	# ! --- Resize iframes ---
	
	resizeIframes = ->
		$iframes = $ 'iframe', 'article.portfolio-detail'

		if not $iframes.length then return

		$iframes.each (i, iframe) ->
			$iframe = $ iframe

			attrWidth = $iframe.attr 'width'
			attrHeight = $iframe.attr 'height'

			if not attrWidth or not attrHeight then return

			width = $iframe.width()
			scaleFactor = width / attrWidth

			$iframe.height attrHeight * scaleFactor


	$(document).on 'portfoliodetail:rendered', resizeIframes
	$.addOnWindowResize 'iframe', resizeIframes


	# ! --- About ---
	
	$(document).on 'about:rendered', ->
		resizeParentOrChilds [
			{
				parent: '.group-image'
				child: 'img'
				resize: 'child'
			}
			{
				parent: '.statement'
				child: 'p'
				resize: 'parent'
			}
		]






