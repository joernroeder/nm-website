# Set the require.js configuration for your application.
require.config

	# Initialize the application with the main application file
	deps: ['main']

	paths:
		# JavaScript folders
		libs	: '../assets/js/libs'
		plugins	: '../assets/js/plugins'

		# Libraries
		zepto		: '../assets/js/libs/zepto.min'
		underscore	: '../assets/js/libs/underscore'
		backbone	: '../assets/js/libs/backbone'
		handlebars	: '../assets/js/libs/handlebars'

	shim:
		zepto:
			exports: '$'
		backbone:
			deps: [
		  		'underscore'
		  		'zepto'
		  	]
			exports: 'Backbone'

		underscore:
			exports: '_'

		handlebars:
			exports: 'Handlebars'

		'plugins/zepto.deferred.min'	: ['zepto']
		'plugins/zepto.installer'		: ['plugins/zepto.deferred.min']
		'plugins/zepto.modifications'	: ['plugins/zepto.installer']
		'plugins/tooltip/zepto.tooltip'	: ['plugins/zepto.modifications']
		'plugins/gravity/zepto.gravity'	: ['plugins/tooltip/zepto.tooltip']

		'plugins/backbone.layoutmanager'	: ['backbone']
		'plugins/backbone.JJRelational'		: ['backbone']
		'plugins/backbone.JJRestApi'		: ['backbone']
