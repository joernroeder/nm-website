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
			@.getFeaturedData () ->
				console.log 'All data is there. Serialize data in view and render it.'

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

		showPortfolioDetailed: (slug) ->
			console.info 'portfolio with uglyHash/Filter %s', slug
			console.info 'check if slug is filter or uglyHash and handle page accordingly'

		catchAllRoute: (url) ->
			app.Layout = app.useLayout 'main',
				views:
					'': new PageError.Views.FourOhFour({attributes: {'data-url': url}})


		# ! DATA RETRIEVAL
		
		getFeaturedData: (callback) ->
			feat = app.Config.Featured
			projectTypes = app.Config.ProjectTypes
			dones = {}

			# check if all data has been fetched. if yes, set flag and callback
			checkAndCallback = ->
				done = true
				for projectType in projectTypes
					if not dones[projectType] then done = false
				if done
					feat.present = true
					callback()

			if not feat.present
				# featured Projects/Exhibitions/Workshops/Excursions are not yet present
				# get them either from DOM or API
				for projectType in projectTypes
					options = 
						type: projectType
						name: feat.domName(projectType)
						urlSuffix : feat.urlSuffix
					JJRestApi.getFromDomOrApi projectType, options, (data, _opts) ->
						dones[_opts.type] = true
						checkAndCallback()

			# @todo get calendar data
			else
				callback()
			



	Router