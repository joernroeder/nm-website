define [
		'app'
		'modules/DataRetrieval'
		'modules/Auth'
		'modules/Portfolio'
	],
(app, DataRetrieval, Auth, Portfolio) ->
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

		galleryImageRemoved: (id) ->
			if @model.get('PreviewImage').id is id
				@previewView.removePreviewImage()


	ProjectEditor.Views.Container = Backbone.View.extend
		tagName: 'div'
		className: 'editor-project-container'
		template: 'security/editor-project-container'

		ACTIVE: 'active'

		beforeRender: ->
			@setView '.editor-project-main', app.ProjectEditor.mainView
			@setView '.editor-project-preview', app.ProjectEditor.previewView

		toggleView: ->
			$('.editor-project-main, .editor-project-preview').toggleClass(@ACTIVE)


	ProjectEditor.Views.Preview = Backbone.View.extend
		tagName: 'article'
		template: 'security/editor-project-preview'

		FILLED: 'filled'

		cleanup: ->
			@uploadZone.cleanup()

		getFilterID: ->
			"#{@model.get('ClassName')}-#{@model.id}"

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
						@uploadZone.$dropzone.addClass(@FILLED).html "<img src=\"#{ img.Url }\" />"

						# insert into gallery if open and necessary
						if sideSubview = Auth.Cache.userWidget.subView
							if sideSubview.isGallery and sideSubview.isOpen
								if not @model.get('Images').get(model.id)
									sideSubview.insertGalleryImage @getFilterID(), { url: thumbUrl, id: model.id }

						if @model.get('PreviewImage') isnt model
							@model.set 'PreviewImage', model
							@model.get('Images').add model
							@model.rejectAndSave()
					
					if data instanceof Backbone.Model is true
						$img = $("#editor-sidebar").find("li.DocImage img[data-id=\"#{data.id}\"]")
						
						setPreviewImage data, $img.attr('src')
					else
						app.updateGalleryCache data

						DataRetrieval.forDocImage(data[0].id).done (model) ->
							setPreviewImage model, data[0].url

			@

		initEditor: ->
			@editor = new JJEditor $('.meta'), [
				'InlineEditable'
				'DateEditable'
				'MarkdownEditable'
			]

			@editor.on 'stateUpdate', (e) =>
				_changed = false
				console.log e
				for key, val of e.ProjectPreview
					if key is 'TeaserText' and val then val = val.raw
					if not val then continue
					if @model.get(key) isnt val
						_changed = true
						@model.set key, val
				@model.rejectAndSave() if _changed


			@

		removePreviewImage: ->
			@uploadZone.$dropzone.removeClass(@FILLED).empty()

		afterRender: ->
			@initDropzone()
			@initEditor()

		serialize: ->
			app.ProjectEditor.modelJSON


	ProjectEditor.Views.Main = Backbone.View.extend
		tagName: 'div'
		template: 'security/editor-project-main'
		serialize: ->
			app.ProjectEditor.modelJSON


	ProjectEditor