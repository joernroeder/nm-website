define [
		'app'
		'modules/DataRetrieval'
		'plugins/editor/jquery.jjdropzone'
	],
	(app, DataRetrieval) ->

		UserSidebar = app.module()

		UserSidebar.construct = ->
			view = new UserSidebar.Views.Main()
			view.$el.appendTo '#editor-sidebar'
			view.render()
			view

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
			
			# !- Custom
			
			toggleSidebarCheck: (e) ->
				$target = $ e.target
				toShow = $target.data 'editor-sidebar-content'
				subViewName = @.getSubviewName toShow

				if @.subViewName is subViewName
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

					@.setView '#editor-sidebar-container', @.subView
					if doRender then @.subView.render()
				else 
					# @todo proper cleanup
					@.subView = null

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



		UserSidebar.Views.SidebarContainer = Backbone.View.extend
			$sidebarHeader: null
			$sidebarContent: null
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

			_cleanup: ->
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
				@.initSidebar()
				#@.setSidebarHeight();

				do (_.once =>
					@.$sidebarContent = $ '.editor-sidebar-content', @.$el
					if @.isOpen
						@._setColumnCount()
				)

				if @.isOpen
					@._setColumnCount()

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
				@.uploadZone.cleanup()


			render: (template, context = {}) ->
				done = @.async()

				DataRetrieval.forUserGallery('Person').done (gallery) ->
					context.PersonImages = gallery.images.Person
					context.Person = app.CurrentMemberPerson.toJSON()
					context.Member = app.CurrentMember

					# get current image
					_.each context.PersonImages, (img) ->
						if img.id is context.Person.Image.ID then context.CurrentImage = img

					done template(context)

			initPersonImageList: ->
				_.each app.Cache.UserGallery.images.Person, (image) =>
					@.insertPersonImage image

			insertPersonImage: (image) ->
				uploadZone = @.uploadZone
				view = new UserSidebar.Views.PersonImage {model: image}
				@.insertView '.editor-sidebar-content .image-list', view
				view.afterRender = ->
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
						if img.id
							@.uploadZone.$dropzone.html '<img src="' + img.url + '">'
							# @todo: set as PersonImage and trigger save on Person

			afterRender: ->
				@._afterRender()

				@.initDropzone()
				@.initPersonImageList()
				# do stuff
			
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
				@.uploadZone.cleanup()
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
						else
							@.$sidebarContent
								.removeClass('filtered')
								.find('.active')
								.removeClass('active')

			initDropzone: ->
				@.uploadZone = new JJSimpleImagesUploadZone '#uploadzone',
					url: app.Config.DocImageUrl
					additionalData: 
						projectId: app.CurrentlyEditingProject.id
						projectClass: app.CurrentlyEditingProject.get 'ClassName'
					responseHandler: (data) =>
						app.updateGalleryCache data
						_.each data, (img) =>
							@.insertGalleryImage img.FilterID, img

				@.$el.parent().on 'dragenter', (e) =>
					@.uploadZone.$dropzone.addClass 'dragover'


			render: (template, context = {}) ->
				done =  @.async()

				DataRetrieval.forUserGallery('Projects').done (gallery) =>
					context.Projects = gallery.images.Projects
					
					done template(context)
			
			afterRender: ->
				@._afterRender()
				@.initFilter()
				@.initDropzone()
				@.initImageList()


		UserSidebar.Views.ImageItem = Backbone.View.extend
			tagName: 'li'
			serialize: ->
				@.model

		UserSidebar.Views.GalleryImage = UserSidebar.Views.ImageItem.extend
			template: 'security/editor-sidebar-gallery-image'
			afterRender: ->
				# JJMarkdownEditor.setAsDraggable @.$el.find '[data-md-tag]'

		UserSidebar.Views.PersonImage = UserSidebar.Views.ImageItem.extend
			template: 'security/editor-sidebar-person-image'



		UserSidebar