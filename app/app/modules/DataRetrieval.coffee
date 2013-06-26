define [
		'app'
	],
	(app) ->

		# ! DATA RETRIEVAL HELPER OBJECT
	
		DataRetrieval =

			# abstract function to get data for Projects/Exhibitions/Workshops/Excursions for either 'featured page'
			# or 'portfolio page'
		
			forProjectsOverview: (configObj) ->
				present = configObj.present
				projectTypes = app.Config.ProjectTypes

				returnDfd = new $.Deferred()

				unless present.flag
					# featured Projects/Exhibitions/Workshops/Excursions are not yet present
					# get them either from DOM or API
					dfds = []
					for projectType in projectTypes
						do (projectType) ->
							options = 
								name: configObj.domName(projectType)
								urlSuffix : configObj.urlSuffix
							dfds.push JJRestApi.getFromDomOrApi(projectType, options).done((data) ->
								app.handleFetchedModels projectType, data
							)
					$.when.apply(@, dfds).done ->
						present.flag = true
						returnDfd.resolve()

				else
					returnDfd.resolve()
				returnDfd.promise()

			# function that takes a search term used to filter the whole portfolio
			filterProjectTypesBySearchTerm: (searchTerm) ->
				wholePortfolio = app.Cache.WholePortfolio

				# because of simplicity reasons we iterate over an array of json objects. let's cache the whole json portfolio
				unless app.Cache.WholePortfolioJSON
					tmp = []
					for model in wholePortfolio
						tmp.push model.toJSON()
					app.Cache.WholePortfolioJSON = tmp

				# transform the searchTerm
				searchObj = ProjectSearch.transformSearchTerm searchTerm
				console.log searchObj

				result = _.filter app.Cache.WholePortfolioJSON, (model) ->
					result = true
					_.each searchObj, (vals, key) ->
						if not ProjectSearch.test(model, key, vals) then result = false

					# if the filter returns true
					return result

				out = _.map result, (model) ->
					do (model) ->
						return _.find wholePortfolio, (m) ->
							return m.id is model.ID and m.get('ClassName') is model.ClassName

				out

			# abstract function to get data for the Calendar (either the whole calendar, or merely the upcoming events)
			forCalendar: (type) ->
				config = app.Config.Calendar[type]
				dfd = new $.Deferred()

				unless config.flag
					options = _.clone config
					options.name = type + '-calendar'

					JJRestApi.getFromDomOrApi('CalendarEntry', options).done (data) ->
						# set an internal "IsUpcoming" flag for faster accessing
						if type is 'upcoming'
							for item in data
								item.IsUpcoming = true
						app.handleFetchedModels 'CalendarEntry', data
						config.flag = true
						if type is 'whole' then app.Config.Calendar.upcoming.flag = true
						dfd.resolve()
				else
					dfd.resolve()

				dfd.promise()

			# function to get persons' data for the "About"-page
			# namely all persons except externals
			forPersonsOverview: ->
				config = app.Config.Person
				dfd = new $.Deferred()

				unless config.about_present
					options = _.clone config
					JJRestApi.getFromDomOrApi('Person', options).done (data) ->
						config.about_present = true
						app.handleFetchedModels 'Person', data
						dfd.resolve()
				else
					dfd.resolve()
				dfd.promise()

			# abstract function to get the detailed data of a calendar item by its ugly Hash
			forDetailedObject: (classType, slug, checkForLoggedIn) ->
				configObj = app.Config.Detail[classType]
				dfd = new $.Deferred()

				# check if there is already a Calendar Entry with the urlHash
				coll = app.Collections[classType]
				whereStatement = configObj.where(slug)

				existModel = coll.findWhere whereStatement
				if existModel
					if existModel._isCompletelyFetched then resolve = true
					if checkForLoggedIn and not existModel._isFetchedWhenLoggedIn then resolve = false

					if resolve
						dfd.resolve existModel
					else
						return @.fetchExistingModelCompletely(existModel)
				else
					options =
						name: configObj.domName
						urlSuffix: configObj.urlSuffix(slug)

					JJRestApi.getFromDomOrApi(classType, options).done (data) ->
						data = if _.isArray(data) then data else [data]
						model = if data.length is 1 then app.handleFetchedModel(classType, data[0]) else null
						
						if model
							# set a flag that says the model is completely fetched
							model._isCompletelyFetched = true
							# set a flag that says if the model has been fetched while logged in
							model._isFetchedWhenLoggedIn = true
						dfd.resolve model	

				dfd.promise()

			# title says it all
			forRandomGroupImage: ->
				pageInfos = app.PageInfos
				dfd = new $.Deferred()
				getRandom = ->
					groupImages = pageInfos.GroupImages
					if groupImages.length > 0
						return groupImages[Math.floor(Math.random() * groupImages.length)]
					null
				unless pageInfos.GroupImages
					JJRestApi.getFromDomOrApi('GroupImage').done (data) ->
						pageInfos.GroupImages = data
						dfd.resolve getRandom()
				else
					dfd.resolve getRandom()
				dfd.promise()

			# getting the user gallery
			forUserGallery: (type) ->
				userGallery = app.Cache.UserGallery
				dfd = new $.Deferred()
				if userGallery.fetched[type]
					dfd.resolve userGallery
				else
					req = $.getJSON(app.Config.GalleryUrl + type + '/')
						.done (data) ->
							userGallery.images[type] = data
							userGallery.fetched[type] = true
							dfd.resolve userGallery
					dfd.fail ->
						if req.readyState isnt 4 then req.abort()
				dfd

			# just get a regular DocImage
			forDocImage: (id) ->
				dfd = new $.Deferred()
				if existModel = app.Collections.DocImage.get(id)
					dfd.resolve existModel
				else
					JJRestApi.getFromDomOrApi('DocImage', { id: id }).done (model) ->
						if model
							dfd.resolve app.handleFetchedModel('DocImage', model)
						else
							dfd.reject()

				dfd.promise()

			# abstract function that calls `fetch` on a model and then calls back
			fetchExistingModelCompletely : (existModel) ->
				dfd = new $.Deferred()
				existModel.fetch
					success: (model) ->
						dfd.resolve model
						# set a flag that says the model is completely fetched
						model._isCompletelyFetched = true
						# set a flag that says if the model has been fetched while logged in
						model._isFetchedWhenLoggedIn = true
				dfd.promise()

		DataRetrieval