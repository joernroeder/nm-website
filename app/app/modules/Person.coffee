define [
		'app',
		'modules/JJPackery'
		'modules/Portfolio'
	],
	(app, JJPackery, Portfolio) ->

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

				getFullName: ->
					if @.get 'FullName' then return @.get 'FullName'
					return (if @.get('FirstName') then @.get('FirstName') else '') + ' ' + (if @.get('Surname') then @.get('Surname') else '')

			JJRestApi.extendCollection 'Person',
				comparator: (person) ->
					person.get 'Surname'

			#Person.Views.Test = Backbone.View.extend({})
		
		Person.Views.PackeryContainer = JJPackery.Views.Container.extend
			beforeRender: ->
				console.log 'render person page with normal view'
				modelArray = []
				rels = @.model.relations
				for projectType in app.Config.ProjectTypes
					for rel in rels
						if rel.collectionType is projectType
							modelArray = modelArray.concat @.model.get(rel.key).models

				# insert the person item
				@.insertView '.packery', new Person.Views.InfoItem({ model: @.model })

				# insert the list items
				for model in modelArray
					if model.get('IsPublished')
						@.insertView '.packery', new Portfolio.Views.ListItem({ model: model, linkTo: 'about/' + @.model.get('UrlSlug') })

		# this view displays basic pieces of information (bio, pic etc.) within the packery view
		Person.Views.InfoItem = Backbone.View.extend
			tagName: 'article'
			className: 'packery-item person-info'
			template: 'person-info-item'
			events:
				'click a.vcf-download': 'downloadVcf'


			downloadVcf: (e) ->
				e.preventDefault()

				# generate vcf string
				vcfContent = "BEGIN:VCARD\rVERSION:3.0\rCLASS:PUBLIC\rFN:#{ @model.get('FirstName') } #{ @model.get('Surname') }\rN:#{ @model.get('Surname') };#{ @model.get('FirstName') } ;;;\r"
				vcfContent += "EMAIL;TYPE=INTERNET:#{ @model.get('Email') }\r" if @model.get('Email')
				vcfContent += "TEL;TYPE=PREF:#{ @model.get('Phone') }\r" if @model.get('Phone')
				vcfContent += "END:VCARD"

				uriContent = "data:text/vcard," + encodeURIComponent(vcfContent)
				window.location.href = uriContent

				false

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
				stats.push @JobTitle || ('Employee')
			
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
