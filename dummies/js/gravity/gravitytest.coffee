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

###

"use strict"
#Framework = if '__proto__' of {} then Zepto else jQuery

do ($ = Zepto) ->
	$('.gravity').RadialGravity
		worker:
			physics: './js/gravity/backend/physics.js'

	###
	$('.gravity').RadialGravity 'add',
		id: 'foobar'
		width: 200,
		height: 200,
		top: 0,
		left: 0
	###

	#$('.gravity').RadialGravity 'remove', 'foobar'