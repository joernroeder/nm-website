define [
		'app'
		'modules/SuperProject'
	],

	(app, SuperProject) ->

		Project = app.module()

		JJRestApi.Modules.extend Project, (Project) ->

			JJRestApi.extendModel 'Project', SuperProject.Model,
				foo: 'bar'
			JJRestApi.extendCollection 'Project',
				foo: 'bar'

			Project.Views.Test = Backbone.View.extend
				template: 'head'
				tagName: 'div'
				className: 'head'

		Project