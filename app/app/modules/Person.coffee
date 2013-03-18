define [
		'app'
	],
	(app) ->

		Person = app.module()

		JJRestApi.Modules.extend 'Person', (Person) ->
			JJRestApi.extendModel 'Person', 
				foo: 'bar'
			JJRestApi.extendCollection 'Person',
				foo: 'bar'

			#Person.Views.Test = Backbone.View.extend({})

		Person
