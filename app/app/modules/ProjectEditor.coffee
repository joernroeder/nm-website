define [
		'app'
		'modules/DataRetrieval'
		'modules/Auth'
		'modules/Portfolio'
		'modules/NMMarkdownParser'
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

			# trigger globally that we edit a project now
			Backbone.Events.trigger 'projectEdited', @model
			@model.on 'saved', @modelHasSaved, @
		
		kickOffRender: ->
			# pass container to layout and kick off
			app.layout.setViewAndRenderMaybe '#project-editor', @containerView

		getFilterID: ->
			"#{@model.get('ClassName')}-#{@model.id}"

		toggleView: ->
			@containerView.toggleView()

		galleryImageRemoved: (id) ->
			previewImage = @model.get('PreviewImage')
			if previewImage and previewImage.id is id
				@previewView.removePreviewImage()

		modelHasSaved: ->
			# synchronize data between the two views without re-rendering the whole thing
			# syncrhonize title
			title = @model.get 'Title'
			selector = '[data-editor-name="Title"]'
			@previewView.$el.find(selector).text title
			@mainView.$el.find(selector).text title

		cleanup: ->
			@model.off 'saved', @modelHasChanged


	ProjectEditor.Views.Container = Backbone.View.extend
		tagName: 'div'
		className: 'editor-project-container'
		template: 'security/editor-project-container'

		ACTIVE: 'active'

		beforeRender: ->
			@setView '.editor-project-main', app.ProjectEditor.mainView
			@setView '.editor-project-preview', app.ProjectEditor.previewView

		toggleView: ->
			for name, view of @views
				if view.editor
					view.editor.trigger 'editor.closepopovers'

			$('.editor-project-main, .editor-project-preview').toggleClass(@ACTIVE)


	ProjectEditor.Views.Preview = Backbone.View.extend
		tagName: 'article'
		template: 'security/editor-project-preview'

		FILLED: 'filled'

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
						@uploadZone.$dropzone.addClass(@FILLED).html "<img src=\"#{ img.Url }\" />"

						# insert into gallery if open and necessary
						if _.indexOf(@model.get('Images').getIDArray(), model.id) < 0
							img = [{ FilterID: app.ProjectEditor.getFilterID(), UploadedToClass: 'DocImage', id: model.id, url: thumbUrl }]
							app.updateGalleryCache img
							Backbone.Events.trigger 'DocImageAdded', img

						if @model.get('PreviewImage') isnt model
							@model.set 'PreviewImage', model
							@model.get('Images').add model
							@model.rejectAndSave()
					
					if data instanceof Backbone.Model is true
						$img = $("#editor-sidebar").find("li.DocImage img[data-id=\"#{data.id}\"]")
						
						setPreviewImage data, $img.attr('src')
					else
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
		tagName: 'article'
		template: 'security/editor-project-main'

		initEditor: ->
			@editor = new JJEditor @.$el, [
				'InlineEditable'
				'DateEditable'
				'SplitMarkdownEditable'
				'SelectEditable'
			]

			# dynamic options update
			markdownEditor = @editor.getComponentByName('ProjectMain.Text').markdown
			_.extend markdownEditor.options,
				# also POST our current project when uploading an image
				additionalPOSTData: 
					projectId: app.ProjectEditor.model.id
					projectClass: app.ProjectEditor.model.get 'ClassName'
				uploadResponseHandler: (data) ->
					app.updateGalleryCache data
					Backbone.Events.trigger 'DocImageAdded', data


			@editor.on 'editor.open-split-markdown', ->
				$('#layout').addClass 'open-split-markdown'
			@editor.on 'editor.close-split-markdown', ->
				$('#layout').removeClass 'open-split-markdown'

			@editor.on 'stateUpdate', (e) =>
				_changed = false
				for key, val of e.ProjectMain
					if key is 'Text'
						text = if val.raw then val.raw else ''

						if text isnt @model.get('Text')
							_changed = true
							@model.set 'Text', text

						# check if there are any images which aren't yet added to our project
						# ghetto logic, sorry
						if val.images
							_.each val.images.ids, (id, i) =>
								found = false
								@model.get('Images').each (projImage) =>
									found = true if projImage.id is id
								
								if not found
									DataRetrieval.forDocImage(id).done (model) =>
										# add it to our model
										@model.get('Images').add model
										existImg = app.getFromGalleryCache('DocImage', model.id)
									
										theImg = [{ FilterID: app.ProjectEditor.getFilterID(), UploadedToClass: 'DocImage', id: model.id, url: existImg.url }]
										app.updateGalleryCache theImg
										Backbone.Events.trigger 'DocImageAdded', theImg


				@model.rejectAndSave() if _changed

			@

		populateSelectEditables: ->
			sanitize = 
				'Person': (list) =>
					source = []
					personId = app.CurrentMemberPerson.id
					_.each list, (person) =>
						source.push person if person.ID isnt personId
					
					values = _.without @model.get('Person').getIDArray(), personId
					{source: source, values: values}

			for type in ['Project', 'Excursion', 'Exhibition', 'Workshop']
				do (type) =>
					sanitize[type] = =>
						source = []
						_.each list, (obj) =>
							source.push obj if @model.get('ClassName') isnt type and @model.id isnt obj.ID
						values = _.without @model.get(type + 's').getIDArray(), @model.id
						{source: source, values: values}



			$.getJSON(app.Config.BasicListUrl).done (res) =>
				@basicList = res if _.isObject(res)

				selectables = @editor.getComponentsByType 'select'
				if selectables and @basicList
					$.each selectables, (i, selectable) =>
						name = selectable.getDataName()
						if @basicList[name]
							source_vals = sanitize[name](@basicList[name]) if sanitize[name]
							if source_vals
								selectable.setSource source_vals.source
								selectable.setValue source_vals.values

		serialize: ->
			app.ProjectEditor.modelJSON

		afterRender: ->
			@initEditor()
			@populateSelectEditables()


	ProjectEditor