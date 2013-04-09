define [
		'app'
		'plugins/zepto.gravity'
	],
	(app) ->

		About = app.module()				

		About.Views.Gravity = Backbone.View.extend
			tagName: 'section'
			id: 'gravity-container'
			className: 'gravity'
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
					

			afterRender: ->
				$(@.el).height($(window).height()).RadialGravity 
					worker:
						physics: '/app/assets/js/plugins/gravity/physics.js'

			serialize: ->
				{ GroupImage: @.groupImage }

		About.Views.PersonListItem = Backbone.View.extend
			tagName: 'li'
			className: 'person-list-item'
			template: 'person-list-item'
			serialize: ->
				@.model.toJSON()

		About.Views.EmployeeItem = Backbone.View.extend
			tagName: 'div'
			className: 'employee gravity-item'
			template: 'employee-item'
			serialize: ->
				@.model.toJSON()

		About
