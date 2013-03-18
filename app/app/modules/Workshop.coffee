define [
		'app'
	],
	(app) ->

		Workshop = app.module()

		JJRestApi.Modules.extend 'Workshop', (Workshop) ->
			JJRestApi.extendModel 'Workshop', 
				foo: 'bar'
			JJRestApi.extendCollection 'Workshop',
				foo: 'bar'

		Workshop
