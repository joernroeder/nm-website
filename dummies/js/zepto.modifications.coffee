(($, win) ->
	'use strict'

	['Left', 'Top'].forEach (name, i) ->
		method = 'scroll' + name

		isWindow = (obj) ->
				obj and typeof obj is 'object' and 'setInterval' of obj

		getWindow = (elem) ->
			if isWindow(elem) then elem else (if elem.nodeType is 9 then elem.defaultView or elem.parentWindow else false)
		
		$.fn[method] = (val) ->
			if val is undefined
				elem = this[0]

				if not elem then return null

				win = getWindow elem

				# Return the scroll offset
				return (if win then (if ('pageXOffset' of win) then win[(if i then 'pageYOffset' else 'pageXOffset')] else win.document.documentElement[method] or win.document.body[method]) else elem[method])

			# Set the scroll offset
			@.each () ->
				win = getWindow @

				if win
					xCoord = if not i then val else $(win).scrollLeft()
					yCoord = if i then val else $(win).scrollTop()
					win.scrollTo xCoord, yCoord
				else
					this[method] = val
) this.Zepto, this