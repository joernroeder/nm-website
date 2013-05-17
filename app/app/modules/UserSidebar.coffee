define [
		'app'
		'modules/DataRetrieval'
	],
	(app, DataRetrieval) ->

		UserSidebar = app.module()

		UserSidebar.construct = ->
			new UserSidebar.Views.Main()

		UserSidebar.Views.Main = Backbone.View.extend
			el: $('#editor-sidebar')
			template: 'security/editor-sidebar'

			currentContainerContent: null

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
				toShow = $(e.target).data('editor-sidebar-content')
				console.log @
				if @.currentContainer is toShow 
					@.toggle()
				else
					@.setSubview toShow, true
					@.open()

				false

			setSubview: (toShow, doRender) ->
				view = if toShow is 'user' then new UserSidebar.Views.UserSidebar() else new UserSidebar.Views.GallerySidebar()
				@.setView '#editor-sidebar-container', view
				if doRender then view.render()

			open: ->
				@.$el.addClass 'open'

				setTimeout =>
					@.$el.addClass 'opened'
				, 300

			close: ->
				@.$el.removeClass 'open opened'

			toggle: ->
				if @.$el.hasClass 'open'
					@close()
				else
					@open()



		UserSidebar.Views.SidebarContainer = Backbone.View.extend
			$sidebarHeader: null
			$sidebarContent: null

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

			afterRender: ->
				# do stuff
				@._afterRender()

		UserSidebar.Views.GallerySidebar = UserSidebar.Views.SidebarContainer.extend
			tagName: 'div'
			beforeRender: ->
				DataRetrieval.forUserGallery().done (gallery) ->
					console.log 'user gallery fetched. Gallery:'
					console.log gallery





		UserSidebar