###
	Represents the JJRestApi for global Settings, Events, Models and Collections
	
	Example: Accessible in every module via
	
		define[
			'modules/JJRestApi'
		], (JJRestApi) ->
###

## General Setup
JJRestApi =
	url : '/api/v2/'
	extension : 'json'
	structurID : 'api-structure'

## Setup store for models, Collections, collections and modules
JJRestApi.Models = {}
JJRestApi.Collections = {}

JJRestApi.Modules = {}
JJRestApi.Modules._modules = []

## clone Backbone.Events for JJRestApi access
JJRestApi.Events = _.extend({}, Backbone.Events)

### 
 #	Prototype getter
 #
 #	@param string className
 #	@return Backbone.RelationalModel based on className
###
JJRestApi.Model = (className) ->
	return if @.Models[className] then @.Models[className] else false

###
 #	Collection getter
 #
 #	@param string className
 #	@return Backbone.Collection based on className	 
###
JJRestApi.Collection = (className) ->
	return if @.Collections[className] then @.Collections[className] else false


###
 #	Register Modules and extend them after bootstrapping the app structure
 #
 #	@param Object module
 #	@param function extensions in a callback
###
JJRestApi.Modules.extend = (module, extension) ->
	JJRestApi.Modules._modules.push({
		module 		: module
		extension	: extension
	})

	true

JJRestApi.extendModel = (className, extension) ->
	extension || (extension = {})
	if model = @.Model(className)
		@.Models[className] = model.extend extension

JJRestApi.extendCollection = (className, extension) ->
	extension || (extension = {})
	if collType = @.Collection(className)
		@.Collections[className] = collType.extend extension


JJRestApi.setObjectUrl = (className) ->
	@.url + className + '.' + @.extension

###
 #	Loads a Object from the DOM via #api-object or /api/v2/Object.extension
 #
 #	@todo check $.getJSON with xml type
 #	@return data json/xml
###
JJRestApi.getFromDomOrApi = (name, options, callback) ->
	if _.isFunction(options)
		callback = options
		options = {}

	nameToSearch = if options.name then options.name else name.toLowerCase()

	$obj = $('#api-' + nameToSearch)

	# found in DOM
	if ($obj.length)
		data = $.trim $obj.html()

		# parse json
		if ($obj.attr('type') == 'application/json')
			data = $.parseJSON data

		if (callback and _.isFunction callback)
			callback data, options

	# load structure from server
	else
		url = if options.url then options.url else JJRestApi.setObjectUrl(name)
		if options.urlSuffix then url += options.urlSuffix
		$.getJSON url, (data) =>
			if (callback && _.isFunction callback)
				callback data, options

	data

###
 #	The Bootstrapper rebuilds the JJ_RestfulServer/Structure response as backbone-relational structure
 #
 #	@param callback function
 #	@return false
###
JJRestApi.bootstrapWithStructure = (callback) ->

	JJRestApi.getFromDomOrApi 'Structure', (data) ->
		JJRestApi.Bootstrap data

		if (callback && _.isFunction callback)
				callback data

	false

JJRestApi.Bootstrap  = (response) ->
	data
	config
	collectionsToRegister = []

	getRelationType = (type) ->
		relType

		switch type
			when 'belongs_to'			then relType = 'has_one'
			when 'has_one' 				then relType = 'has_one'
			when 'has_many'				then relType = 'has_many'
			when 'many_many'			then relType = 'many_many'
			when 'belongs_many_many' 	then relType = 'many_many'

		relType

	getRelationObj = (className, relation) ->

		relType = getRelationType relation.Type

		relationObj = 
			type 			: relType
			relatedModel 	: ->
				JJRestApi.Model relation.ClassName	
			key 			: relation.Key
			reverseKey 		: relation.ReverseKey
			includeInJSON	: ['id'] 
		
		if relType isnt 'has_one' 
			relationObj.collectionType = relation.ClassName
			collectionsToRegister.push relation.ClassName

		relationObj

	isMany = (type) ->
		return if type = 'has_many' or 'many_many' then true else false
		
	buildPrototype = (className, relations, config) =>
		modelOptions = 
			defaults		: {}

		rels = []

		for i, relation of relations
			if relObj = getRelationObj(className, relation)
				rels.push relObj

		# set relations on modelOptions
		modelOptions.relations = rels if rels.length

		# set the storeIdentifier for Backbone.JJStore
		modelOptions.storeIdentifier = className

		# set the url
		modelOptions.url = ->
			if @.id then return JJRestApi.url + @.storeIdentifier + '/' + @.id + '.' + JJRestApi.extension else return @.urlRoot


		## add Config.DefaultFields
		if config and config.DefaultFields
			for index, field of config.DefaultFields
				modelOptions.defaults[field] = null

		@.Models[className] = @.Model(className).extend modelOptions

		true

	## get the structural data
	config = response.Config || false
	data = if response.Config then response.Objs else response

	## return if no response
	return if not data

	##
	## CORE FUNCTIONS!!!
	##
	##

	#
	# Step I: Build up general Models and Collections
	#
	for className, relations of data
		@.Models[className] = Backbone.JJRelationalModel.extend
			urlRoot			: @.setObjectUrl className
			idAttribute		: 'ID'
				

		@.Collections[className] = Backbone.Collection.extend
			url: @.setObjectUrl className
			comparator: (model) ->
				model.id
			parse : (response) ->
				response

	#
	# Step II: Before proceeding any further, extend the models/collections as in the specified modules
	#
	for module in JJRestApi.Modules._modules
		module.extension.call(window, module.module)

	#
	# Step III: Add the relations to models and add 'model'-property to collection
	#
	for className, relations of data
		buildPrototype className, relations, config
		@.Collections[className] = @.Collection(className).extend
			model: @.Model(className)

	#
	# Step IV: register the needed collection types on JJRelational
	#
	collRegisterObj = {}
	for name in _.uniq(collectionsToRegister)
		collRegisterObj[name] = @.Collection name
	Backbone.JJRelational.registerCollectionTypes collRegisterObj


	false


JJRestApi