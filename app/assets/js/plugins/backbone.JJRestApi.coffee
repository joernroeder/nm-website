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

JJRestApi.extendModel = (className, modelToExtendFrom, extension) ->
	model = @.Model className
	if modelToExtendFrom.prototype instanceof Backbone.Model is false
		extension = modelToExtendFrom
		modelToExtendFrom = model
	extension || (extension = {})
	if model
		@.Models[className] = modelToExtendFrom.extend extension

JJRestApi.extendCollection = (className, collTypeToExtendFrom, extension) ->
	collType = @.Collection className
	if collTypeToExtendFrom instanceof Backbone.Collection is false
		extension = collTypeToExtendFrom
		collTypeToExtendFrom = collType
	extension || (extension = {})
	if collType
		@.Collections[className] = collTypeToExtendFrom.extend extension


JJRestApi.setObjectUrl = (className, options) ->
	options = options || {}
	@.url + className + (if options.id then '/' + options.id else '') + '.' + @.extension

###*
 *
 * Gets the security token passed by SilverStripe and adds it to every ajax request
 * 
###
JJRestApi.hookSecurityToken = () ->
	JJRestApi.getFromDomOrApi('SecurityID', { noAjax: true }).done (data) ->
		if data.SecurityID
			$(document).bind 'ajaxSend', (event, xhr, settings) ->
				xhr.setRequestHeader data.RequestHeader, data.SecurityID

###*
 * Loads an Object from the DOM via #api-object or /api/v2/Object.extension
 * @param  {String} name    name to get/fetch (e.g. ClassName)
 * @param  {Object} options 
 * @return deferred promise object
###
JJRestApi.getFromDomOrApi = (name, options) ->
	options = options || {}

	nameToSearch = if options.name then options.name else name.toLowerCase()
	###*
	 * @todo get the API-prefix from DOM and pass it on from SilverStripe
	###
	$obj = $('#api-' + nameToSearch)

	# found in DOM
	if ($obj.length)
		data = $.trim $obj.html()

		# parse json
		if ($obj.attr('type') == 'application/json')
			data = $.parseJSON data

		dfd = new $.Deferred()
		dfd.resolve(data)
		return dfd.promise()

	else unless options.noAjax
		url = if options.url then options.url else JJRestApi.setObjectUrl(name, options)
		if options.urlSuffix then url += options.urlSuffix
		dfd = $.getJSON url
		JJRestApi.Events.trigger 'dfdAjax', dfd
		return dfd
	else return $.Deferred().resolve null



###*
 *
 * Converts an object with search and context to URL String, e.g. 's=Foo:bar&context=view.foobar'
 * 
###
JJRestApi.objToUrlString = (obj) ->
	returnString = ''
	for key, value of obj
		if key is ('search' or 's')
			searchString = 's='
			for k, v of value
				searchString += encodeURIComponent(k) + ':'
				searchString += if _.isArray(v) then encodeURIComponent(v.join('|')) else encodeURIComponent(v)
				searchString += ';'
			returnString += searchString
		else
			returnString += encodeURIComponent(key) + '=' + encodeURIComponent(value)
		returnString += '&'
	l = returnString.length
	if returnString.lastIndexOf('&') is (l-1) then returnString = returnString.substr(0, l-1)
	returnString




###
 #	The Bootstrapper rebuilds the JJ_RestfulServer/Structure response as backbone-relational structure
 #
 #	@param callback function
 #	@return false
###
JJRestApi.bootstrapWithStructure = (callback) ->
	dfd = JJRestApi.getFromDomOrApi 'Structure'
	dfd.done (data) ->
		JJRestApi.Bootstrap data
	dfd.fail ->
		throw new Error 'Structure could not be loaded.'
	dfd

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

		modelOptions.urlRoot = @.setObjectUrl className
		modelOptions.idAttribute = 'ID'


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
		@.Models[className] = Backbone.JJRelationalModel.extend {}
				

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