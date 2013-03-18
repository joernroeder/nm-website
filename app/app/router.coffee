define [
	'app'
], (app) ->

	Router = Backbone.Router.extend
		routes:
			''										: 'index'				# Calendar and featured projects
			'about/'								: 'showAboutPage'		# About page (Students, Statement etc.)
			'about/student/:nameSlug/'				: 'showStudentPage'		# Student page with normal or custom template
			'about/student/:nameSlug/:uglyHash/'	: 'showStudentDetailed' # Project with normal or custom template
			'portfolio/'							: 'showPortfolio'		# All projects
			'portfolio/:slug/'						: 'showPortfolioDetailed' # can be filter or detail of project
			'*url/'									: 'catchAllRoute'		# for example: "Impressum", else 404 error page

		index: (hash) ->
			console.log 'index'

		showAboutPage: () ->
			console.log 'show about page'

		showStudentPage: (nameSlug) ->
			console.log 'show student page of %s', nameSlug
			console.log 'check if student has custom template'

		showStudentDetailed: (nameSlug, uglyHash) ->
			console.log 'show project %s of %s', uglyHash, nameSlug
			console.log 'check if student has custom template for details'

		showPortfolio: () ->
			console.log 'show portfolio'

		showPortfolioDetailed: (slug) ->
			console.log 'portfolio with uglyHash/Filter %s', slug
			console.log 'check if slug is filter or uglyHash and handle page accordingly'

		catchAllRoute: (url) ->
			console.log 'catching url %s', url
			console.log 'find page with url, else four oh four'

	return Router