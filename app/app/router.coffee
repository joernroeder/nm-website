define [
	'app'
	'modules/Auth'
	'modules/Project'
	'modules/Person'
	'modules/Excursion'
	'modules/Workshop'
	'modules/Exhibition'
	'modules/CalendarEntry'
	# view stuff
	'modules/PageError'
	'modules/Portfolio'
	'modules/Calendar'
	'modules/About'
	'modules/ProjectSearch'
	'modules/DataRetrieval'
	'modules/NewProject'
	'modules/ProjectEditor'
], (app, Auth, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, PageError, Portfolio, Calendar, About, ProjectSearch, DataRetrieval, NewProject, ProjectEditor) ->

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
			app.isEditor = false
			if app.ProjectEditor
				app.ProjectEditor.cleanup()
				app.ProjectEditor = null

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
				Auth.updateUserWidget()
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
			'secured/edit/:uglyHash/'					: 'showEditProjectPage'		# Editing of a project type
			'secured/new/'								: 'showCreateProjectPage'	# Create a new project
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
					app.Cache.Featured = @.getProjectTypeModels { IsFeatured: true, IsPublished: true }

				modelsArray = app.Cache.Featured
				@.showPackeryViewForModels modelsArray, 'portfolio', layout
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
				view = new About.Views.PackeryContainer { groupImage: image, persons: persons }
				layout.setViewAndRenderMaybe '', view


		showPersonPage: (nameSlug) ->
			mainDfd = @.rejectAndHandle()

			# get the detailed person object
			DataRetrieval.forDetailedObject('Person', nameSlug).done (model) ->
				mainDfd.resolve model

			mainDfd.done (model) =>
				return @.fourOhFour() unless model
				layout = app.useLayout 'main'
				template = ''
				model.get('Templates').each (templ) ->
					if not templ.get('IsDetail') then template = templ.get('Url')
				
				view = if not template then new Person.Views.PackeryContainer({ model: model }) else new Person.Views.Custom({ model: model, template: template })

				layout.setViewAndRenderMaybe '', view


		showPersonDetailed: (nameSlug, uglyHash) ->
			@.showPortfolioDetailed uglyHash, nameSlug

		showPortfolio: (searchTerm) ->

			mainDfd = @.rejectAndHandle()

			# get all categories (we need that for searching)
			seed1 = DataRetrieval.forCategories()


			# get portfolio projects
			seed2 = DataRetrieval.forProjectsOverview(app.Config.Portfolio)

			$.when(seed1, seed2).done ->
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
					app.Cache.WholePortfolio = @.getProjectTypeModels { IsPortfolio: true, IsPublished: true }

				modelsArray = app.Cache.WholePortfolio
				
				unless justUpdate
					@.showPackeryViewForModels modelsArray, 'portfolio', layout

				if searchTerm
					searchedForArray = DataRetrieval.filterProjectTypesBySearchTerm searchTerm
					Backbone.Events.trigger 'search', searchedForArray
				

				
				

		showPortfolioDetailed: (uglyHash, nameSlug) ->
			mainDfd = @.rejectAndHandle()

			# if `isPersonPage`, there's a check for a custom template'
			# the first digit of uglyHash points to its class -> get it!
			classType = app.resolveClassTypeByHash uglyHash
			if classType
				DataRetrieval.forDetailedObject(classType, uglyHash).done (model) =>
					mainDfd.resolve model
				mainDfd.done (model) =>
					if not model or (not model.get('IsPublished')) or (not nameSlug and not model.get('IsPortfolio')) then return @.fourOhFour()
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

		# ! Member area
		

		# create a new project
		showCreateProjectPage: ->
			mainDfd = @.rejectAndHandle()
			Auth.performLoginCheck().done =>
				if app.CurrentMember.Email
					mainDfd.resolve()
				else
					@.fourOhFour()

			mainDfd.done ->
				layout = app.useLayout 'main'
				layout.setViewAndRenderMaybe '', new NewProject.Views.NewProject()

		# editor page of a project
		showEditProjectPage: (uglyHash) ->
			mainDfd = @.rejectAndHandle()
			app.isEditor = true

			className = app.resolveClassTypeByHash(uglyHash)
			Auth.canEdit({className: className, UglyHash: uglyHash})
				.fail =>
					Backbone.history.navigate '/login/', true
				.done =>
					# get the appropriate object for editing
					DataRetrieval.forDetailedObject(className, uglyHash, true)
						.done (model) =>
							mainDfd.resolve model

			mainDfd.fail ->
				Backbone.history.navigate '/login/', true
			.done (model) ->
				layout = app.useLayout 'editor'
			
				app.ProjectEditor = new ProjectEditor.Inst(model)
				app.ProjectEditor.kickOffRender()

				

		catchAllRoute: (url) ->
			console.log 'catch all route'

		fourOhFour: () ->
			@.rejectAndHandle().resolve().done ->
				layout = app.useLayout 'main'
				errorView = new PageError.Views.FourOhFour({attributes: {'data-url': window.location.href}})
				layout.setViewAndRenderMaybe '', errorView

		# !- Repeating helper abstraction
		
		showPackeryViewForModels: (modelsArray, linkTo, layout) ->
			# this isn't really a collection, but we assign it to it anyway ;)
			packeryContainer = new Portfolio.Views.PackeryContainer({ collection: modelsArray, linkTo: linkTo })
			layout.setViewAndRenderMaybe '#packery-container', packeryContainer

		getProjectTypeModels: (where) ->
			returnArray = []
			for projectType in app.Config.ProjectTypes
				returnArray = returnArray.concat app.Collections[projectType].where(where)
			returnArray


	Router