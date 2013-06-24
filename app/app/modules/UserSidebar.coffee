define [
		'app'
		'modules/DataRetrieval'
		'modules/RecycleBin'
		'plugins/misc/spin.min'
		'plugins/misc/jquery.list'
		'plugins/editor/jquery.jjdropzone'
		'plugins/editor/jquery.jjmarkdown'
		'plugins/editor/jquery.editor-popover'
	],
	(app, DataRetrieval, RecycleBin, Spinner) ->

		"use strict"

		UserSidebar = app.module()

		UserSidebar.config = {}
		UserSidebar.config.spinner = 
			lines: 13				# The number of lines to draw
			length: 6				# The length of each line
			width: 2				# The line thickness
			radius: 7				# The radius of the inner circle
			#lines: 13				# The number of lines to draw
			#length: 16				# The length of each line
			#width: 5				# The line thickness
			#radius: 16				# The radius of the inner circle
			corners: 1				# Corner roundness (0..1)
			rotate: 0				# The rotation offset
			direction: 1			# 1: clockwise, -1: counterclockwise
			color: '#fff'			# #rgb or #rrggbb
			speed: 1 				# Rounds per second
			trail: 70				# Afterglow percentage
			shadow: false			# Whether to render a shadow
			hwaccel: false			# Whether to use hardware acceleration
			className: 'spinner'	# The CSS class to assign to the spinner
			zIndex: 2e9				# The z-index (defaults to 2000000000)
			top: 'auto'				# Top position relative to parent in px
			left: 'auto'			# Left position relative to parent in px

		UserSidebar.construct = ->
			view = new UserSidebar.Views.Main()
			view.$el.appendTo '#editor-sidebar'
			view.render()
			view

		UserSidebar.setPendingReq = (req) ->
			if @.pendingRequest
				@.pendingRequest.reject()
			@.pendingRequest = req
			@.pendingRequest.always =>
				@.pendingRequest = null

		UserSidebar.Views.Main = Backbone.View.extend
			tagName: 'div'
			className: 'editor-sidebar'
			#el: $('#editor-sidebar')
			template: 'security/editor-sidebar'

			availableSubViews:
				'user'		: 'UserSidebar'
				'gallery'	: 'GallerySidebar'

			subView: null

			events:
				'click [data-editor-sidebar-content]': 'toggleSidebarCheck'
				'click .icon-switch': 'switchEditorView'
			
			# !- Custom
			
			switchEditorView: (e) ->
				e.preventDefault()
				if app.isEditor then app.ProjectEditor.toggleView()
				false
			
			toggleSidebarCheck: (e) ->
				e.preventDefault()

				$target = $ e.target
				toShow = $target.data 'editor-sidebar-content'
				subViewName = @.getSubviewName toShow

				if @.subViewName is subViewName
					if not @.subView.__manager__.hasRendered then return false
					$target.toggleClass 'active'
					@.toggle()
				else if subViewName
					$target.parents('nav').find('.active').removeClass('active').end().end().addClass 'active'
					@.setSubview subViewName, true # doRender = true
					@.open true # switched = true

				false

			toggleEditorClass: (isEditor) ->
				method = if isEditor then 'addClass' else 'removeClass'
				if method is 'removeClass' and @.$el.hasClass('is-editor')
					@.close()
					@.setSubview()
				@.$el[method]('is-editor')


			triggerSubview: (method) ->
				args = Array.prototype.slice.call arguments
				methodName = 'on' + method.charAt(0).toUpperCase() + method.slice 1

				if @.subView
					if @.subView[methodName]
						@.subView[methodName].apply @.subView, args.slice(1)

			getSubviewName: (toShow) ->
				if @.availableSubViews[toShow] then @.availableSubViews[toShow] else false

			setSubview: (subViewName, doRender) ->
				if subViewName 
					@.subViewName = subViewName
					@.subView = new UserSidebar.Views[subViewName]()
					@.subView.parentView = @
					@.startSpinner()

					@.setView '#editor-sidebar-container', @.subView
		
					if doRender then @.subView.render()
				else 
					# remove current subview
					if @.subView then @.subView.remove()
					@.subView = null
					@.subViewName = null

			open: (switched) ->
				@.$el.addClass 'open'

				setTimeout =>
					@.triggerSubview 'opened', switched
					@.$el.addClass 'opened'
				, 300

			close: ->
				@.triggerSubview 'close'
				@.$el.removeClass('open').find('nav .active').removeClass('active')
				setTimeout =>
					@.$el.removeClass 'opened'
				, 300

			toggle: ->
				if @.$el.hasClass 'open'
					@close()
				else
					@open()

			initSpinner: ->
				@.spinner = 
					inst: new Spinner UserSidebar.config.spinner
					target: $('#editor-sidebar-spinner', @.$el)[0]

			startSpinner: ->
				spinner = @.spinner
				$(spinner.target).addClass 'active'
				spinner.inst.spin(spinner.target)

			stopSpinner: ->
				spinner = @.spinner
				$(spinner.target).removeClass 'active'
				spinner.inst.stop()

			afterRender: ->
				@.initSpinner()


		UserSidebar.Views.SidebarContainer = Backbone.View.extend
			$sidebarHeader: null
			$sidebarContent: null
			parentView: null

			className: 'editor-sidebar-container'

			columnsPrefix: 'columns-'

			galleryData: {}

			initSidebar: ->
				@.$sidebarHeader = $ '> header', @.$el
				@.$sidebarContent = $ 'section.editor-sidebar-content', @.$el
				@.setSidebarHeight()
				# register window events
				
				$.addOnWindowResize 'editor.sidebar.height', =>
					@.setSidebarHeight()
					@._setColumnCount()

			hideSpinner: ->
				if @.parentView
					@.parentView.stopSpinner()

			_cleanup: ->
				if @.uploadZone then @.uploadZone.cleanup()
				$.removeOnWindowResize 'editor.sidebar.height'

			setSidebarHeight: ->
				@.$sidebarContent.css
					'height': $(window).height() - @.$sidebarHeader.outerHeight()

			_getColumnsCount: ->
				@.$sidebarContent.data 'columns'

			_setColumnCount: ->				
				if not @.$sidebarContent then return

				width = parseInt @.$sidebarContent.width(), 10

				prefColumnsCount = @._getColumnsCount()
				columnsCount = Math.floor width / 75

				if columnsCount
					@.$sidebarContent
						.removeClass(@columnsPrefix + prefColumnsCount)
						.addClass(@columnsPrefix + columnsCount)
						.data('columns', columnsCount)

			_afterRender: ->
				@.hideSpinner()
				@.initSidebar()
				#@.setSidebarHeight();

				do (_.once =>
					@.$sidebarContent = $ '.editor-sidebar-content', @.$el
					if @.isOpen
						@._setColumnCount()
				)

				if @.isOpen
					@._setColumnCount()

				if @.$sidebarContent.hasClass 'scrollbox'
					@.$sidebarContent.list
						headerSelector: 'header'

					$('.ui-list', @.$sidebarContent).scroll (e) =>
						@onContentScroll()

			onContentScroll: ->


			_onOpened: (switched) ->
				delay = if switched then 0 else 300
				@.isOpen = true
				setTimeout =>
					@._setColumnCount()
				, delay

			onOpened: (switched) ->
				@._onOpened switched

			_onClose: ->
				@.isOpen = false
				prefColumnsCount = @._getColumnsCount()
				setTimeout =>
					@.$sidebarContent.removeClass @.columnsPrefix + prefColumnsCount  if @.$sidebarContent
				, 300

			onClose: ->
				@._onClose()

		###*
		 * @todo : cleanup function!
		 * 
		###
		UserSidebar.Views.UserSidebar = UserSidebar.Views.SidebarContainer.extend
			tagName: 'div'
			template: 'security/editor-sidebar-user'

			events:
				'submit form.user-settings': 'changeUserCredentials'

					#@.$el.html(@.serialize())
					#@.render()
					#@.PersonImage = if gallery.fetched then gallery.images.Projects
					#@.Projects = if gallery.fetched then gallery.images.Projects
					#console.log gallery
			
			cleanup: ->
				@._cleanup()
				@.metaEditor.destroy()
				#@.bioEditor.cleanup()


			render: (template, context = {}) ->
				done = @.async()

				req = DataRetrieval.forUserGallery('Person').done (gallery) ->
					context.PersonImages = gallery.images.Person

					context.Person = app.CurrentMemberPerson.toJSON()
					context.Member = app.CurrentMember

					# get current image
					_.each context.PersonImages, (img) ->
						if context.Person.Image and img.id is context.Person.Image.ID then context.CurrentImage = img

					done template(context)

				# kill and pending requests and replace it with this
				UserSidebar.setPendingReq req

			initProjectList: ->
				projects = []
				for type in ['Projects', 'Exhibitions', 'Excursions', 'Workshops']
					projects = projects.concat app.CurrentMemberPerson.get(type).toJSON()

				projects = _.sortBy projects, (project) ->
					return project.Title.toLowerCase()

				_.each projects.reverse(), (project) =>
					if project.EditableByMember
						view = new UserSidebar.Views.ProjectItem {model: project}
						@.insertView '.editor-sidebar-content .project-list', view
						view.render()


			initPersonImageList: ->
				sortedImgs = _.sortBy app.Cache.UserGallery.images.Person, 'id'
				_.each sortedImgs, (image) =>
					@.insertPersonImage image

			insertPersonImage: (image) ->
				uploadZone = @.uploadZone
				view = new UserSidebar.Views.PersonImage {model: image}
				@.insertView '.editor-sidebar-content .image-list', view
				view.afterRender = ->
					@._afterRender()
					uploadZone.setAsDraggable @.$el.find('[data-id]')
				view.render()

			initDropzone: ->
				@.uploadZone = new JJSingleImageUploadZone '#current-person-image',
					url: app.Config.PersonImageUrl
					getFromCache: (id) =>
						result = null
						_.each app.Cache.UserGallery.images.Person, (image) =>
							if image.id is id then result = image
						[result]

					responseHandler: (data) =>
						img = data[0]
						if img.UploadedToClass
							app.updateGalleryCache data
							@.insertPersonImage img
						if id = img.id
							@.uploadZone.$dropzone.html '<img src="' + img.url + '">'
							personImg = app.CurrentMemberPerson.get 'Image'
							if id isnt personImg and (not personImg or id isnt personImg.id)
								# new image
								app.CurrentMemberPerson.save 'Image', i

			onContentScroll: ->
				bio = @.metaEditor.getComponentByName 'CurrentPerson.Bio'
				bio.api.reposition()

			initMetaEditor: ->
				@.metaEditor = editor = new JJEditor $('.meta-info'), [
					'InlineEditable'
					'MarkdownEditable'
					'SplitMarkdownEditable'
				]
				
				editor.on 'stateUpdate', (e) ->
					for key, val of e.CurrentPerson
						if key is 'Bio' then val = val.raw
						if app.CurrentMemberPerson.get(key) isnt val
							app.CurrentMemberPerson.save key, val

			afterRender: ->
				@._afterRender()

				@.initDropzone()
				@.initPersonImageList()
				@.initProjectList()
				@.initMetaEditor()
			
			# ! Events
			changeUserCredentials: (e) ->
				e.preventDefault()
				$form = $(e.target)
				data = $form.serialize()

				dfd = $.ajax
					url: app.Config.ChangeCredentialsUrl
					data: data
					type: 'POST'

				dfd.done (res) =>
					if res.email
						# update email at appropriate places
						$form.find('[name="email"]').val res.email
						@.$el.find('.editor-header .email').text res.email
						app.CurrentMember.Email = res.email
					if msg = res.msg
						@.showMessageAt msg.text, $form.parent(), msg.type

				false

		UserSidebar.Views.GallerySidebar = UserSidebar.Views.SidebarContainer.extend
			tagName: 'div'
			template: 'security/editor-sidebar-gallery'

			$sidebarContent: null

			cleanup: ->
				@._cleanup()
				@.$el.parent().off 'dragenter'

			initImageList: ->
				###
				@.$imageList = $ '.image-list', @.$el unless @.$imageList

				if @.$imageList.length
					$('a', @.$imageList).on 'click', (e) ->
						e.preventDefault()
						$('.selected', @.$imageList).not(@).removeClass 'selected'

						$(@).blur().toggleClass 'selected'


					false
				###
				_.each app.Cache.UserGallery.images.Projects, (proj) =>
					_.each proj.Images, (img) =>
						@.insertGalleryImage proj.FilterID, img
						

			insertGalleryImage: (filterID, img) ->
				view = new UserSidebar.Views.GalleryImage({model: img})
				@.insertView '[data-filter-id="' + filterID + '"] .image-list', view
				view.render()

			initFilter: ->
				@.$filter = $ 'select.filter', @.$el unless @.$filter

				if @.$filter.length
					@.$filter.on 'change', (e) =>
						val = $(e.target).blur().val()
						if val
							$filtered = $ "[data-filter-id=#{val}]", @.$sidebarContent
							if $filtered.length
								@.$sidebarContent.addClass 'filtered'
								$filtered.addClass('active').siblings().removeClass 'active'
								$filtered.prev('header').addClass 'active'
						else
							@.$sidebarContent
								.removeClass('filtered')
								.find('.active')
								.removeClass('active')

			initDropzone: ->
				@.uploadZone = new JJSimpleImagesUploadZone '#uploadzone',
					url: app.Config.DocImageUrl
					additionalData: 
						projectId: app.ProjectEditor.model.id
						projectClass: app.ProjectEditor.model.get 'ClassName'
					responseHandler: (data) =>
						app.updateGalleryCache data
						_.each data, (img) =>
							@.insertGalleryImage img.FilterID, img

				@.$el.parent().on 'dragenter', (e) =>
					if not $('body').hasClass 'drag-inline'
						@.uploadZone.$dropzone.addClass 'dragover'
						$.fireGlobalDragEvent 'dragstart', e.target, 'file'


			render: (template, context = {}) ->
				done =  @.async()

				req = DataRetrieval.forUserGallery('Projects').done (gallery) =>

					# sort projects, the currently edited one first
					projects = _.sortBy gallery.images.Projects, (project) ->
						return project.Title.toLowerCase()
					
					currentProj = app.ProjectEditor.model
					editFilter = currentProj.get('ClassName') + '-' + currentProj.id
					old_i = 0
					_.each projects, (project, i) ->
						if project.FilterID is editFilter then old_i = i

					if old_i
						projects.splice(0, 0, projects.splice(old_i, 1)[0])

					context.Projects = projects
					
					done template(context)

				# kill and pending requests and replace it with this
				UserSidebar.setPendingReq req
			
			afterRender: ->
				@._afterRender()
				@.initFilter()
				@.initDropzone()
				@.initImageList()


		UserSidebar.Views.ListItem = Backbone.View.extend
			tagName: 'li'

			_cleanup: ->
				@.$el.data 'recyclable', null
				@.$el.off 'dragstart dragend'
			cleanup: ->
				@._cleanup()
			serialize: ->
				@.model
			insert: (root, child) ->
				$(root).prepend child
			_afterRender: ->
				# uses listeners on 'dragstart and dragend'
				RecycleBin.setViewAsRecyclable @

			afterRender: ->
				@._afterRender()

		UserSidebar.Views.GalleryImage = UserSidebar.Views.ListItem.extend
			template: 'security/editor-sidebar-gallery-image'
			className: 'DocImage'

			cleanup: ->
				@.$el.find('[data-md-tag]').trigger 'dragend'
				@._cleanup()

			afterRender: ->
				@._afterRender()

				$img = @.$el.find('[data-md-tag]')
				JJMarkdownEditor.setAsDraggable $img
				app.ProjectEditor.PreviewImageZone.setAsDraggable $img

			liveRemoval: ->
				# get all gallery item views
				_.each @.__manager__.parent.views, (viewGroups) =>
					_.each viewGroups, (view) =>
						if view.model.id is @.model.id and view isnt @
							view.remove()
				@.remove()

		UserSidebar.Views.PersonImage = UserSidebar.Views.ListItem.extend
			template: 'security/editor-sidebar-person-image'
			className: 'PersonImage'

			cleanup: ->
				@.$el.find('[data-id]').trigger 'dragend'
				@._cleanup()

			liveRemoval: ->
				personImg = app.CurrentMemberPerson.get 'Image'
				if personImg.id is @.model.id
					$('#current-person-image').empty()
				@.remove()

		UserSidebar.Views.ProjectItem = UserSidebar.Views.ListItem.extend
			template: 'security/editor-sidebar-project-item'



		UserSidebar