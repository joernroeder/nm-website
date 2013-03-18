define [
		'app'
	],

	(app) ->

		Project = app.module()

		JJRestApi.Modules.extend Project, (Project) ->

			JJRestApi.extendModel 'Project',
				sayHello: ->
					console.log 'I am a project model'

			JJRestApi.extendCollection 'Project',
				sayHello: ->
					console.log 'I am a project collection'

			Project.Views.Test = Backbone.View.extend
				template: 'head'
				tagName: 'div'
				className: 'head'

		Project