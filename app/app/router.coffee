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
	'modules/Calendar'
], (app, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, PageError, Portfolio, Calendar) ->

	###*
	 *
	 *	All the URL routing is done here.
	 *	Our router also serves as the data retrieving interface. All data getting logic is
	 *	handled here. 
	 * 
	###

	Router = Backbone.Router.extend
		routes:
			''										: 'index'				# Calendar and featured projects
			'about/'								: 'showAboutPage'		# About page (Students, Statement etc.)
			'about/student/:nameSlug/'				: 'showStudentPage'		# Student page with normal or custom template
			'about/student/:nameSlug/:uglyHash/'	: 'showStudentDetailed' # Project with normal or custom template
			'portfolio/'							: 'showPortfolio'		# All projects
			'portfolio/:slug/'						: 'showPortfolioDetailed' # can be filter or detail of project
			'calendar/'								: 'showCalendar'		# whole calendar
			'calendar/:slug/'						: 'showCalendarDetailed' # show a detailed calendar event
			'*url/'									: 'catchAllRoute'		# for example: "Impressum", else 404 error page

		# ! ROUTE CATCHING
		
		index: (hash) ->
			config = app.Config
			layout = app.useLayout 'index'

			# get featured projects
			DataRetrieval.forProjectsOverview config.Featured, () ->
				console.log 'All featured data is there. Serialize data in featured view and render it.'
				featured = []
				for projectType in config.ProjectTypes
					featured = featured.concat app.Collections[projectType].where({ IsFeatured: true })
				# this isn't really a collection, but we assign it to it anyway ;)
				gravityContainer = new Portfolio.Views.GravityContainer({ collection: featured })
				layout.setView '#gravity', gravityContainer

			# get upcoming calendar data
			DataRetrieval.forCalendar 'upcoming', () ->
				calendarContainer = new Calendar.Views.UpcomingContainer({ collection: app.Collections.CalendarEntry })
				layout.setView '#upcoming-calendar', calendarContainer

		showAboutPage: () ->
			console.info 'about page'

		showStudentPage: (nameSlug) ->
			console.info 'show student page of %s', nameSlug
			console.info 'check if student has custom template'

		showStudentDetailed: (nameSlug, uglyHash) ->
			console.info 'show project %s of %s', uglyHash, nameSlug
			console.info 'check if student has custom template for details'

		showPortfolio: () ->
			console.info 'show portfolio'
			# get portfolio projects
			DataRetrieval.forProjectsOverview app.Config.Portfolio, () ->
				console.log app
				console.log 'All portfolio data is there. Serialize shit in portfolio view and render it'

		showPortfolioDetailed: (slug) ->
			console.info 'portfolio with uglyHash/Filter %s', slug
			console.info 'check if slug is filter or uglyHash and handle page accordingly'

		showCalendar: () ->
			console.info 'show whole calendar'

		showCalendarDetailed: (slug) ->
			console.info 'calendar event with slug %s', slug
			console.info 'get calendar detailed data with slug and show'

		catchAllRoute: (url) ->
			app.Layout = app.useLayout 'main',
				views:
					'': new PageError.Views.FourOhFour({attributes: {'data-url': url}})


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


	Router