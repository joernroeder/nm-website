## Set the require.js configuration for your application.
require.config

	## Initialize the application with the main application file
	deps: ["main"]

	paths:
		## JavaScript folders
		libs	: "../assets/js/libs"
		plugins	: "../assets/js/plugins"

		## Libraries
		jquery		: "../assets/js/libs/jquery"
		underscore	: "../assets/js/libs/underscore"
		backbone	: "../assets/js/libs/backbone"
		handlebars	: "../assets/js/libs/handlebars"

	shim:
		backbone:
			deps: [
		  		"underscore"
		  		"jquery"
		  	]
			exports: "Backbone"

		underscore:
			exports: "_"

		handlebars:
			exports: "Handlebars"

		"plugins/backbone.layoutmanager": ["backbone"]
