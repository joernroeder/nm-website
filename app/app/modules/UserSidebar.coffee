define [
		'app'
		'modules/DataRetrieval'
		'plugins/editor/jquery.jjdropzone'
	],
	(app, DataRetrieval) ->

		UserSidebar = app.module()

		UserSidebar.construct = ->
			new UserSidebar.Views.Main()

		UserSidebar.Views.Main = Backbone.View.extend
			el: $('#editor-sidebar')
			template: 'security/editor-sidebar'

			availableSubViews:
				'user'		: 'UserSidebar'
				'gallery'	: 'GallerySidebar'

			subView: null

			events:
				'click [data-editor-sidebar-content]': 'toggleSidebarCheck'

			# !- Backbone native methods

			serialize: ->
				json = {}
				if app.currentLayoutName is 'editor' then json.isEditor = true
				json
				#person = if app.CurrentMemberPerson then app.CurrentMemberPerson.toJSON()
				# { Member: app.CurrentMember, Person: person }
			
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
				@.$el.removeClass 'open'
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

			galleryData: {}

			initSidebar: _.once ->
				@.$sidebarHeader = $ '> header', @.$el
				@.$sidebarContent = $ 'section.editor-sidebar-content', @.$el
				@setSidebarHeight()
				# register window events
				$.addOnWindowResize 'editor.sidebar.height', =>
					@setSidebarHeight()

			setSidebarHeight: ->
				@.$sidebarContent.css
					'height': $(window).height() - @.$sidebarHeader.outerHeight()

			_afterRender: ->
				@.initSidebar()

		###*
		 * @todo : cleanup function!
		 * 
		###
		UserSidebar.Views.UserSidebar = UserSidebar.Views.SidebarContainer.extend
			tagName: 'div'
			template: 'security/editor-sidebar-user'

					#@.$el.html(@.serialize())
					#@.render()
					#@.PersonImage = if gallery.fetched then gallery.images.Projects
					#@.Projects = if gallery.fetched then gallery.images.Projects
					#console.log gallery


			render: (template, context = {}) ->
				done = @.async()

				DataRetrieval.forUserGallery('Person').done (gallery) ->
					context.PersonImages = gallery.images.Person
					context.Person = app.CurrentMemberPerson.toJSON()
					context.Member = app.CurrentMember

					done template(context)

			onOpened: (switched) ->
				delay = if switched then 0 else 300
				@.isOpen = true
				setTimeout =>
					@.$sidebarContent.addClass 'test' if @.$sidebarContent
				, delay

			onClose: ->
				@.isOpen = false
				setTimeout =>
					@.$sidebarContent.removeClass 'test' if @.$sidebarContent
				, 300

			afterRender: ->
				do (_.once =>
					@.$sidebarContent = $ '.editor-sidebar-content', @.$el
					if @.$sidebarContent
						@.$sidebarContent.addClass 'test'
				)
				# do stuff
				@._afterRender()

		UserSidebar.Views.GallerySidebar = UserSidebar.Views.SidebarContainer.extend
			tagName: 'div'
			template: 'security/editor-sidebar-gallery'

			columnsPrefix: 'columns-'

			$sidebarContent: null

			cleanup: ->
				@.uploadZone.cleanup()

			getColumnsCount: ->
				@.$sidebarContent.data 'columns'

			setColumnCount: ->
				if not @.$sidebarContent then return

				width = parseInt @.$sidebarContent.width(), 10

				prefColumnsCount = @getColumnsCount()
				columnsCount = Math.floor width / 75

				if columnsCount
					@.$sidebarContent
						.removeClass(@columnsPrefix + prefColumnsCount)
						.addClass(@columnsPrefix + columnsCount)
						.data('columns', columnsCount)

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



			onOpened: (switched) ->
				delay = if switched then 0 else 300
				@.isOpen = true
				setTimeout =>
					@setColumnCount()
				, delay

			onClose: ->
				@.isOpen = false
				prefColumnsCount = @getColumnsCount()
				setTimeout =>
					@.$sidebarContent.removeClass @columnsPrefix + prefColumnsCount  if @.$sidebarContent
				, 300
			
			render: (template, context = {}) ->
				done =  @.async()

				DataRetrieval.forUserGallery('Projects').done (gallery) =>
					context.Projects = gallery.images.Projects
					
					done template(context)
			
			afterRender: ->
				@._afterRender()
				@.setColumnCount()
				@.initFilter()
				@.initDropzone()
				@.initImageList()

				do (_.once =>
					@.$sidebarContent = $ '.editor-sidebar-content', @.$el
					if @.isOpen
						@.setColumnCount()
				)

		UserSidebar.Views.GalleryImage = Backbone.View.extend
			tagName: 'li'
			template: 'security/editor-sidebar-gallery-image'
			serialize: ->
				@.model


		UserSidebar