define [
		'app'
], (app) ->

	Editor = app.module()

	Editor.Views.NewProject = Backbone.View.extend
		tagName: 'div'
		template: 'security/create-project'

		events:
			'submit form.create-project': 'createNewProject'
			'click .project-type-list a': 'setProjectType'

		hideForm: ->
			@.$field.blur()
			@.formError ''
			@.$form.removeClass 'active'

		showForm: ->
			@.$submit.text 'Create ' + @.projectType
			@.$field
				.attr('placeholder', @.projectType + ' Title')
				.val('')
				.focus()
			@.formError ''
			@.$form.addClass 'active'

		formError: (msg) ->
			if msg
				@.$error.text(msg).addClass 'active'
			else
				@.$error.removeClass 'active'


		setProjectType: (e) ->
			$link = $ e.target

			$link.closest('ul')
				.find('.active')
					.not($link)
						.removeClass('active')
					.end()
				.end()
			.end()
			.toggleClass 'active'

			if $link.hasClass 'active'
				@.$list.addClass 'active'

				type = $(e.currentTarget).data 'type'
				if type then @.projectType = type
				@.showForm()
			else
				@.$list.removeClass 'active'
				@.projectType = null
				@.hideForm()

			false

		afterRender: ->
			@.$list = $ 'ul.project-type-list'
			@.$form = $ 'form.create-project'
			@.$field = $ 'input', @.$form
			@.$error = $ '.form-error', @.$form
			@.$submit = $ 'button[type=submit]', @.$form

			# hide error
			@.$field.on 'keyup', =>
				if @.$error.hasClass('active') and @.$field.val()
					@.formError ''

		createNewProject: (e) ->
			e.preventDefault()
			title = @.$field.val()
			errorMsg = ''

			if not title then errorMsg = 'Please fill in a title!'
			if not @.projectType then errorMsg = 'Please choose the type of your project!'

			if errorMsg
				@.formError errorMsg
				@.$field.focus()
				#@.showMessageAt errorMsg, @.$el, 'error'
			else
				if person = app.CurrentMemberPerson
					m = JJRestApi.Model @.projectType
					model = new m {Title: title, Persons: person}
					model.save null,
						success: ->
							model._isCompletelyFetched = true
							model._isFetchedWhenLoggedIn = true
							Backbone.history.navigate '/secured/edit/' + model.get('UglyHash') + '/', true
			false

	Editor