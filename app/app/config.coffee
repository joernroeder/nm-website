# Set the require.js configuration for your application.
require.config

	# Initialize the application with the main application file
	deps: ['main']

	#baseUrl: '../bower_components'

	paths:
		# JavaScript folders
		libs		: '../assets/js/libs'
		plugins		: '../assets/js/plugins'
		bower		: '../bower_components'

		responsiveimage: '../../responsive-image/thirdparty/picturefill'

		# ! === Bower Components ====================================
		 
		# ! --- Libraries ---------------------------------
		
		jquery		: '../bower_components/jquery/jquery'
		underscore	: '../bower_components/underscore/underscore'
		backbone	: '../bower_components/backbone/backbone'
		handlebars	: '../bower_components/handlebars/handlebars'


		# ! --- Backbone LayoutManager --------------------
		
		'layoutmanager'			: '../bower_components/layoutmanager/backbone.layoutmanager'


		# ! --- Packery -----------------------------------

		'classie'				: '../bower_components/classie'
		'doc-ready'				: '../bower_components/doc-ready'
		'eventEmitter'			: '../bower_components/eventEmitter'
		'eventie'				: '../bower_components/eventie'
		'get-size'				: '../bower_components/get-size'
		'get-style-property'	: '../bower_components/get-style-property'
		'matches-selector'		: '../bower_components/matches-selector'
		'outlayer'				: '../bower_components/outlayer'
		'packery'				: '../bower_components/packery/js'

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

		'plugins/tooltip/jquery.qtip'				: ['jquery']
		'plugins/packery/packerytest'				: ['jquery', 'plugins/tooltip/jquery.qtip']
		'modules/JJPackery'							: ['plugins/packery/packerytest']
		'responsiveimage/picturefill'				: ['responsiveimage/external/matchmedia']

		'plugins/misc/spin.min'						: ['jquery']
		'plugins/misc/misc'							: ['jquery']
		'plugins/misc/jquery.list'					: ['jquery']

		# Editor
		'plugins/editor/jquery.jjfileupload'		: ['jquery']
		'plugins/editor/jquery.tabby'				: ['jquery']
		'plugins/misc/zebra_datepicker.src'			: ['jquery']
		'plugins/editor/jquery.editor-sidebar'		: ['plugins/misc/misc']
		'plugins/editor/jquery.jjdropzone'			: ['plugins/editor/jquery.jjfileupload']
		'plugins/editor/jquery.jjmarkdown'			: ['plugins/editor/jquery.jjdropzone', 'plugins/editor/jquery.tabby', 'plugins/editor/jquery.jjfileupload', 'plugins/editor/marked_jjedit']
		'plugins/editor/jquery.editor-popover'		: ['plugins/tooltip/jquery.qtip', 'plugins/editor/jquery.jjmarkdown', 'plugins/misc/zebra_datepicker.src']

		# Backbone
		'layoutmanager'								: ['backbone']
		'plugins/backbone.JJRelational'				: ['backbone']
		'plugins/backbone.JJRestApi'				: ['backbone']
	
		'modules/NMMarkdownParser'					: ['plugins/editor/jquery.jjmarkdown']
		
		# Visual Search
		'bower/jquery-ui/ui/jquery.ui.autocomplete' : ['bower/jquery-ui/ui/jquery.ui.widget']
		'bower/jquery-ui/ui/jquery.ui.menu'			: ['bower/jquery-ui/ui/jquery.ui.widget']
		'plugins/visualsearch/visualsearch'			: [
			'layoutmanager',
			'bower/jquery-ui/ui/jquery.ui.core',
			'bower/jquery-ui/ui/jquery.ui.autocomplete',
			'bower/jquery-ui/ui/jquery.ui.menu'
		]
