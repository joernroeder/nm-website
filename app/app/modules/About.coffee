define [
		'app'
		'modules/Gravity'
	],
	(app, Gravity) ->

		About = app.module()

		About.Views.GravityContainer = Gravity.Views.Container.extend
			tagName: 'section'
			template: 'about-gravity'

			initialize: (options) ->
				@.groupImage = options.groupImage
				@.persons = options.persons
			beforeRender: ->
				# persons
				if @.persons
					for student in @.persons.students
						@.insertView '#student-list', new About.Views.PersonListItem {model: student}
					for alumni in @.persons.alumnis
						@.insertView '#alumni-list', new About.Views.PersonListItem {model: alumni}
					for employee in @.persons.employees
						@.insertView '', new About.Views.EmployeeItem {model: employee}
			

			serialize: ->
				{ GroupImage: @.groupImage }

		About.Views.PersonListItem = Backbone.View.extend
			tagName: 'li'
			template: 'person-list-item'
			serialize: ->
				@.model.toJSON()

		About.Views.EmployeeItem = Backbone.View.extend
			tagName: 'section'
			className: 'person gravity-item'
			template: 'employee-item'
			serialize: ->
				@.model.toJSON()

		About
