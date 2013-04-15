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
				# insert the list items
				for model in modelArray
					@.insertView '', new Portfolio.Views.ListItem({ model: model, LinkTo: 'about' })
				# insert the person item
				@.insertView '', new Person.Views.InfoItem({ model: model })

		# this view displays basic pieces of information (bio, pic etc.) within the gravity view
		Person.Views.InfoItem = Backbone.View.extend
			tagName: 'li'
			className: 'gravity-item'
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


		Person
