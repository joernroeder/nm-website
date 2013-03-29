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

	# ! JJRELATIONAL CONFIG

	# work with store -> avoid duplicate data
	Backbone.JJRelational.Config.work_with_store = true

	# ! APP SETUP / BASIC FUNCTIONS

	# Backbone specific
	app.Router = new Router()
	app.Layout

	# for caching page infos
	app.PageInfos = {}

	# our objects which get populated over time
	app.Collections = {}

	# basic config with flags to check whether specific data is already present or not
	# also serves as the expression interface between SilverStripe and Backbone. Put hardcoded string in there
	# and only use references within application logic
	# 
	# this will get updated over time to avoid unnecessary requests etc.
	app.Config =
		ProjectTypes: ['Project', 'Excursion', 'Workshop', 'Exhibition']
		StoreHooks: ['Project', 'Excursion', 'Workshop', 'Exhibition', 'Person', 'CalendarEntry']
		UrlSuffixes:
			#portfolio: 	'?search=IsPortfolio:1&context=view.portfolio_init'
			about_persons: '?search=IsExternal:0'
		Featured:
			present: 
				flag: false
				types: []
			domName: (className) ->
				'featured-' + className.toLowerCase()
			urlSuffix: '?search=IsFeatured:1&context=view.portfolio_init'
		Portfolio:
			present:
				flag: false
				types: []
			domName: (className) ->
				'portfolio-' + className.toLowerCase()
			urlSuffix: '?search=IsPortfolio:1&context=view.portfolio_init'
		Calendar:
			upcoming: false
			whole: false
		Person:
			about_present: false

	
	app.bindListeners = ->
		# we don't want to directly mess with the store, so we simply hook into
		# Backbone.JJStore's 'add' event, to add a reference of the model to our own collections
		for storeHook in app.Config.StoreHooks
			do (storeHook) ->
				Backbone.JJStore.Events.bind 'added:' + storeHook, (model) ->
					coll = app.Collections[storeHook]
					if coll then coll.add model
		true
			
	app.handleFetchedModels = (type, models, options) ->
		# as we are hooked into JJStore, we simply have to create a new model and the listeners will do the rest
		options = options || {}
		MType = JJRestApi.Model type
		models = if _.isArray(models) then models else [models]
		for model in models
			new MType model

	app.bindListeners()

	# ! KICK OFF

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

			buildCollections app.Config.StoreHooks

			# kick off
			Backbone.history.start pushState: true
		
	# ! DELEGATE NAVIGATION

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