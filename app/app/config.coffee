# Set the require.js configuration for your application.
require.config

	# Initialize the application with the main application file
	deps: ['main']

	paths:
		# JavaScript folders
		libs	: '../assets/js/libs'
		plugins	: '../assets/js/plugins'

		responsiveimage: '../../responsive-image/thirdparty/picturefill'

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

		'plugins/tooltip/jquery.qtip'			: ['jquery']
		'plugins/gravity/jquery.gravity'		: ['plugins/tooltip/jquery.qtip']
		'responsiveimage/picturefill'			: ['responsiveimage/external/matchmedia']

		'plugins/misc/spin.min'					: ['jquery']
		'plugins/misc/misc'						: ['jquery']

		'plugins/editor/jquery.jjfileupload'	: ['jquery']
		'plugins/editor/jquery.tabby'			: ['jquery']
		'plugins/editor/jquery.editor-sidebar'	: ['plugins/misc/misc']
		'plugins/editor/jquery.jjdropzone'		: ['plugins/editor/jquery.jjfileupload']
		'plugins/editor/jquery.jjmarkdown'		: ['plugins/editor/jquery.tabby', 'plugins/editor/jquery.jjfileupload', 'plugins/editor/marked_jjedit']

		'plugins/backbone.layoutmanager'		: ['backbone']
		'plugins/backbone.JJRelational'			: ['backbone']
		'plugins/backbone.JJRestApi'			: ['backbone']
