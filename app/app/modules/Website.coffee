define [
		'app',
		'modules/RecycleBin'
	],
(app, RecycleBin) ->

	"use strict"

	Website = app.module()

	Website.Views.ListView = Backbone.View.extend
		tagName: 'li'
		template: 'website-list-item'
		className: 'Website'

		serialize: ->
			{
				ID: @model.id
				Title: @model.get('Title')
				Link: @model.get('Link')
			}

		afterRender: ->
			RecycleBin.setViewAsRecyclable @

	Website
