define [
		'app'
		'modules/DataRetrieval'
		'modules/Auth'
	],
(app, DataRetrieval, Auth) ->
	ProjectEditor = app.module()

	class ProjectEditor.Inst
		constructor: (@model) ->
			# build up our needed views
			@containerView 	= new ProjectEditor.Views.Container { model: @model }
			@previewView  	= new ProjectEditor.Views.Preview { model: @model }
			@mainView 		= new ProjectEditor.Views.Main { model: @model }
			@modelJSON		= @model.toJSON()
		
		kickOffRender: ->
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
		tagName: 'article'
		template: 'security/editor-project-preview'

		getFilterID: ->
			"#{@model.get('ClassName')}-#{@model.id}"

		cleanup: ->
			@uploadZone.cleanup()

		initDropzone: ->
			app.ProjectEditor.PreviewImageZone = @uploadZone = new JJSingleImageUploadZone '.preview-image',
				url: app.Config.DocImageUrl
				additionalData:
					projectId: app.ProjectEditor.model.id
					projectClass: app.ProjectEditor.model.get 'ClassName'
				getFromCache: (id) =>
					DataRetrieval.forDocImage id
				responseHandler: (data) =>

					setPreviewImage = (model, thumbUrl) =>
						img = model.get('Urls')['_320']
						@uploadZone.$dropzone.html "<img src=\"#{ img.Url }\" width=\"#{ img.Width }\" height=\"#{ img.Height }\">"

						# insert into gallery if open and necessary
						if sideSubview = Auth.Cache.userWidget.subView
							if sideSubview.isGallery and sideSubview.isOpen
								if not @model.get('Images').get(model.id)
									sideSubview.insertGalleryImage @getFilterID(), { url: thumbUrl, id: @model.id }

						if @model.get('PreviewImage') isnt model
							@model.set 'PreviewImage', model
							@model.get('Images').add model
							@model.save()

					if data instanceof Backbone.Model is true
						$img = $("[data-filter-id=\"#{@getFilterID()}\"]").find("img[data-id=\"#{data.id}\"]")
						
						setPreviewImage data, $img.attr('src')
					else
						app.updateGalleryCache data

						DataRetrieval.forDocImage(data[0].id).done (model) ->
							setPreviewImage model, data[0].url

			@

		afterRender: ->
			@initDropzone()

		serialize: ->
			app.ProjectEditor.modelJSON


	ProjectEditor.Views.Main = Backbone.View.extend
		tagName: 'div'
		template: 'security/editor-project-main'
		serialize: ->
			app.ProjectEditor.modelJSON


	ProjectEditor