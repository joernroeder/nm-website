require [
	'app'
	'router'
	'modules/Auth',
	'modules/Project',
	'modules/Person',
	'modules/Excursion',
	'modules/Workshop',
	'modules/Exhibition',
	'modules/CalendarEntry'
	'modules/RecycleBin'
	'plugins/misc/spin.min',
	'plugins/misc/misc'
], (app, Router, Auth, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, RecycleBin, Spinner, misc) ->

	
	# ! JJRELATIONAL CONFIG

	# work with store -> avoid duplicate data
	Backbone.JJRelational.Config.work_with_store = true

	# ! APP SETUP / BASIC FUNCTIONS
	
	# this is used to check how many ajax POST/PUT/DELETE/PATCH are active 
	app.ajaxCount = 0

	# Backbone specific
	app.Router = new Router()
	app.Layout

	# for caching page infos
	app.PageInfos = {}

	# flag to check if we have already fetched all categories
	app.CategoriesFetched

	# our objects which get populated over time
	app.Collections = {}

	# out app cache where we store specific searches/collection items
	app.Cache = {}
	app.Cache.UserGallery =
		fetched: 
			Projects: false
			Person: false
		images:
			Person: []
			Projects: []

	# auth
	app.CurrentMember = {}
	app.CurrentMemberPerson = null
	app.ProjectEditor = null


	# base url
	app.origin = if window.location.origin then window.location.origin else window.location.protocol + '//' + window.location.host

	console.log app

	# basic config with flags to check whether specific data is already present or not
	# also serves as the expression interface between SilverStripe and Backbone. Put hardcoded string in there
	# and only use references within application logic
	# 
	# this will get updated over time to avoid unnecessary requests etc.
	app.Config =
		ProjectTypes: ['Project', 'Excursion', 'Workshop', 'Exhibition']
		StoreHooks: ['Project', 'Excursion', 'Workshop', 'Exhibition', 'Person', 'CalendarEntry', 'DocImage', 'Category']
		ClassEnc:
			'0': 'Project',
			'1': 'Excursion'
			'2': 'Exhibition'
			'3': 'Workshop'
		GalleryUrl: 'imagery/gallery/'
		DocImageUrl: 'imagery/images/docimage/'
		PersonImageUrl: 'imagery/images/personimage/'

		BasicListUrl: 'lists/all/'

		GetEditorsUrl: 'api/v2/Editors/getEditors'
		ChangeEditorsUrl: 'api/v2/Editors/changeEditors'

		ChangeCredentialsUrl: 'api/v2/Auth/credentials/'
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
				domName: 'detailed-person-item'
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

		Spinner :
			lines: 13				# The number of lines to draw
			length: 6				# The length of each line
			width: 2				# The line thickness
			radius: 7				# The radius of the inner circle
			#lines: 13				# The number of lines to draw
			#length: 16				# The length of each line
			#width: 5				# The line thickness
			#radius: 16				# The radius of the inner circle
			corners: 1				# Corner roundness (0..1)
			rotate: 0				# The rotation offset
			direction: 1			# 1: clockwise, -1: counterclockwise
			color: '#262626'		# #rgb or #rrggbb
			speed: 1 				# Rounds per second
			trail: 70				# Afterglow percentage
			shadow: false			# Whether to render a shadow
			hwaccel: false			# Whether to use hardware acceleration
			className: 'spinner'	# The CSS class to assign to the spinner
			zIndex: 2e9				# The z-index (defaults to 2000000000)
			top: 'auto'				# Top position relative to parent in px
			left: 'auto'			# Left position relative to parent in px
	
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

	app.handleLinks = ->
		frag = Backbone.history.fragment
		frag = '/' + frag.substring 0, frag.indexOf('/') + 1
		$('#wrapper .badge').find('a').each (i, a) ->
			$a = $(a)
			$a.removeClass 'active'
			if $a.attr('href') is frag then $a.addClass 'active'

	app.updateGalleryCache = (dataArray) ->
		addTo = (array, obj) ->
			array.push {id: obj.id, tag: obj.tag, url: obj.url}

		_.each dataArray, (obj) =>
			if className = obj.UploadedToClass
				if className is 'DocImage'
					_.each @.Cache.UserGallery.images.Projects, (project) =>
						if project.FilterID is obj.FilterID
							addTo project.Images, obj
				if className is 'PersonImage'
					addTo @.Cache.UserGallery.images.Person, obj

			else
				# this is no upload, instead update any existing data
	
	app.removeFromGalleryCache = (className, id) ->
		if className is 'PersonImage'
			_.each @.Cache.UserGallery.images.Person, (img, i) =>
				if img.id is id
					delete @.Cache.UserGallery.images.Person[i]
		if className is 'DocImage'
			_.each @.Cache.UserGallery.images.Projects, (project, i) =>
				_.each project.Images, (img, j) =>
					if img.id is id
						delete @.Cache.UserGallery.images.Projects[i].Images[j]
		true

	app.getFromGalleryCache = (className, id) ->
		found = null
		if className is 'PersonImage'
			_.each @.Cache.UserGallery.images.Person, (img, i) =>
				if img.id is id
					found = @.Cache.UserGallery.images.Person[i]
		if className is 'DocImage'
			_.each @.Cache.UserGallery.images.Projects, (project, i) =>
				_.each project.Images, (img, j) =>
					if img.id is id
						found = @.Cache.UserGallery.images.Projects[i].Images[j]
		found

	app.initialLoggedInCheck = ->
		JJRestApi.getFromDomOrApi('current-member', {noAjax: true}).done (data) ->
			Auth.handleUserServerResponse(data)

	app.setupSpinner = ->
		@.$body = $ 'body'
		@.$main = $ '#main'
		@.spinner = 
			inst: new Spinner(app.Config.Spinner)
			target: document.getElementById('spinner-target')
	app.startSpinner = ->
		spinner = @.spinner
		$(spinner.target).addClass 'active'
		spinner.inst.spin(spinner.target)
	app.stopSpinner = ->
		spinner = @.spinner
		$(spinner.target).removeClass 'active'
		spinner.inst.stop()

	app.addLoadingClasses = ->
		@.$body.addClass('isLoading')
		@.$main.addClass('loading')
	app.removeLoadingClasses = ->
		@.$body.removeClass('isLoading')
		@.$main.removeClass('loading')


	app.resolveClassTypeByHash = (uglyHash) ->
		@.Config.ClassEnc[uglyHash.substr(0,1)]

	app.wholePortfolioJSON = ->
		wholePortfolio = @Cache.WholePortfolio
		unless @Cache.WholePortfolioJSON
			tmp = []
			for model in wholePortfolio
				tmp.push model.toJSON()
			@Cache.WholePortfolioJSON = tmp
		@Cache.WholePortfolioJSON

	app.bindListeners()


	# few Backbone extra functions
	Backbone.View.prototype.showMessageAt = (msg, $appendTo, className) ->
		$el = $('<p class="' + className + '">' + msg + '</p>')
		$el.appendTo $appendTo
		setTimeout ->
			$el.fadeOut().remove()
		, 2000

	# extra function to reject any pending save functions on the same model
	Backbone.__pendingSaveReqs = []
	Backbone.JJRelationalModel.prototype.rejectAndSave = ->
		# add callback that triggers 'save'
		Array.prototype.push.call arguments, null, 
			success: (model) ->
				model.trigger 'saved'
	

		xhr = @.save.apply @, arguments

		found = false
		_.each Backbone.__pendingSaveReqs, (req) =>
			if req.cid is @.cid
				found = true
				if req.xhr and req.xhr.readyState isnt 4 then req.xhr.abort()
				req.xhr = xhr
		
		Backbone.__pendingSaveReqs.push({ cid: @.cid, xhr: xhr }) unless found
		xhr

	# Global Handlebars helpers
	Handlebars.registerHelper 'stringCompare', (what1, what2, block) ->
		if what1 is what2
			return block.fn @
		else
			return block.inverse @

	Handlebars.registerHelper 'stringDiff', (what1, what2, block) ->
		if what1 isnt what2
			return block.fn @
		else
			return block.inverse @

	Handlebars.registerHelper 'console', (what) ->
		console.log what
		'logging...'


	# ! KICK OFF

	# Treat the jQuery ready function as the entry point to the application.
	# Inside this function, kick-off all initialization, everything up to this
	# point should be definitions.
	$ ->
		app.$body = $('body')

		# init file transfer
		jQuery.event.props.push 'dataTransfer'
		
		$(document).bind 'ajaxSend', (event, xhr, settings) ->
			if settings.type isnt 'GET'
				app.ajaxCount++
				app.$body.addClass 'requesting'

		$(document).bind 'ajaxComplete', (event, xhr, settings) ->
			if settings.type isnt 'GET'
				app.ajaxCount--
				app.$body.removeClass('requesting') if app.ajaxCount is 0

		# disable drag'n'drop for whole document
		$(document).on 'dragenter dragover dragleave drop', (e) ->
			if e.type is 'dragenter' or e.type is 'dragover'
				$.fireGlobalDragEvent 'dragstart', e.target, 'file'
			else
				$.fireGlobalDragEvent e.type, e.target, 'file'
			e.preventDefault()

		# drag'n'drop for recyclebin
		RecycleBin.setup()

		app.setupSpinner()

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

			app.initialLoggedInCheck()

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