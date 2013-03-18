define [
		'app'
	],
	(app) ->

		CalendarEntry = app.module()

		JJRestApi.Modules.extend 'CalendarEntry', (CalendarEntry) ->
			JJRestApi.extendModel 'CalendarEntry', 
				foo: 'bar'
			JJRestApi.extendCollection 'CalendarEntry',
				foo: 'bar'

		CalendarEntry
