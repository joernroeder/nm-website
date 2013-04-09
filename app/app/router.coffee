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
			DataRetrieval.forProjectsOverview config.Featured, () =>
				modelsArray = @.getProjectTypeModels { IsFeatured: true }
				@.showGravityViewForModels modelsArray, layout

			# get upcoming calendar data
			DataRetrieval.forCalendar 'upcoming', () ->
				calendarContainer = new Calendar.Views.UpcomingContainer({ collection: app.Collections.CalendarEntry })
				layout.setViewAndRenderMaybe '#upcoming-calendar', calendarContainer

		showAboutPage: () ->
			layout = app.useLayout 'main'
			# internal flags to check if all data's present
			groupImage = null
			persons = null

			checkAndRender = ->
				if groupImage and persons
					view = new About.Views.Gravity { groupImage: groupImage, persons: persons }
					layout.setViewAndRenderMaybe '', view

			# @todo: data we need: Statement, a random group image, all the persons (with their images, excluding externals) 
			
			# First, let's get the group image. We'll store it in app.PageInfos, as that's super basic funky info
			DataRetrieval.forRandomGroupImage (image) ->
				groupImage = image
				checkAndRender()
			# Let's get the motrfukig persons
			DataRetrieval.forPersonsOverview () ->
				coll = app.Collections['Person']
				persons =
					students : coll.where { IsStudent: true }
					alumnis : coll.where { IsAlumni: true }
					employees : coll.where { IsEmployee: true }
				checkAndRender()



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
	
		forProjectsOverview: (configObj, callback) ->
			present = configObj.present
			projectTypes = app.Config.ProjectTypes

			# check if all data has been fetched. if yes, set flag and callback
			checkAndCallback = ->
				done = true
				for projectType in projectTypes
					if _.indexOf(present.types, projectType) < 0 then done = false
				if done
					present.flag = true
					callback()

			unless present.flag
				# featured Projects/Exhibitions/Workshops/Excursions are not yet present
				# get them either from DOM or API
				for projectType in projectTypes
					do (projectType) ->
						if _.indexOf(present.types, projectType) < 0
							options = 
								name: configObj.domName(projectType)
								urlSuffix : configObj.urlSuffix
							JJRestApi.getFromDomOrApi projectType, options, (data) ->
								present.types.push projectType
								app.handleFetchedModels projectType, data
								checkAndCallback()

			else
				callback()

		# abstract function to get data for the Calendar (either the whole calendar, or merely the upcoming events)
		forCalendar: (type, callback) ->
			config = app.Config.Calendar[type]

			unless config.flag
				options = _.clone config
				options.name = type + '-calendar'

				JJRestApi.getFromDomOrApi 'CalendarEntry', options, (data) ->
					# set an internal "IsUpcoming" flag for faster accessing
					if type is 'upcoming'
						for item in data
							item.IsUpcoming = true
					app.handleFetchedModels 'CalendarEntry', data
					config.flag = true
					if type is 'whole' then app.Config.Calendar.upcoming.flag = true
					callback()
			else
				callback()

		# function to get persons' data for the "About"-page
		# namely all persons except externals
		forPersonsOverview: (callback) ->
			config = app.Config.Person

			unless config.about_present
				options = _.clone config
				JJRestApi.getFromDomOrApi 'Person', options, (data) ->
					config.about_present = true
					app.handleFetchedModels 'Person', data
					callback()
			else
				callback()

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
		forRandomGroupImage: (callback) ->
			pageInfos = app.PageInfos
			getRandomAndCallback = ->
				groupImages = pageInfos.GroupImages
				if groupImages.length > 0
					callback groupImages[Math.floor(Math.random() * groupImages.length)]
			unless pageInfos.GroupImages
				JJRestApi.getFromDomOrApi 'GroupImage', (data) ->
					pageInfos.GroupImages = data
					getRandomAndCallback()		
			else
				getRandomAndCallback()

		# abstract function that calls `fetch` on a model and then calls back
		fetchExistingModelCompletely : (existModel, callback) ->
			existModel.fetch
				success: (model) ->
					callback model
					model._isCompletelyFetched = true

	Router