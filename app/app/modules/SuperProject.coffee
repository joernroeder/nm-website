define [
		'app'
	],
	(app) ->

		SuperProject = app.module()

		SuperProject.Model = Backbone.JJRelationalModel.extend
			hasRelationTo: (type, id) ->
				console.log 'check if it has relation to: %o, %o', type, id
				console.log @


		SuperProject
