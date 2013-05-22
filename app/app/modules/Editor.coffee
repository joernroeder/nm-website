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

		setProjectType: (e) ->
			e.preventDefault()
			type = $(e.currentTarget).data 'type'
			if type then @.projectType = type
			false


		createNewProject: (e) ->
			e.preventDefault()
			title = $(e.target).find('[name="title"]').val()
			errorMsg = null
			if not title then errorMsg = 'Please fill in a title!'
			if not @.projectType then errorMsg = 'Please choose the type of your project!'

			if errorMsg
				@.showMessageAt errorMsg, @.$el, 'error'
			else
				if person = app.CurrentMemberPerson
					m = JJRestApi.Model @.projectType
					model = new m {Title: title, Persons: person}
					model.save()
			false

	Editor