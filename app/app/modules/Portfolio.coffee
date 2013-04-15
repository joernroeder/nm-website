define [
		'app'
		'modules/Gravity'
	],
	(app, Gravity) ->

		Portfolio = app.module()


		# this is the main gravity container which has a list with all project overview items in it
		Portfolio.Views.GravityContainer = Gravity.Views.Container.extend
			tagName: 'ul'
			className: 'gravity'
			beforeRender: ->
				console.log 'portfolio before render'
				modelArray = @.collection
				if modelArray
					for model in modelArray
						@.insertView '', new Portfolio.Views.ListItem({ model: model, linkTo: @.options.linkTo })
				

		Portfolio.Views.ListItem = Backbone.View.extend
			tagName: 'li'
			className: 'gravity-item'
			template: 'gravity-list-item'
			serialize: () ->
				data = if @.model then @.model.toJSON() else {}
				data.LinkTo = @.options.linkTo
				data

		Portfolio.Views.Detail = Backbone.View.extend
			tagName: 'section'
			className: 'portfolio-detail'
			template: 'portfolio-detail'
			serialize: () ->
				if @.model then @.model.toJSON() else {}


		Portfolio
