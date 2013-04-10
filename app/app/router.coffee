define [
	'app'
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
	'modules/About'
], (app, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, PageError, Portfolio, Calendar, About) ->

	###*
	 *
	 *	All the URL routing is done here.
	 *	Our router also serves as the data retrieving interface. All data getting logic is
	 *	handled here. 
	 * 
	###
	called_twice = false
	Router = Backbone.Router.extend
		routes:
			''											: 'index'					# Calendar and featured projects
			'about/'									: 'showAboutPage'			# About page (Students, Statement etc.)
			'about/:nameSlug/'							: 'showPersonPage'			# Student page with normal or custom template
			'about/:nameSlug/:uglyHash/'				: 'showPersonDetailed' 		# Project with normal or custom template
			'portfolio/'								: 'showPortfolio'			# All projects
			'portfolio/:uglyHash/'						: 'showPortfolioDetailed' 	# can be filter or detail of project
			'calendar/'									: 'showCalendar'			# whole calendar
			'calendar/:urlHash/'						: 'showCalendarDetailed' 	# show a detailed calendar event
			'login/'									: 'showLoginForm'			# show the login form or redirect
			'logout/'									: 'doLogout'				# logout or redirect
			'*url/'										: 'catchAllRoute'			# for example: "Impressum", else 404 error page

		# ! ROUTE CATCHING
		
		index: (hash) ->
			config = app.Config
			layout = app.useLayout 'index'

			# get featured projects
			DataRetrieval.forProjectsOverview(config.Featured).done =>
				modelsArray = @.getProjectTypeModels { IsFeatured: true }
				@.showGravityViewForModels modelsArray, layout

			# get upcoming calendar data
			DataRetrieval.forCalendar('upcoming').done =>
				calendarContainer = new Calendar.Views.UpcomingContainer({ collection: app.Collections.CalendarEntry })
				layout.setViewAndRenderMaybe '#upcoming-calendar', calendarContainer

		showAboutPage: () ->
			layout = app.useLayout 'main'

			checkAndRender = ->
				if groupImage and persons
					view = new About.Views.Gravity { groupImage: groupImage, persons: persons }
					layout.setViewAndRenderMaybe '', view

			# @todo: data we need: Statement, a random group image, all the persons (with their images, excluding externals) 
			
			# First, let's get the group image. We'll store it in app.PageInfos, as that's super basic funky info
			groupImageDfd = DataRetrieval.forRandomGroupImage()
				
			# Let's get the motrfukig persons
			personsDfd = DataRetrieval.forPersonsOverview()
			
			$.when(groupImageDfd, personsDfd).done (image) ->
				image = if image.length then image[0] else null
				coll = app.Collections['Person']
				persons =
					students : coll.where { IsStudent: true }
					alumnis : coll.where { IsAlumni: true }
					employees : coll.where { IsEmployee: true }
				view = new About.Views.Gravity { groupImage: image, persons: persons }
				layout.setViewAndRenderMaybe '', view
			

			false


		showPersonPage: (nameSlug) ->
			# get the detailed person object
			DataRetrieval.forDetailedObject 'Person', nameSlug, (model) ->
				console.log model

		showPersonDetailed: (nameSlug, uglyHash) ->
			# personType can be alumni or student
			console.info 'show project %s of %s', nameSlug
			console.info 'check if student has custom template for details'


		showPortfolio: () ->
			# @todo: filter/search bar

			layout = app.useLayout 'portfolio'
			# get portfolio projects
			DataRetrieval.forProjectsOverview app.Config.Portfolio, () =>
				modelsArray = @.getProjectTypeModels { IsPortfolio: true }
				@.showGravityViewForModels modelsArray, layout
				
				

		showPortfolioDetailed: (uglyHash) ->
			# the first digit of uglyHash points to its class -> get it!
			config = app.Config
			classType = config.ClassEnc[uglyHash.substr(0,1)]
			if classType
				DataRetrieval.forDetailedObject classType, uglyHash, (model) ->
					return @.fourOhFour() unless model
					layout = app.useLayout 'main'
					detailView = new Portfolio.Views.Detail({ model: model })
					layout.setViewAndRenderMaybe '', detailView
			else
				@.fourOhFour()

		showCalendar: () ->
			console.info 'show whole calendar'

		showCalendarDetailed: (urlHash) ->
			console.info 'get calendar detailed data with slug and show'
			DataRetrieval.forDetailedObject 'CalendarEntry', urlHash, (model) =>
				return @.fourOhFour() unless model
				layout = app.useLayout 'main'

				detailView = new Calendar.Views.Detail({ model: model })
				layout.setViewAndRenderMaybe '', detailView

		catchAllRoute: (url) ->
			console.log 'catch all route'

		fourOhFour: () ->
			layout = app.useLayout 'main'
			errorView = new PageError.Views.FourOhFour({attributes: {'data-url': window.location.href}})
			layout.setViewAndRenderMaybe '', errorView

		# !- Repeating helper abstraction
		
		showGravityViewForModels: (modelsArray, layout) ->
			# this isn't really a collection, but we assign it to it anyway ;)
			gravityContainer = new Portfolio.Views.GravityContainer({ collection: modelsArray })
			layout.setViewAndRenderMaybe '#gravity', gravityContainer

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
			dfd

		# abstract function to get the detailed data of a calendar item by its ugly Hash
		forDetailedObject: (classType, slug, callback) ->
			configObj = app.Config.Detail[classType]

			# check if there is already a Calendar Entry with the urlHash
			coll = app.Collections[classType]
			whereStatement = configObj.where(slug)

			callbackWithModel = (model) ->
				callback model
				model._isCompletelyFetched = true

			existModel = coll.findWhere whereStatement
			if existModel
				if existModel._isCompletelyFetched then return callback existModel
				@.fetchExistingModelCompletely existModel, callback
			else
				options =
					name: configObj.domName
					urlSuffix: configObj.urlSuffix(slug)
				JJRestApi.getFromDomOrApi classType, options, (data) ->
					data = if _.isArray(data) then data else [data]
					
					if data.length is 1
						model = app.handleFetchedModel classType, data[0]
						callbackWithModel model
					else
						callback null

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
			existModel.fetch
				success: (model) ->
					callback model
					model._isCompletelyFetched = true

	Router