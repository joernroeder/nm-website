define [
		'app'
	],
	(app) ->

		Excursion = app.module()

		JJRestApi.Modules.extend 'Excursion', (Excursion) ->
			JJRestApi.extendModel 'Excursion', 
				foo: 'bar'
			JJRestApi.extendCollection 'Excursion',
				foo: 'bar'

		Excursion
