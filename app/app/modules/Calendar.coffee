define [
		'app'
	],
	(app) ->

		Calendar = app.module()

		Calendar.Views.UpcomingContainer = Backbone.View.extend
			tagName: 'ul'
			id: 'upcoming-calendar-container'
			beforeRender: ->
				modelArray = @.collection.where({ IsUpcoming: true })
				if modelArray
					for model in modelArray
						@.insertView '', new Calendar.Views.UpcomingListItem({ model: model })

		Calendar.Views.UpcomingListItem = Backbone.View.extend
			tagName: 'li'
			className: 'upcoming-calendar-list-item'
			template: 'upcoming-calendar-list-item'
			serialize: () ->
				if @.model then @.model.toJSON() else {}


		Calendar.Views.Detail = Backbone.View.extend
			tagName: 'section'
			className: 'calendar-detail'
			template: 'calendar-detail'
			serialize: () ->
				if @.model then @.model.toJSON() else {}


		Calendar
