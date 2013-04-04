define [
	'app'
	'modules/Project',
	'modules/Person',
	'modules/Excursion',
	'modules/Workshop',
	'modules/Exhibition',
	'modules/CalendarEntry',
	'modules/PageError'
], (app, Project, Person, Excursion, Workshop, Exhibition, CalendarEntry, PageError) ->

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
			'*url/'									: 'catchAllRoute'		# for example: "Impressum", else 404 error page

		# ! ROUTE CATCHING
		
		index: (hash) ->
			console.info 'index'
			# get featured projects
			DataRetrieval.forProjectsOverview app.Config.Featured, () ->
				console.log app
				console.log 'All featured data is there. Serialize data in featured view and render it.'
			# @todo: get calendar data

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

			if not present.flag
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


	Router