define [
		'app'
		'modules/Gravity'
	],
	(app, Gravity) ->

		Portfolio = app.module()


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
				window.picturefill { wrapperTag: 'div', imageTag: 'div' }
			serialize: () ->
				if @.model then @.model.toJSON() else {}


		#! Handlebar helpers
		
		Handlebars.registerHelper 'nameSummary', (persons) ->
			out = ''
			length = persons.length
			if length > 3 then return 'Group project'
			for person, i in persons
				out += person.FirstName + ' ' + person.Surname
				if i < (length - 1)
					out += ' &amp; '
			out

		Handlebars.registerHelper 'niceDate', (model) ->
			return '' unless model.DateRangeNice or model.FrontendDate
			out = '// '
			if model.DateRangeNice
				out += model.DateRangeNice
			else if model.FrontendDate
				out += model.FrontendDate
			out

		Handlebars.registerHelper 'ifProjects', (block) ->
			types = ['Projects', 'ChildProjects', 'ParentProjects']
			@.combinedProjects = []
			_.each types, (type) =>
				if _.isArray @[type]
					@.combinedProjects = @.combinedProjects.concat @[type]
			return if @.combinedProjects.length then block @ else block.inverse @




		Portfolio
