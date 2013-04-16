# Set the require.js configuration for your application.
require.config

	# Initialize the application with the main application file
	deps: ['main']

	paths:
		# JavaScript folders
		libs	: '../assets/js/libs'
		plugins	: '../assets/js/plugins'

		# Libraries
		jquery		: '../assets/js/libs/jquery.min'
		underscore	: '../assets/js/libs/underscore'
		backbone	: '../assets/js/libs/backbone'
		handlebars	: '../assets/js/libs/handlebars'

	shim:
		jquery:
			exports: '$'
		backbone:
			deps: [
		  		'underscore'
		  		'jquery'
		  	]
			exports: 'Backbone'

		underscore:
			exports: '_'

		handlebars:
			exports: 'Handlebars'

		'plugins/tooltip/jquery.qtip'		: ['jquery']
		'plugins/gravity/jquery.gravity'	: ['plugins/tooltip/jquery.qtip']

		'plugins/backbone.layoutmanager'	: ['backbone']
		'plugins/backbone.JJRelational'		: ['backbone']
		'plugins/backbone.JJRestApi'		: ['backbone']
