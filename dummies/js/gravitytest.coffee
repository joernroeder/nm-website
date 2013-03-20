"use strict"
#Framework = if '__proto__' of {} then Zepto else jQuery

do ($ = Zepto) ->

	$('.gravity').RadialGravity
		worker:
			physics: './js/gravity/physics.js'

	###
	$('.gravity').RadialGravity 'add',
		id: 'foobar'
		width: 200,
		height: 200,
		top: 0,
		left: 0
	###

	#$('.gravity').RadialGravity 'remove', 'foobar'