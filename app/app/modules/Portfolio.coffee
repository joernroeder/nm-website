define [
		'app'
		'modules/JJPackery'
	],
	(app, JJPackery) ->

		Portfolio = app.module()

		Portfolio.Config =
			person_group_length : 4
			group_project_title : 'Group project'

		# this is the main packery container which has a list with all project overview items in it
		Portfolio.Views.PackeryContainer = JJPackery.Views.Container.extend

			cleanup: ->
				Backbone.Events.off 'search', @handleSearch

			initialize: ->
				Backbone.Events.on 'search', @handleSearch, @

			handleSearch: (searchResults) ->
				if @__manager__.hasRendered
					@triggerSearchOnChildren searchResults
				else
					@searchResults = searchResults
					@doSearchAfterRender = true

			triggerSearchOnChildren: (searchResults) ->
				console.log 'search on children'
				console.log searchResults

				# iterate over child views and check if their model is present in the search results
				_.each @views['.packery'], (childView) =>
					model = childView.model
					# always show when there is no search
					unless searchResults
						@packery.showElement childView.el
						#childView.doShow()
					else
						found = _.find searchResults, (result) ->
							return result is childView.model
						method = if found then 'showElement' else 'hideElement'
						@packery[method] childView.el
						#childView[method]()


			beforeRender: ->
				console.log 'portfolio before render'
				modelArray = @.collection
				if modelArray
					for model in modelArray
						@.insertView '.packery', new Portfolio.Views.ListItem({ model: model, linkTo: @.options.linkTo })

			_afterRender: ->
				if @doSearchAfterRender
					@triggerSearchOnChildren @searchResults
					@doSearchAfterRender = false
					@searchResults = null
				# debugger
				

		Portfolio.Views.ListItem = Backbone.View.extend
			tagName: 'article'
			className: 'packery-item resizable'
			template: 'packery-list-item'

			doShow: ->
				console.log 'showing %o', @model
				@.$el.removeClass 'hidden'

			doHide: ->
				console.log 'hiding %o', @model
				@.$el.addClass 'hidden'

			serialize: ->
				data = if @.model then @.model.toJSON() else {}
				data.Persons = _.sortBy data.Persons, (person) ->
					return person.Surname

				data.LinkTo = @.options.linkTo
				data

		Portfolio.Views.Detail = Backbone.View.extend
			tagName: 'article'
			className: 'portfolio-detail'
			template: 'portfolio-detail'
			beforeRender: ->
				@._codeEv = $.Event 'code:kickoff', { bubbles: false }
				@._afterRenderEv = $.Event 'portfoliodetail:rendered'
			afterRender: ->
				window.picturefill()
				$doc = $(document)
				$doc.trigger(@._codeEv)
				$doc.trigger(@._afterRenderEv)

			appropriateUrl: (projectItem, person = false) ->


			serialize: ->
				# set the current appropriate detailed URL of related projects (prefer the current person of this detailed page, but always prefer portfolio)
				for projType in ['Projects', 'ChildProjects', 'ParentProjects', 'Exhibitions', 'Workshops', 'Excursions']
					coll = @model.get projType
					if coll
						coll.each (m) =>
							m.setTempUrlPrefix @ownedByPerson

				json = if @.model then @.model.toJSON() else {}
				types = ['Projects', 'ChildProjects', 'ParentProjects']

				# sort persons
				json.Persons = _.sortBy json.Persons, (person) ->
					return person.Surname

				if parseInt(json.Persons.length) > parseInt(Portfolio.Config.person_group_length)
					#json.IsGroupProjectTop = true
					json.IsGroup = true

				# set up combined projects
				json.combinedProjects = []
				_.each types, (type) =>
					if _.isArray json[type]
						json.combinedProjects = json.combinedProjects.concat json[type]

				console.log json
				json


		#! Handlebar helpers
		
		Handlebars.registerHelper 'nameSummary', (persons) ->
			conf = Portfolio.Config
			return conf.group_project_title unless persons.length <= conf.person_group_length
			out = ''
			length = persons.length
			_.each persons, (person, i) ->
				out += '<a href="/about/' + person.UrlSlug + '/">' + person.FirstName + ' ' + (if person.Surname then person.Surname else '') + '</a>'
				if i < (length - 2)
					out += ', '
				else if i < (length - 1)
					out += ' &amp; '
			out

		Handlebars.registerHelper 'niceDate', (model, forceYear) ->
			return false unless model.DateRangeNice or model.FrontendDate
			out = ''
			if model.DateRangeNice
				out += model.DateRangeNice
			else if model.FrontendDate
				if not forceYear
					out += model.FrontendDate
				else
					out += model.FrontendDate.split(' ')[1]
			out

		Handlebars.registerHelper 'teaserMeta', ->
			niceDate = Handlebars.helpers.niceDate @, true
			if @.ClassName is 'Project'
				nameSummary = Handlebars.helpers.nameSummary @.Persons
				return "#{nameSummary} // #{niceDate}" 
			else 
				return niceDate

		Handlebars.registerHelper 'SpaceAndLocation', ->
			out = []
			if @Space then out.push @Space
			if @Location then out.push @Location
			
			out.join ' – ' if out

		Handlebars.registerHelper 'hrIfNeeded', ->
			# check if there's content below
			below = false
			for type in ['combinedProjects', 'Exhibitions', 'Excursions', 'Workshops']
				if @[type] and ( @[type].length > 0 ) then below = true
			# check if there's content below
			above = if @.IsGroup or @.ClassName is 'Exhibition' or ( @.Categories and @.Categories.length > 0 ) or ( @.Websites and @.Websites.length > 0 ) then true else false

			if (above && below) then '<hr/>' else ''

		Handlebars.registerHelper 'portfoliolist', (items, title, options) ->
			if not options
				options = title
				title = ''

			length = 0
			out = '<ul>'

			# build list
			_.each items, (item) ->
				if item.IsPublished
					out += '<li><a href="/' + item.TempUrlPrefix + '/' + item.UglyHash + '/">' + item.Title + '</a></li>'
					length++
			out += '</ul>'

			# set up title
			title += if length > 1 then 's' else ''

			return if length then "<h4>#{title}</h4>" + out else ''
		
		Handlebars.registerHelper 'personlist', (persons) ->
			out = '<ul>'
			
			_.each persons, (person) ->
				out += '<li><a href="/about/' + person.UrlSlug + '/">' + person.FirstName + ' ' + (if person.Surname then person.Surname else '') + '</a></li>'
			out += '</ul>'
			
			return "<h4>Contributors</h4>" + out

		Handlebars.registerHelper 'commaSeparatedWebsites', (websites) ->
			a = []
			_.each websites, (website) ->
				a.push "<a href=\"#{website.Link}\">#{website.Title}</a>"
			a.join ', '





		Portfolio
