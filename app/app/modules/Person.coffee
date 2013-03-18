define [
		'app'
	],
	(app) ->

		Person = app.module()

		JJRestApi.Modules.extend 'Person', (Person) ->
			JJRestApi.extendModel 'Person',
				sayHello: ->
					alert 'Hi. My name is ' + @.get('name')

			JJRestApi.extendCollection 'Person', ->

			#Person.Views.Test = Backbone.View.extend({})

		Person
