define [
		'app'
	],
	(app) ->

		PageError = app.module()
		
		PageError.Views.FourOhFour = Backbone.View.extend
			template: '404'
			tagName: 'div'
			className: 'page-error'
			serialize: ->
				{url: @.attributes['data-url']}

		return PageError
