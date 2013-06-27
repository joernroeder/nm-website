define [
		'app'
		'modules/SuperProject'
	],
	(app, SuperProject) ->

		Excursion = app.module()

		JJRestApi.Modules.extend 'Excursion', (Excursion) ->
			JJRestApi.extendModel 'Excursion', SuperProject.Model,
				foo: 'bar'
			JJRestApi.extendCollection 'Excursion',
				foo: 'bar'

		Excursion
