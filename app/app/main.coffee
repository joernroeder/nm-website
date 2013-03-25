require [
	'app'
	'router'
	'modules/Project',
	'modules/Person',
	'modules/Excursion',
	'modules/Workshop',
	'modules/Exhibition',
	'modules/CalendarEntry'
], (app, Router, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry) ->

	# Backbone specific
	app.Router = new Router()
	app.Layouts = {}

	# for caching page infos
	app.PageInfos = {}

	# our objects which get populated over time
	app.Collections = {}

	# basic config with flags to check whether specific data is already present or not
	# this will get updated over time to avoid unnecessary requests etc.
	app.Config =
		UrlSuffixes:
			portfolio: 	'?search=IsPortfolio:1&context=view.portfolio_init'
			featured: 	'?search=IsFeatured:1&context=view.portfolio_init'
			about_persons: '?search=IsExternal:0&context=view.portfolio_init'
		Featured:
			present: false
		Project:
			portfolio_present: false
		Excursion:
			portfolio_present: false
		Workshop:
			portfolio_present: false
		Exhibition:
			portfolio_present: false
		Person:
			about_present: false

			

	# Treat the jQuery ready function as the entry point to the application.
	# Inside this function, kick-off all initialization, everything up to this
	# point should be definitions.
	$ ->
		# Build up our structure from Silverstripe
		JJRestApi.bootstrapWithStructure ->

			buildCollections = (names) ->
				for name in names
					# make class accessible
					CollClass = JJRestApi.Collection name
					app.Collections[name] = new CollClass()

			buildCollections ['Project', 'Person', 'Excursion', 'Workshop', 'Exhibition', 'CalendarEntry']
			

			app.Layouts.Main = app.useLayout 'main', 
			views:
				'': [
			#		new Project.Views.Test()
				]

			Backbone.history.start pushState: true
		

	# All navigation that is relative should be passed through the navigate
	# method, to be processed by the router.  If the link has a data-bypass
	# attribute, bypass the delegation completely.
	$(document).on 'click', 'a:not([data-bypass])', (evt) ->
		
		# Get the anchor href and protocol
		href = $(this).attr 'href'
		protocol = @protocol + '//'

		# Ensure the protocol is not part of URL, meaning its relative.
		if href and href.slice(0, protocol.length) isnt protocol and href.indexOf('javascript:') isnt 0

			# Stop the default event to ensure the link will not cause a page refresh.
			evt.preventDefault()
			
			# `Backbone.history.navigate` is sufficient for all Routers and will
			# trigger the correct events.  The Router's internal `navigate` method
			#calls this anyways.
			Backbone.history.navigate href, true