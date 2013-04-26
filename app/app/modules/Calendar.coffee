define [
		'app'
	],
	(app) ->

		Calendar = app.module()

		Calendar.Views.Container = Backbone.View.extend
			id: 'calendar-container'
			template: 'calendar-container'
			initialize: (options) ->
				@.upcomingEvents = @.collection.where({ IsUpcoming: true })
			serialize: ->
				json = {}
				if @.upcomingEvents and @.upcomingEvents.length then json.HasItems = true
				json

			beforeRender: ->
				for model in @.upcomingEvents
					@.insertView '#calendar-list', new Calendar.Views.ListItem({model: model})

		Calendar.Views.ListItem = Backbone.View.extend
			tagName: 'li'
			className: 'calendar-list-item'
			template: 'calendar-list-item'
			serialize: () ->
				if @.model then @.model.toJSON() else {}


		Calendar.Views.Detail = Backbone.View.extend
			tagName: 'article'
			className: 'portfolio-detail'
			template: 'calendar-detail'
			afterRender: ->
				window.picturefill()
			serialize: ->
				if @.model then @.model.toJSON() else {}


		Calendar
