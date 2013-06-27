define [
		'app'
		'modules/SuperProject'
	],
	(app, SuperProject) ->

		Exhibition = app.module()

		JJRestApi.Modules.extend 'Exhibition', (Exhibition) ->
			JJRestApi.extendModel 'Exhibition', SuperProject.Model,
				foo: 'bar'
			JJRestApi.extendCollection 'Exhibition',
				foo: 'bar'

		Exhibition
