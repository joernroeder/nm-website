define [
		'app'
	],
	(app) ->

		Exhibition = app.module()

		JJRestApi.Modules.extend 'Exhibition', (Exhibition) ->
			JJRestApi.extendModel 'Exhibition', 
				foo: 'bar'
			JJRestApi.extendCollection 'Exhibition',
				foo: 'bar'

		Exhibition
