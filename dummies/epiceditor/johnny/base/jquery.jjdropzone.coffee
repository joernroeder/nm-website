"use strict"

do ($ = jQuery) ->

	class JJDropzone
		defaults =
			postURL		: null														# URL to post the files to
			errorMsg 	: 'Sorry, but there has been an error.' 					# Default error message