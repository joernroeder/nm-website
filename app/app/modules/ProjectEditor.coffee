define [
		'app'
		'modules/DataRetrieval'
		'modules/Auth'
		'modules/Portfolio'
		'modules/Website'
		'modules/NMMarkdownParser'
	],
(app, DataRetrieval, Auth, Portfolio, Website) ->
	
	ProjectEditor = app.module()

	class ProjectEditor.Inst
		constructor: (@model) ->
			# build up our needed views
			@containerView 	= new ProjectEditor.Views.Container { model: @model }
			@previewView  	= new ProjectEditor.Views.Preview { model: @model }
			@mainView 		= new ProjectEditor.Views.Main { model: @model }
			@modelJSON		= _.extend @model.toJSON(), CurrentMemberPerson: app.CurrentMemberPerson.toJSON()

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
				'SelectPersonEditable'
				'SelectListEditable'
				'SelectListConfirmEditable'
				'ModalEditable'
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
				@stateUpdate e

			@editor.on 'submit:ProjectMain.Website', (val) =>
				if val.Title and val.Link
					MType = JJRestApi.Model 'Website'
					website = new MType({ Title: val.Title, Link: val.Link })
					@model.get('Websites').add website
					@addWebsiteView website, true
					@model.save()

			@

		# save stuff
		stateUpdate: (e) ->
			console.group 'STATE UPDATE'
			console.log 'this: %o', @
			console.log 'state: ', e.ProjectMain
			_changed = false
			_populateEditors = false

			# iterate over our values
			for key, val of e.ProjectMain
				# !- Handle exceptions first
				
				# 1.) Text
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

				# 2.) Excursion / Exhibition / Workshop / Project
				else if _.indexOf(['Excursion', 'Exhibition', 'Workshop', 'Project'], key) >= 0
					relKey = if key is 'Project' and @model.get('ClassName') is 'Project' then 'ChildProjects' else key + 's'
					if @model.setRelCollByIds(relKey, val) then _changed = true

				# 3.) Person
				else if key is 'Person'
					# always add yourself
					val.push app.CurrentMemberPerson.id
					if @model.setRelCollByIds('Persons', val)
						_populateEditors = true
						_changed = true

				# 4.) Category
				else if key is 'Category'
					if @model.setRelCollByIds('Categories', val) then _changed = true

				# 5.) BlockedEditors / Editors
				else if key is 'BlockedEditors' or key is 'Editors'
					if _.difference(val, app.ProjectEditor[key]).length > 0 or _.difference(app.ProjectEditor[key], val).length > 0
						app.ProjectEditor[key] = val
						toPost =
							className: @model.get('ClassName')
							id: @model.id
							editors : val

						existPost = app.ProjectEditor.ChangeEditorsPost
						if existPost and existPost.readyState isnt 4 then existPost.abort()
						newPost = app.ProjectEditor.ChangeEditorsPost = $.post(app.Config.ChangeEditorsUrl,toPost)

						newPost.done (confirmed) =>
							if _.difference(confirmed, app.ProjectEditor[key]).length > 0 or _.difference(app.ProjectEditor[key], confirmed).length > 0
								console.log 'change to confirmed'
								app.ProjectEditor[key] = confirmed
								_populateEditors = true

				# normal attribute
				else if key is 'Title' and @model.get('Title') isnt val
					@model.set 'Title', val
					_changed = true


			console.groupEnd()
			
			if _changed
				xhr = @model.rejectAndSave()
				if xhr then xhr.done (model) =>
					@populateEditorsSelectable(@model.getEditorsKey(), false) if _populateEditors

		populateSelectEditables: ->
			sanitize = 
				'Person': (list) =>
					source = []
					personId = app.CurrentMemberPerson.id
					_.each list, (person) =>
						source.push person if person.ID isnt personId
					
					values = _.without @model.get('Persons').getIDArray(), personId
					{source: source, values: values}

				'Category': (list) =>
					{ source: list, values: @model.get('Categories').getIDArray() }


			for type in ['Project', 'Excursion', 'Exhibition', 'Workshop']
				do (type) =>
					sanitize[type] = (list) =>
						source = []
						_.each list, (obj) =>
							source.push(obj) if not (@model.get('ClassName') is type and @model.id is obj.ID)
						
						values = @model.idArrayOfRelationToClass type					
						
						{source: source, values: values}


			$.getJSON(app.Config.BasicListUrl).done (res) =>
				@basicList = res if _.isObject(res)
				selectSubClasses = ['select-list', 'select-person']
				selectables = @editor.getComponentsByType 'select'

				for subClass in selectSubClasses
					selectables = selectables.concat @editor.getComponentsByType subClass

				if selectables and @basicList
					$.each selectables, (i, selectable) =>
						name = selectable.getDataName()
						if @basicList[name]
							source_vals = sanitize[name](@basicList[name]) if sanitize[name]
							
							if source_vals
								selectable.setSource source_vals.source, true
								selectable.setValue source_vals.values, true

			for type in ['BlockedEditors', 'Editors']
				do (type) =>
					if selectable = @editor.getComponentByName 'ProjectMain.' + type
						# get editors from server without revealing member ids
						$.getJSON(app.Config.GetEditorsUrl, { className: @model.get('ClassName'), id: @model.id }).done (ids) =>
							if _.isArray(ids)
								app.ProjectEditor[type] = ids
								@populateEditorsSelectable type

		populateEditorsSelectable: (type, silent = true) ->
			if selectable = @editor.getComponentByName 'ProjectMain.' + type
				personsIdList = @model.basicListWithoutCurrentMember('Persons')
				personsIdArray = _.map personsIdList, (o) ->
					o.ID

				selectable.setSource personsIdList, silent
				app.ProjectEditor[type] = _.intersection(app.ProjectEditor[type], personsIdArray)
				selectable.setValue app.ProjectEditor[type], silent	

		addWebsiteView: (model, render) ->
			view = new Website.Views.ListView({ model: model })
			@insertView '.websites', view
			view.render() if render
			true

		serialize: ->
			app.ProjectEditor.modelJSON

		beforeRender: ->
			@model.get('Websites').each (website) =>
				@addWebsiteView website

		afterRender: ->
			@initEditor()
			@populateSelectEditables()

		


	ProjectEditor