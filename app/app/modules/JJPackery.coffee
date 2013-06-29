define [
		'app'
		'plugins/packery/packerytest'
	],
	(app) ->

		JJPackery = app.module()


		# this is the main gravity container which has a list with all project overview items in it
		JJPackery.Views.Container = Backbone.View.extend
			tagName: 'section'
			className: 'packery-wrapper'
			template: 'packery-container'

			afterRender: ->
				JJPackeryMan()

		

		JJPackery
