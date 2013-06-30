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
		#'plugins/gravity/jquery.gravity'		: ['plugins/tooltip/jquery.qtip']
		'plugins/packery/packery.pkgd'			: ['jquery']
		'plugins/packery/packerytest'			: ['plugins/packery/packery.pkgd', 'plugins/tooltip/jquery.qtip']
		'modules/JJPackery'						: ['plugins/packery/packerytest']
		'responsiveimage/picturefill'			: ['responsiveimage/external/matchmedia']

		'plugins/misc/spin.min'					: ['jquery']
		'plugins/misc/misc'						: ['jquery']
		'plugins/misc/jquery.list'				: ['jquery']

		'plugins/editor/jquery.jjfileupload'	: ['jquery']
		'plugins/editor/jquery.tabby'			: ['jquery']
		'plugins/misc/zebra_datepicker.src'		: ['jquery']
		'plugins/editor/jquery.editor-sidebar'	: ['plugins/misc/misc']
		'plugins/editor/jquery.jjdropzone'		: ['plugins/editor/jquery.jjfileupload']
		'plugins/editor/jquery.jjmarkdown'		: ['plugins/editor/jquery.jjdropzone', 'plugins/editor/jquery.tabby', 'plugins/editor/jquery.jjfileupload', 'plugins/editor/marked_jjedit']
		'plugins/editor/jquery.editor-popover'	: ['plugins/tooltip/jquery.qtip', 'plugins/editor/jquery.jjmarkdown', 'plugins/misc/zebra_datepicker.src']

		'plugins/backbone.layoutmanager'		: ['backbone']
		'plugins/backbone.JJRelational'			: ['backbone']
		'plugins/backbone.JJRestApi'			: ['backbone']

		'modules/NMMarkdownParser'				: ['plugins/editor/jquery.jjmarkdown']

		'plugins/visualsearch/jquery.ui.autocomplete' : ['plugins/visualsearch/jquery.ui.widget']
		'plugins/visualsearch/jquery.ui.menu'	: ['plugins/visualsearch/jquery.ui.widget']
		'plugins/visualsearch/visualsearch'		: ['plugins/backbone.layoutmanager', 'plugins/visualsearch/jquery.ui.core', 'plugins/visualsearch/jquery.ui.autocomplete', 'plugins/visualsearch/jquery.ui.menu']

