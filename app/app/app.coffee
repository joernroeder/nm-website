define [
		# Libs
		'jquery'
		#'plugins/zepto.deferred.min'
		'underscore'
		'backbone'
		'handlebars'
		'plugins/backbone.layoutmanager'
		'plugins/backbone.JJRelational'
		'plugins/backbone.JJRestApi'
	],

	($, _, Backbone, Handlebars) ->	



		app =
			root: '/'
		JST = window.JST = window.JST || {}

		Backbone.NMLayout = Backbone.Layout.extend
			# this function checks if the layout has initially been rendered. This is useful for setting views in a layout later,
			# especially when there's still some XHR stuff going on and you don't really know if the layout has been rendered yet
			# or not
			setViewAndRenderMaybe: (selector, view) ->
				@.setView selector, view
				if @.__manager__.hasRendered then view.render()

		Backbone.Layout.configure
			manage: true

			prefix: 'app/app/templates/'

			fetch: (path) ->
				done = undefined

				# check if path is starting with '/' (use absolute)
				replacedPath = path.replace(Backbone.Layout.prototype.options.prefix, '')
				if replacedPath.indexOf('/') == 0 
					path = replacedPath.substring(1)
				else
					path = path + '.html'

				# If the template has not been loaded yet, then load.
				unless JST[path]
					done = @.async()
					return $.ajax(url: app.root + path).then((contents) ->
						JST[path] = Handlebars.compile contents
						JST[path].__compiled__ = true
						done JST[path]
					)

				# If the template hasn't been compiled yet, then compile.
				unless JST[path].__compiled__
					JST[path] = Handlebars.template JST[path]
					JST[path].__compiled__ = true
				
				return JST[path]

		# Mix Backbone.Events, modules, and layout management into the app object.
		return _.extend app, {
			# Create a custom object with a nested Views object.
			module: (additionalProps) ->
				_.extend { Views: {} }, additionalProps

			# Helper for using layouts.
			useLayout: (name, options) ->
				options = options || {}
				customClass = if options.customClass then options.customClass else name

				# If already using this Layout, then don't re-inject into the DOM.
				if @.layout and @.layout.getAllOptions().template is 'layouts/' + name
					l = @.layout
					if l.customClass then l.$el.removeClass(l.customClass)
					if customClass
						l.customClass = customClass
						l.$el.addClass customClass

					return @.layout

				# If a layout already exists, remove it from the DOM.
				if @.layout then @.layout.remove()
				

				# Create a new Layout with options.
				layout = new Backbone.NMLayout _.extend({
					template: 'layouts/' + name
					className: 'layout ' + customClass
					id: 'layout'
				}, options)

				# Insert into the DOM.
				$('#main').empty().append layout.el
				$(layout.el).css 'height', '100%'

				# Set body class to current layout
				currentLayout = @.currentLayoutName
				$body = $ 'body'
				if currentLayout then $body.removeClass(currentLayout)
				$body.addClass(name)

				@.currentLayoutName = name

				# Render the layout.
				layout.render()

				# Cache the reference.
				@.layout = layout

				# Return the reference, for chainability.
				return layout
		}, Backbone.Events