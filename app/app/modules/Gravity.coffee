define [
		'app'
		'plugins/gravity/jquery.gravity'
	],
	(app) ->

		Gravity = app.module()


		# this is the main gravity container which has a list with all project overview items in it
		Gravity.Views.Container = Backbone.View.extend
			id: 'gravity-container'
			afterRender: ->
				
				$(@.el).height($(window).height()).RadialGravity 
					worker:
						physics: '/app/assets/js/plugins/gravity/backend/physics.js'
				
		

		Gravity
