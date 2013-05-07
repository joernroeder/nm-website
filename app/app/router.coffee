define [
	'app'
	'modules/Auth'
	'modules/Project',
	'modules/Person',
	'modules/Excursion',
	'modules/Workshop',
	'modules/Exhibition',
	'modules/CalendarEntry',
	# view stuff
	'modules/PageError',
	'modules/Portfolio',
	'modules/Calendar',
	'modules/About',
	'modules/ProjectSearch'
], (app, Auth, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, PageError, Portfolio, Calendar, About, ProjectSearch) ->

	###*
	 *
	 *	All the URL routing is done here.
	 *	Our router also serves as the data retrieving interface. All data getting logic is
	 *	handled here. 
	 * 
	###
	Router = Backbone.Router.extend
		###*
		 * All routes should result in a `done` function of this deferred variable
		 * @type {$.Deferred}
		###
		mainDeferred: null

		###*
		 * All pending ajax requests
		 * 
		###
		pendingAjax: []

		initialize: (options) ->
			# let's hook into JJRestApi's `dfdAjax` event, which gets fired on sending a request to the API
			JJRestApi.Events.bind 'dfdAjax', (dfd) =>
				@.pendingAjax.push dfd

		###*
		 * This method breaks off the current route if another one is called in order to prevent deferreds to trigger
		 * when another route has already been called
		 * 
		 * @return {$.Deferred}
		###
		rejectAndHandle: (options) ->
			options = options || {}
			app.handleLinks()

			unless options.noFadeOut
				app.addLoadingClasses()
				app.startSpinner()

			deferred = @.mainDeferred
			# kill the main deferred
			if deferred then deferred.reject()

			# kill all pending ajax requests
			_.each @.pendingAjax, (pending) ->
				if pending.readyState isnt 4 then pending.abort()

			@.pending = []
			@.mainDeferred = $.Deferred()
			@.mainDeferred.done =>
				@.mainDeferred = null
				app.removeLoadingClasses()
				app.stopSpinner()

		routes:
			''											: 'index'					# Calendar and featured projects
			'about/'									: 'showAboutPage'			# About page (Students, Statement etc.)
			'about/:nameSlug/'							: 'showPersonPage'			# Student page with normal or custom template
			'about/:nameSlug/:uglyHash/'				: 'showPersonDetailed' 		# Project with normal or custom template
			'portfolio/'								: 'showPortfolio'			# All projects
			'portfolio/search/:searchTerm/'				: 'showPortfolio'			# All projects, but show only filtered
			'portfolio/:uglyHash/'						: 'showPortfolioDetailed' 	# can be filter or detail of project
			'calendar/'									: 'showCalendar'			# whole calendar
			'calendar/:urlHash/'						: 'showCalendarDetailed' 	# show a detailed calendar event
			'login/'									: 'showLoginForm'			# show the login form or redirect
			'logout/'									: 'doLogout'				# logout or redirect
			'*url/'										: 'catchAllRoute'			# for example: "Impressum", else 404 error page

		# ! ROUTE CATCHING
		# 
		# 
		# Routes always folllow the same pattern:
		# 1.) Reject the current MainDeferred (if still existant) and build up a new one (this.rejectAndHandle)
		# 2.) Give MainDeferred a `done`-function that handles the eventual rendering
		# 3.) Retrieve data and resolve MainDeferred within `done`
		
		index: (hash) ->
			mainDfd = @.rejectAndHandle()

			config = app.Config

			# we assume that each "featured" project is also present within the whole portfolio
			if app.Cache.WholePortfolio
				config.Featured.present.flag = true

			projDfd = DataRetrieval.forProjectsOverview(config.Featured)
			calDfd = DataRetrieval.forCalendar('upcoming')

			$.when(projDfd, calDfd).done ->
				mainDfd.resolve()

			mainDfd.done =>
				layout = app.useLayout 'index'
				# cache the featured projects
				unless app.Cache.Featured
					app.Cache.Featured = @.getProjectTypeModels { IsFeatured: true }

				modelsArray = app.Cache.Featured
				@.showGravityViewForModels modelsArray, 'portfolio', layout
				calendarContainer = new Calendar.Views.Container({ collection: app.Collections.CalendarEntry })
				layout.setViewAndRenderMaybe '#calendar', calendarContainer

		showAboutPage: () ->
			mainDfd = @.rejectAndHandle()
			
			groupImageDfd = DataRetrieval.forRandomGroupImage()
			personsDfd = DataRetrieval.forPersonsOverview()
			
			$.when(groupImageDfd, personsDfd).done (image) ->
				mainDfd.resolve image

			mainDfd.done (image) ->
				layout = app.useLayout 'main', {customClass: 'about'}
				coll = app.Collections['Person']
				persons =
					students : coll.where { IsStudent: true }
					alumnis : coll.where { IsAlumni: true }
					employees : coll.where { IsEmployee: true }
				view = new About.Views.GravityContainer { groupImage: image, persons: persons }
				layout.setViewAndRenderMaybe '', view


		showPersonPage: (nameSlug) ->
			mainDfd = @.rejectAndHandle()

			# get the detailed person object
			DataRetrieval.forDetailedObject('Person', nameSlug).done (model) ->
				mainDfd.resolve model

			mainDfd.done (model) ->
				return @.fourOhFour() unless model
				layout = app.useLayout 'main'
				template = ''
				model.get('Templates').each (templ) ->
					if not templ.get('IsDetail') then template = templ.get('Url')
				
				view = if not template then new Person.Views.GravityContainer({ model: model }) else new Person.Views.Custom({ model: model, template: template })

				layout.setViewAndRenderMaybe '', view


		showPersonDetailed: (nameSlug, uglyHash) ->
			@.showPortfolioDetailed uglyHash, nameSlug

		showPortfolio: (searchTerm) ->

			mainDfd = @.rejectAndHandle()

			# get portfolio projects
			DataRetrieval.forProjectsOverview(app.Config.Portfolio).done =>
				mainDfd.resolve()

			# @todo: filter/search bar
			if searchTerm
				console.info 'searching for: %s', searchTerm

			# check if the portfolio page is already present
			justUpdate = if app.currentLayoutName is 'portfolio' then true else false

			mainDfd.done =>
				unless justUpdate then layout = app.useLayout 'portfolio'
				
				# cache the whole portfolio
				unless app.Cache.WholePortfolio
					app.Cache.WholePortfolio = @.getProjectTypeModels { IsPortfolio: true }

				modelsArray = app.Cache.WholePortfolio
				
				if searchTerm then modelsArray = DataRetrieval.filterProjectTypesBySearchTerm searchTerm
				
				unless justUpdate
					@.showGravityViewForModels modelsArray, 'portfolio', layout
				else
					console.log 'add or remove models'
				
				

		showPortfolioDetailed: (uglyHash, nameSlug) ->
			mainDfd = @.rejectAndHandle()

			# if `isPersonPage`, there's a check for a custom template'
			# the first digit of uglyHash points to its class -> get it!
			classType = app.Config.ClassEnc[uglyHash.substr(0,1)]
			if classType
				DataRetrieval.forDetailedObject(classType, uglyHash).done (model) =>
					mainDfd.resolve model
				mainDfd.done (model) =>
					if not model or (not nameSlug and not model.get('IsPortfolio')) then return @.fourOhFour()
					layout = app.useLayout 'main', {customClass: 'detail'}
					template = ''
					if nameSlug
						person = model.get('Persons').where({ UrlSlug: nameSlug })
						if person.length
							person[0].get('Templates').each (templ) ->
								if templ.get('IsDetail') then template = templ.get('Url')

					detailView = if not template then new Portfolio.Views.Detail({ model: model }) else new Person.Views.Custom({ model: model, template: template })
					layout.setViewAndRenderMaybe '', detailView
			else
				mainDfd.done @.fourOhFour
				mainDfd.resolve()

		showCalendar: () ->
			console.info 'show whole calendar'

		showCalendarDetailed: (urlHash) ->
			mainDfd = @.rejectAndHandle()

			DataRetrieval.forDetailedObject('CalendarEntry', urlHash).done (model) =>
				mainDfd.resolve model

			mainDfd.done (model) =>
				return @.fourOhFour() unless model
				layout = app.useLayout 'main', {customClass: 'detail'}

				detailView = new Calendar.Views.Detail({ model: model })
				layout.setViewAndRenderMaybe '', detailView

		# ! Security stuff
		showLoginForm: () ->
			mainDfd = @.rejectAndHandle()

			console.info 'login form. if logged in, redirect to dashboard'
			Auth.performLoginCheck().done ->
				mainDfd.resolve()

			mainDfd.done ->
				console.log 'showing login form'
				layout = app.useLayout 'main'
				layout.setViewAndRenderMaybe '', new Auth.Views.Login()

		doLogout: ->
			if @.mainDfd
				@.mainDfd.reject()
				@.mainDfd = null
			layout = app.useLayout 'main'
			dfd = $.Deferred()
			if app.CurrentMember
				layout.setViewAndRenderMaybe '', new Auth.Views.Logout()
				dfd = Auth.logout()
			else dfd.resolve()
				

		catchAllRoute: (url) ->
			console.log 'catch all route'

		fourOhFour: () ->
			layout = app.useLayout 'main'
			errorView = new PageError.Views.FourOhFour({attributes: {'data-url': window.location.href}})
			layout.setViewAndRenderMaybe '', errorView

		# !- Repeating helper abstraction
		
		showGravityViewForModels: (modelsArray, linkTo, layout) ->
			# this isn't really a collection, but we assign it to it anyway ;)
			gravityContainer = new Portfolio.Views.GravityContainer({ collection: modelsArray, linkTo: linkTo })
			layout.setViewAndRenderMaybe '#gravity-container', gravityContainer

		getProjectTypeModels: (where) ->
			returnArray = []
			for projectType in app.Config.ProjectTypes
				returnArray = returnArray.concat app.Collections[projectType].where(where)
			returnArray


	# ! DATA RETRIEVAL HELPER OBJECT
	
	DataRetrieval =

		# abstract function to get data for Projects/Exhibitions/Workshops/Excursions for either 'featured page'
		# or 'portfolio page'
	
		forProjectsOverview: (configObj) ->
			present = configObj.present
			projectTypes = app.Config.ProjectTypes

			returnDfd = new $.Deferred()

			unless present.flag
				# featured Projects/Exhibitions/Workshops/Excursions are not yet present
				# get them either from DOM or API
				dfds = []
				for projectType in projectTypes
					do (projectType) ->
						options = 
							name: configObj.domName(projectType)
							urlSuffix : configObj.urlSuffix
						dfds.push JJRestApi.getFromDomOrApi(projectType, options).done((data) ->
							app.handleFetchedModels projectType, data
						)
				$.when.apply(@, dfds).done ->
					present.flag = true
					returnDfd.resolve()

			else
				returnDfd.resolve()
			returnDfd.promise()

		# function that takes a search term used to filter the whole portfolio
		filterProjectTypesBySearchTerm: (searchTerm) ->
			wholePortfolio = app.Cache.WholePortfolio

			# because of simplicity reasons we iterate over an array of json objects. let's cache the whole json portfolio
			unless app.Cache.WholePortfolioJSON
				tmp = []
				for model in wholePortfolio
					tmp.push model.toJSON()
				app.Cache.WholePortfolioJSON = tmp

			# transform the searchTerm
			searchObj = ProjectSearch.transformSearchTerm searchTerm
			console.log searchObj

			result = _.filter app.Cache.WholePortfolioJSON, (model) ->
				result = true
				_.each searchObj, (vals, key) ->
					if not ProjectSearch.test(model, key, vals) then result = false

				# if the filter returns true
				return result

			out = _.map result, (model) ->
				do (model) ->
					return _.find wholePortfolio, (m) ->
						return m.id is model.ID and m.get('ClassName') is model.ClassName

			out

		# abstract function to get data for the Calendar (either the whole calendar, or merely the upcoming events)
		forCalendar: (type) ->
			config = app.Config.Calendar[type]
			dfd = new $.Deferred()

			unless config.flag
				options = _.clone config
				options.name = type + '-calendar'

				JJRestApi.getFromDomOrApi('CalendarEntry', options).done (data) ->
					# set an internal "IsUpcoming" flag for faster accessing
					if type is 'upcoming'
						for item in data
							item.IsUpcoming = true
					app.handleFetchedModels 'CalendarEntry', data
					config.flag = true
					if type is 'whole' then app.Config.Calendar.upcoming.flag = true
					dfd.resolve()
			else
				dfd.resolve()

			dfd.promise()

		# function to get persons' data for the "About"-page
		# namely all persons except externals
		forPersonsOverview: ->
			config = app.Config.Person
			dfd = new $.Deferred()

			unless config.about_present
				options = _.clone config
				JJRestApi.getFromDomOrApi('Person', options).done (data) ->
					config.about_present = true
					app.handleFetchedModels 'Person', data
					dfd.resolve()
			else
				dfd.resolve()
			dfd.promise()

		# abstract function to get the detailed data of a calendar item by its ugly Hash
		forDetailedObject: (classType, slug, callback) ->
			configObj = app.Config.Detail[classType]
			dfd = new $.Deferred()

			# check if there is already a Calendar Entry with the urlHash
			coll = app.Collections[classType]
			whereStatement = configObj.where(slug)

			existModel = coll.findWhere whereStatement
			if existModel
				if existModel._isCompletelyFetched
					dfd.resolve existModel
				else
					return @.fetchExistingModelCompletely(existModel)
			else
				options =
					name: configObj.domName
					urlSuffix: configObj.urlSuffix(slug)
				JJRestApi.getFromDomOrApi(classType, options).done (data) ->
					data = if _.isArray(data) then data else [data]
					model = if data.length is 1 then app.handleFetchedModel(classType, data[0]) else null
					# set a flag that says the model is completely fetched
					model._isCompletelyFetched = true
					# set a flag that says if the model has been fetched while logged in
					model._isFetchedWhenLoggedIn = true
					dfd.resolve model	

			dfd.promise()

		# title says it all
		forRandomGroupImage: ->
			pageInfos = app.PageInfos
			dfd = new $.Deferred()
			getRandom = ->
				groupImages = pageInfos.GroupImages
				if groupImages.length > 0
					return groupImages[Math.floor(Math.random() * groupImages.length)]
				null
			unless pageInfos.GroupImages
				JJRestApi.getFromDomOrApi('GroupImage').done (data) ->
					pageInfos.GroupImages = data
					dfd.resolve getRandom()
			else
				dfd.resolve getRandom()
			dfd.promise()

		# abstract function that calls `fetch` on a model and then calls back
		fetchExistingModelCompletely : (existModel, callback) ->
			dfd = new $.Deferred()
			existModel.fetch
				success: (model) ->
					dfd.resolve model
					# set a flag that says the model is completely fetched
					model._isCompletelyFetched = true
					# set a flag that says if the model has been fetched while logged in
					model._isFetchedWhenLoggedIn = true
			dfd.promise()

	Router