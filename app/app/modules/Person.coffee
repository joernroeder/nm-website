define [
		'app',
		'modules/Gravity'
		'modules/Portfolio'
	],
	(app, Gravity, Portfolio) ->

		Person = app.module()

		JJRestApi.Modules.extend 'Person', (Person) ->
			JJRestApi.extendModel 'Person', 
				###*
				 * @return {String} either 'student' or 'alumni' or 'employee'
				###
				getLinkingSlug: ->
					if @.get 'IsEmployee' then return 'employee'
					if @.get 'IsStudent' then return 'student'
					if @.get 'IsAlumni' then return 'alumni' 
					return ''

				# checks if there's a negative Ranking. If yes, returns false
				projectIsVisible: (project) ->
					out = true
					@.get('Rankings').each (ranking) =>
						className = project.get 'ClassName'
						res = ranking.get(className)
						if res and res.id is project.id
							out = false
					out

			JJRestApi.extendCollection 'Person',
				foo: 'bar'

			#Person.Views.Test = Backbone.View.extend({})
		
		Person.Views.GravityContainer = Gravity.Views.Container.extend
			tagName: 'section'
			beforeRender: ->
				console.log 'render person page with normal view'
				modelArray = []
				rels = @.model.relations
				for projectType in app.Config.ProjectTypes
					for rel in rels
						if rel.collectionType is projectType
							modelArray = modelArray.concat @.model.get(rel.key).models

				# insert the list items
				for model in modelArray
					if @.model.projectIsVisible(model)
						@.insertView '', new Portfolio.Views.ListItem({ model: model, linkTo: 'about/' + @.model.get('UrlSlug') })
				# insert the person item
				@.insertView '', new Person.Views.InfoItem({ model: @.model })

		# this view displays basic pieces of information (bio, pic etc.) within the gravity view
		Person.Views.InfoItem = Backbone.View.extend
			tagName: 'article'
			className: 'gravity-item person-info'
			template: 'person-info-item'
			serialize: ->
				if @.model then @.model.toJSON()


		Person.Views.Custom = Backbone.View.extend
			tagName: 'div'
			className: 'custom-templ'
			initialize: (options) ->
				if options.template then @.template = options.template
			serialize: ->
				if @.model then @.model.toJSON() else {}
			beforeRender: ->
				@._ev = $.Event 'template:ready', { bubbles: false }
			afterRender: ->
				$(document).trigger(@._ev)


		# ! Handlebars Helper
		
		Handlebars.registerHelper 'personMeta', ->
			out = ''
			stats = []
			addDate = false

			if @.IsStudent
				stats.push 'Student'
			
			if @.IsAlumni
				stats.push 'Alumni'
			
			if @.IsEmployee
				stats.push 'Employee'
			
			if @.IsExternal
				stats.push 'External'

			 
			if not stats.length
				return ''

			# stitch together
			out += stats.join ', '

			# add year
			if @.GraduationYear
				out += ' // '
				out += if @.MasterYear then @.MasterYear else @.GraduationYear

			out
		
		Handlebars.registerHelper 'website', ->
			href = @.Link or '#'
			title = @.Title or href

			'<a href="' + href + '">' + title + '</a>'

		Person
