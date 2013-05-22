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

			false

	Editor