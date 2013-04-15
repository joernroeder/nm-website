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

			JJRestApi.extendCollection 'Person',
				foo: 'bar'

			#Person.Views.Test = Backbone.View.extend({})
		
		Person.Views.GravityContainer = Gravity.Views.Container.extend
			tagName: 'ul'
			className: 'gravity'
			beforeRender: ->
				console.log 'render person page with normal view'
				modelArray = []
				rels = @.model.relations
				for projectType in app.Config.ProjectTypes
					for rel in rels
						if rel.collectionType is projectType
							modelArray = modelArray.concat @.model.get(rel.key).models
				for model in modelArray
					@.insertView '', new Portfolio.Views.ListItem({ model: model, linkTo: 'about' })

		Person.Views.CustomView = Backbone.View.extend {}

		Person
