define [
	'app'
], (app) ->

	RecycleBin = {}

	RecycleBin.setup = ->
		@.$bin = $bin = $('#recycle-bin')
		$bin
			.on('dragenter', =>
				$bin.addClass 'dragover'
			)
			.on('dragleave', =>
				$bin.removeClass 'dragover'
			)
			.on('drop', =>
				toRecycle = @.activeRecycleDrag
				if toRecycle and toRecycle.className

					
					# @todo: check canDelete on serverside!!!
					# try to get it from Backbone.JJStore and use Backbone's native `destroy` method
					if model = Backbone.JJStore._byId toRecycle.className, toRecycle.model.id
						# destroy it
						model.destroy()
					else
						# not yet present in the store. destroy it manually
						url = JJRestApi.setObjectUrl(toRecycle.className, {id: toRecycle.model.id})
						console.log 'destroy manually'
						console.log url
			)

	RecycleBin.setViewAsRecyclable = (view) ->
		data = 
			view: view
			model: view.model

		data.className = if view.className then view.className else view.model.ClassName

		view.$el.on 'dragstart dragend', (e) =>
			$.fireGlobalDragEvent e.type, e.target

			if e.type is 'dragstart' 
				method = 'addClass'
				@.activeRecycleDrag = data
			else 
				@.activeRecycleDrag = null
				method = 'removeClass'
			@.$bin[method]('active')


	RecycleBin