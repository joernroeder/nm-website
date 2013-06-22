define [
		'app'
	],
(app) ->

	ProjectEditor = app.module()

	class ProjectEditor.Inst
		constructor: (@model) ->
			# build up our needed views
			@containerView 	= new ProjectEditor.Views.Container { model: @model }
			@previewView  	= new ProjectEditor.Views.Preview { model: @model }
			@mainView 		= new ProjectEditor.Views.Main { model: @model }
			@modelJSON		= @model.toJSON()

			# pass container to layout and kick off
			app.layout.setViewAndRenderMaybe '#project-editor', @containerView

		toggleView: ->
			@containerView.toggleView()



	ProjectEditor.Views.Container = Backbone.View.extend
		tagName: 'div'
		className: 'editor-project-container'
		template: 'security/editor-project-container'

		beforeRender: ->
			@setView '.editor-project-main', app.ProjectEditor.mainView
			@setView '.editor-project-preview', app.ProjectEditor.previewView

		toggleView: ->
			ACTIVE = 'active'
			$('.editor-project-main, .editor-project-preview').toggleClass(ACTIVE)


	ProjectEditor.Views.Preview = Backbone.View.extend
		tagName: 'div'
		template: 'security/editor-project-preview'
		serialize: ->
			app.ProjectEditor.modelJSON


	ProjectEditor.Views.Main = Backbone.View.extend
		tagName: 'div'
		template: 'security/editor-project-main'
		serialize: ->
			app.ProjectEditor.modelJSON


	ProjectEditor