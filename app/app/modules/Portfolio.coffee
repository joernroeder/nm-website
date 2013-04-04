define [
		'app'
	],
	(app) ->

		Portfolio = app.module()


		# this is the main gravity container which has a list with all project overview items in it
		Portfolio.Views.GravityContainer = Backbone.View.extend
			tagName: 'ul'
			id: 'gravity-container'
			className: 'gravity'
			beforeRender: ->
				modelArray = @.collection
				if modelArray
					for model in modelArray
						@.insertView '', new Portfolio.Views.ListItem({ model: model })

		Portfolio.Views.ListItem = Backbone.View.extend
			tagName: 'li'
			className: 'gravity-list-item'
			template: 'gravity-list-item'
			serialize: () ->
				if @.model then @.model.toJSON() else {}


		Portfolio
