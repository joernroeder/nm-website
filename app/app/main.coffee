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
		ClassEnc:
			'0': 'Project',
			'1': 'Excursion'
			'2': 'Exhibition'
			'3': 'Workshop'
		UrlSuffixes:
			#portfolio: 	'?search=IsPortfolio:1&context=view.portfolio_init'
			about_persons: '?search=IsExternal:0'
		Featured:
			present: 
				flag: false
				types: []
			domName: (className) ->
				'featured-' + className.toLowerCase()
			urlSuffix: '?' + JJRestApi.objToUrlString
				search:
					IsFeatured: 1
				context: 'view.portfolio_init'
		Portfolio:
			present:
				flag: false
				types: []
			domName: (className) ->
				'portfolio-' + className.toLowerCase()
			urlSuffix: '?' + JJRestApi.objToUrlString
				search:
					IsPortfolio: 1
				context: 'view.portfolio_init'
		Calendar:
			upcoming:
				flag: false
				url: 'api/v2/UpcomingEvents.json'
			whole:
				flag: false
		Person:
			about_present: false
			name: 'about-persons'
			urlSuffix: '?' + JJRestApi.objToUrlString
				search:
					IsExternal: 0
				context: 'view.about_init'
				sort: 'Surname'
		Detail:
			CalendarEntry:
				where: (slug) ->
					{ UrlHash: slug }
				domName: 'detailed-calendar-item'
				urlSuffix: (slug) ->
					return '?' + JJRestApi.objToUrlString
						search:
							UrlHash: slug
						limit: 1
			Person:
				where: (slug) ->
					{ UrlSlug: slug }
				domName: 'detailed-person'
				urlSuffix: (slug) ->
					return '?' + JJRestApi.objToUrlString
						search:
							UrlSlug: slug
						limit: 1
			# basically all the same here, but need differenciation because of class separation
			Project:
				where: (slug) ->
					{ UglyHash: slug }
				domName: 'detailed-project-item'
				urlSuffix: (slug) ->
					return '?' + JJRestApi.objToUrlString
						search:
							UglyHash: slug
						limit: 1
			Excursion:
				where: (slug) ->
					{ UglyHash: slug }
				domName: 'detailed-excursion-item'
				urlSuffix: (slug) ->
					return '?' + JJRestApi.objToUrlString
						search:
							UglyHash: slug
						limit: 1
			Workshop:
				where: (slug) ->
					{ UglyHash: slug }
				domName: 'detailed-workshop-item'
				urlSuffix: (slug) ->
					return '?' + JJRestApi.objToUrlString
						search:
							UglyHash: slug
						limit: 1
			Exhibition:
				where: (slug) ->
					{ UglyHash: slug }
				domName: 'detailed-exhibition-item'
				urlSuffix: (slug) ->
					return '?' + JJRestApi.objToUrlString
						search:
							UglyHash: slug
						limit: 1
	
	app.bindListeners = ->
		# we don't want to directly mess with the store, so we simply hook into
		# Backbone.JJStore's 'add' event, to add a reference of the model to our own collections
		for storeHook in app.Config.StoreHooks
			do (storeHook) ->
				Backbone.JJStore.Events.bind 'added:' + storeHook, (model) ->
					coll = app.Collections[storeHook]
					if coll then coll.add model
		true
			
	app.handleFetchedModels = (type, data, options) ->
		# as we are hooked into JJStore, we simply have to create a new model and the listeners will do the rest
		options = options || {}
		MType = JJRestApi.Model type
		data = if _.isArray(data) then data else [data]
		for d in data
			new MType d

	app.handleFetchedModel = (type, data, options) ->
		# same as `handleFetchedModels`, but actually returns the model
		options = options || {}
		MType = JJRestApi.Model type
		return new MType(data)

	app.bindListeners()

	# ! KICK OFF

	# Treat the jQuery ready function as the entry point to the application.
	# Inside this function, kick-off all initialization, everything up to this
	# point should be definitions.
	$ ->
		# Hook CSRF ajax token
		JJRestApi.hookSecurityToken()

		# Build up our structure from Silverstripe
		JJRestApi.bootstrapWithStructure().done ->
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