define [
		'app'
	],
(app, Gravity, Portfolio) ->

	DocImage = app.module()

	JJRestApi.Modules.extend 'DocImage', (DocImage) ->
		JJRestApi.extendModel 'DocImage', 
			###*
			 * used for Image markdown parser to determine if the member may see this image or not
			 * @return {boolean}
			###
			isVisibleForMember: ->
				isVisible = false
				_.each ['Projects', 'Workshops', 'Exhibitions', 'Excursions'], (type) =>
					if @get(type).findWhere({ EditableByMember: true }) then isVisible = true
				isVisible

		JJRestApi.extendCollection 'DocImage',
			foo: 'bar'