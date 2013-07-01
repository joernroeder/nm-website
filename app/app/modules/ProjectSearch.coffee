define [
		'app'
		'plugins/visualsearch/visualsearch'
	],
	(app) ->
		ProjectSearch =

			fields :
				'Title'	: 'partial'
				'Space' : 'partial'
				'Location': 'partial'
				'Text': (obj, valArray) ->
					return ProjectSearch.test obj, 'TeaserText', valArray, 'partial'
				'Type': (obj, valArray) ->
					return ProjectSearch.test obj, 'ClassName', valArray, 'partial'
				'Category': (obj, valArray) =>
					if obj.Categories and obj.Categories.length
						result = true
						# iterate over values
						_.each valArray, (val) ->
							out = false
							# then check the categories, if anyone of them matches our value. all values must be matched by at least one obj!
							_.each obj.Categories, (cat) ->
								if ProjectSearch.exactMatchFilter(cat, 'Title', val) then out = true
							if not out then result = false

						return result
					false
				'Person': (obj, valArray) =>
					if obj.Persons and obj.Persons.length
						result = true
						# iterate over values
						_.each ProjectSearch.partializeArray(valArray), (val) ->
							out = false
							# then check the persons, if anyone of them matches our value. all values must be matched by at least on obj!
							_.each obj.Persons, (person) ->
								fullName = (if person.FirstName then person.FirstName + ' ' else '') + (if person.Surname then person.Surname else '')
								if fullName.indexOf(val) >= 0 then out = true
							if not out then result = false

						return result
					false


			###*
			 * transforms a string into an object with the searchable field as key and the possible OR values as array
			 * @param  {String} term
			 * @return {Object}
			###
			transformSearchTerm : (term) ->
				out = {}
				term = decodeURI term
				for segment in term.split(';')
					els = segment.split ':'
					vals = null
					if els.length > 1
						vals = els[1].split('|')
					out[els[0]] = vals
				out

			# opposite of transform
			makeSearchTerm: (obj) ->
				a = []
				for key, val of obj
					a2 = []
					if not _.isArray(val) then val = [val]
					for v in val
						if v then a2.push v
					if a2.length then a.push "#{key}:#{a2.join('|')}"
				encodeURI a.join(';')



			# useful function when matching partially: the searched terms are split by whitespaces and
			# added as single possibilities
			partializeArray: (valArray) ->
				out = []
				for val in valArray
					out = out.concat val.split(' ')
				out

			test: (obj, key, valArray, forceMethod) ->
				result = true
				if not _.isArray(valArray) then valArray = [valArray]
				type = forceMethod || @.fields[key]
				if type
					# type has its own testing functionality
					if _.isFunction type
						result = type.call(@, obj, valArray)
				
					# check if 'partial' or 'exact'. defaults to 'partial'
					else
						if type is 'exact'
							method = 'exactMatchFilter'
						else
							method = 'partialMatchFilter'
							valArray = @partializeArray valArray

						for val in valArray
							if not @[method](obj, key, val) then return false



				# no method/filter specified for `key`, defaults to true
				result
				

			# tests obj[key] against a value. of one of them matches obj[key] partially, the test passes
			partialMatchFilter: (obj, key, val) ->
				if not obj.hasOwnProperty(key) then return false
				against = obj[key].toLowerCase()
				if against.indexOf(val.toLowerCase()) >= 0 then return true
				false


			# tests obj[key] against a value. if one of them matches obj[key] exactly, the test passes
			exactMatchFilter: (obj, key, val) ->
				if not obj.hasOwnProperty(key) then return false
				if val.toLowerCase() is obj[key].toLowerCase() then return true
				false

		# collect all possible auto complete matches from the current portfolio
		ProjectSearch.getVisualSearchMatches = ->
			wholePortfolio = app.wholePortfolioJSON()
			matches =
				Title: []
				Space: []
				Location: []
				Person: []
				Year: []
				Type: ['Project', 'Exhibition', 'Excursion', 'Workshop']

			years = []
			persons = []
			used = []

			_.each wholePortfolio, (m) ->
				matches.Title.push(m.Title) if m.Title
				matches.Space.push(m.Space) if m.Space
				matches.Location.push(m.Location) if m.Location

				d = parseInt(m.YearSearch) if m.YearSearch
				years.push d if d

				_.each m.Persons, (person) ->
					if person.FirstName and person.Surname
						fullname = "#{person.Surname}, #{person.FirstName}"
						if _.indexOf(used, fullname) < 0
							persons.push { label: fullname, value: "#{person.FirstName} #{person.Surname}" }
							used.push fullname

			# unique persons and sort
			matches.Person = _.sortBy persons, (p) ->
				p.label

			# sort years
			years = _.sortBy _.uniq(years), (y) ->
				y * -1
			for year in years
				matches.Year.push year.toString()

			matches

		ProjectSearch.View = Backbone.View.extend
			template: 'searchbar'
			id: 'searchbar'

			search:
				'Category': []

			events:
				'click .category-filter a': 'updateCategorySearch'
				'click .btn': 'switchSearchView'

			initialize: (opts) ->
				if opts.searchTerm then @search = ProjectSearch.transformSearchTerm opts.searchTerm
				@search.Category = [] if not @search.Category

			switchSearchView: (e) ->
				e.preventDefault()
				$(e.target).removeClass('active').blur()
				@.$el.find('section').toggleClass('active')
				false

			# takes @search-obj, trasnforms it into a valid search url and fires it. rest is handled by router and DataRetrieval
			doSearch: ->
				searchTerm = ProjectSearch.makeSearchTerm @search
				directTo = if searchTerm then "/portfolio/search/#{searchTerm}/" else '/portfolio/'
				Backbone.history.navigate directTo, true

			updateCategorySearch: (e) ->
				e.preventDefault()

				$a = $(e.target)
				$a.blur()
				title = $a.data('title')
				i = _.indexOf @search.Category, title
				if i < 0 
					@search.Category.push title
					meth = 'addClass'
				else
					@search.Category.splice i, 1
					meth = 'removeClass'
				$a[meth]('active')
				@doSearch()
				false

			initVisualSearch: ->
				$visSearch = @.$el.find '.visualsearch'

				autoMatches = ProjectSearch.VisualSearchMatches = ProjectSearch.VisualSearchMatches || ProjectSearch.getVisualSearchMatches()

				@visualSearch = VS.init
					container: $visSearch
					remainder: 'Text'
					callbacks:
						search: (query, searchCollection) =>
							# don't lose categories
							@search =
								Category: @search.Category
							searchCollection.each (facet) =>
								cat = facet.get 'category'
								@search[cat] = [] if not @search[cat]
								@search[cat].push facet.get('value')
							console.log @search
							@doSearch()
						facetMatches: (callback) ->
							callback ['Type', 'Person', 'Title', 'Year', 'Space', 'Location']
						valueMatches: (facet, searchTerm, callback) ->
							switch facet
								when 'Person' then callback autoMatches.Person
								when 'Title' then callback autoMatches.Title
								when 'Year' then callback autoMatches.Year
								when 'Space' then callback autoMatches.Space
								when 'Location' then callback autoMatches.Location
								when 'Type' then callback autoMatches.Type

				@prePopulateSearchBox()
				console.log 'Project search view: %o', @search
				console.log @visualSearch

			prePopulateSearchBox: ->
				query = ''
				for key, val of @search
					# leave out categories
					if key isnt 'Category'
						for v in val
							query += "\"#{key}\": \"#{v}\" "
				@visualSearch.searchBox.value query

			updateCategoryClasses: ->
				_this = @
				@.$el.find('.category-filter ul a').each ->
					$this = $ @
					title = $this.data('title').toLowerCase()

					for cat in _this.search.Category
						if cat.toLowerCase() is title then $this.addClass 'active'

			afterRender: ->
				@updateCategoryClasses()
				@initVisualSearch()

			serialize: ->
				json = {}
				json.Categories = _.map app.Collections.Category.models, (cat) ->
					{ ID: cat.id, Title: cat.get('Title') }
				json

		ProjectSearch