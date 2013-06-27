define [
		'app'
		'modules/SuperProject'
	],
	(app, SuperProject) ->

		Workshop = app.module()

		JJRestApi.Modules.extend 'Workshop', (Workshop) ->

			JJRestApi.extendModel 'Workshop', SuperProject.Model,
				foo: 'bar'
			JJRestApi.extendCollection 'Workshop',
				foo: 'bar'

		Workshop
