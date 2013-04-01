define [
		'app'
	],
	(app) ->

		SuperProject = app.module()

		SuperProject.Model = Backbone.JJRelationalModel.extend
			doFoo: ->
				console.log 'bar'


		SuperProject
