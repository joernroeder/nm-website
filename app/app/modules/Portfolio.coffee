define [
		'app'
		'modules/Gravity'
	],
	(app, Gravity) ->

		Portfolio = app.module()

		Portfolio.Config =
			person_group_length : 4
			group_project_title : 'Group project'

		# this is the main gravity container which has a list with all project overview items in it
		Portfolio.Views.GravityContainer = Gravity.Views.Container.extend
			tagName: 'section'
			beforeRender: ->
				console.log 'portfolio before render'
				modelArray = @.collection
				if modelArray
					for model in modelArray
						@.insertView '', new Portfolio.Views.ListItem({ model: model, linkTo: @.options.linkTo })
				

		Portfolio.Views.ListItem = Backbone.View.extend
			tagName: 'article'
			className: 'gravity-item'
			template: 'gravity-list-item'
			serialize: () ->
				data = if @.model then @.model.toJSON() else {}
				data.LinkTo = @.options.linkTo
				data

		Portfolio.Views.Detail = Backbone.View.extend
			tagName: 'article'
			className: 'portfolio-detail'
			template: 'portfolio-detail'
			afterRender: ->
				window.picturefill()
			serialize: ->
				json = if @.model then @.model.toJSON() else {}
				types = ['Projects', 'ChildProjects', 'ParentProjects']

				# check for person group length
				if json.Persons.length > Portfolio.Config.person_group_length
					json.IsGroup = true

				# set up combined projects
				json.combinedProjects = []
				_.each types, (type) =>
					if _.isArray json[type]
						json.combinedProjects = json.combinedProjects.concat json[type]
				json


		#! Handlebar helpers
		
		Handlebars.registerHelper 'nameSummary', (persons) ->
			conf = Portfolio.Config
			return conf.group_project_title unless persons.length < conf.person_group_length
			out = ''
			length = persons.length
			_.each persons, (person, i) ->
				out += person.FirstName + ' ' + person.Surname
				if i < (length - 2)
					out += ', '
				else if i < (length - 1)
					out += ' &amp; '

			out

		Handlebars.registerHelper 'niceDate', (model) ->
			return false unless model.DateRangeNice or model.FrontendDate
			out = ''
			if model.DateRangeNice
				out += model.DateRangeNice
			else if model.FrontendDate
				out += model.FrontendDate
			out

		Handlebars.registerHelper 'teaserMeta', ->
			niceDate = Handlebars.helpers.niceDate @
			if @.ClassName is 'Project'
				nameSummary = Handlebars.helpers.nameSummary @.Persons
				return "#{nameSummary} // #{niceDate}" 
			else 
				return niceDate

			


		Handlebars.registerHelper 'portfoliolist', (items, title, options) ->
			if not options
				options = title
				title = ''
			title += if items.length > 1 then 's' else ''
			out = "<h4>#{title}</h4>"
			out += '<ul>'
			console.log items
			_.each items, (item) ->
				if item.IsPortfolio
					out += '<li><a href="/portfolio/' + item.UglyHash + '/">' + item.Title + '</a></li>'
			out += '</ul>'
			out





		Portfolio
