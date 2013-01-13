define [
		"app"
	],
	
	(app) ->

		## Create a new module
		Example = namespace.module()

		## Example extendings
		Example.Model = Backbone.Model.extend({
			## ...
		})

		Example.Collection = Backbone.Collection.extend({
			## ...
		})

		Example.Router = Backbone.Router.extend({
			## ...
		})

		## This will fetch the tutorial template and render it.
		Example.Views.Tutorial = Backbone.View.extend(
			template: "app/templates/example.html"
			render: (done) ->
				view = @
				namespace.fetchTemplate @template, (tmpl) ->
					view.el.innerHTML = tmpl()

					##  If a done function is passed, call it with the element
					done view.el  if _.isFunction(done)
		)

		## Required, return the module for AMD compliance
		Example