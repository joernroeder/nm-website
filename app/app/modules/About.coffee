define [
		'app'
		'modules/JJPackery'
	],
	(app, JJPackery) ->

		About = app.module()

		About.Views.PackeryContainer = JJPackery.Views.Container.extend
			template: 'about-packery'

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
						@.insertView '.packery', new About.Views.EmployeeItem {model: employee}

			afterRender: ->
				$(document).trigger $.Event 'about:rendered'
				JJPackeryMan()

			serialize: ->
				{ GroupImage: @.groupImage }

		About.Views.PersonListItem = Backbone.View.extend
			tagName: 'li'
			template: 'person-list-item'
			serialize: ->
				@.model.toJSON()

		About.Views.EmployeeItem = Backbone.View.extend
			tagName: 'section'
			className: 'person packery-item'
			template: 'employee-item'
			serialize: ->
				@.model.toJSON()

		About
