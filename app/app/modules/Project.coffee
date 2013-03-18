define [
		'app'
	],

	(app) ->

		Project = app.module()

		JJRestApi.Modules.extend Project, (Project) ->

			JJRestApi.extendModel 'Project',

			JJRestApi.extendCollection 'Project',


			Project.Views.Test = Backbone.View.extend
				template: 'head'
				tagName: 'div'
				className: 'head'

		Project