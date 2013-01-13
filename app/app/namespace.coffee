define [
		## Libs
		"jquery"
		"use!underscore"
		"use!backbone" 
	],

	($, _, Backbone) ->
		## Put application wide code here

		###
		This is useful when developing if you don't want to use a
		build process every time you change a template.

		Delete if you are using a different template loading method.
		###
		fetchTemplate: (path, done) ->
			JST = window.JST = window.JST or {}
			def = new $.Deferred()

			###
			Should be an instant synchronous way of getting the template, if it
			exists in the JST object.
			###
			if JST[path]
				done JST[path]  if _.isFunction(done)
				return def.resolve(JST[path])

			###
			Fetch it asynchronously if not available from JST, ensure that
			template requests are never cached and prevent global ajax event
			handlers from firing.
      		###
			$.ajax
				url: path
				type: "get"
				dataType: "text"
				cache: false
				global: false
				success: (contents) ->
					JST[path] = _.template(contents)

					## Set the global JST cache and return the template
					done JST[path]  if _.isFunction(done)

					## Resolve the template deferred
					def.resolve JST[path]

			## Ensure a normalized return value (Promise)
			def.promise()

		## Create a custom object with a nested Views object
		module: (additionalProps) ->
			_.extend
				Views: {}
			, additionalProps

		## Keep active application instances namespaced under an app object.
		app: _.extend({}, Backbone.Events)