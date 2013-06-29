define [
	'app'
], (app) ->

	RecycleBin = {}

	RecycleBin.setup = ->
		doneHandling = ->
			$bin.addClass 'done'
			setTimeout ->
				$bin.removeClass 'done'
			, 1000

		@.$bin = $bin = $('#recycle-bin').removeClass 'done'
		$bin.on 'dragenter dragleave drop', (e) ->
			method = if e.type is 'dragenter' then 'addClass' else 'removeClass'
			$(e.target)[method] 'dragover'

		$bin.on 'drop', (e) =>
			toRecycle = @.activeRecycleDrag
			@.activeRecycleDrag = null
			if toRecycle and toRecycle.className
				$bin.addClass 'processing'

				id = if toRecycle.model.ID then toRecycle.model.ID else toRecycle.model.id
				
				# try to get it from Backbone.JJStore and use Backbone's native `destroy` method
				@.removeViewAndData toRecycle
			
				if model = Backbone.JJStore._byId toRecycle.className, id
					# destroy it
					model.destroy()
					doneHandling()
					$bin.removeClass 'processing'
				else
					# not yet present in the store. destroy it manually
					url = JJRestApi.setObjectUrl(toRecycle.className, {id: id})
					req = $.ajax
						url: url
						contentType: 'json'
						type: 'DELETE'

					req.always =>
						$bin.removeClass 'processing'

					req.done =>
						doneHandling()

	
	RecycleBin.removeViewAndData = (toRecycle) ->
		toRecycle.view.$el.trigger 'dragend'
		$('body').removeClass 'drag-inline'
		# handle gallery
		if toRecycle.className is 'PersonImage' or toRecycle.className is 'DocImage'
			app.removeFromGalleryCache toRecycle.className, toRecycle.model.id
			toRecycle.view.liveRemoval()
		else
			toRecycle.view.remove()

	RecycleBin.setViewAsRecyclable = (view) ->
		data = 
			view: view
			model: view.model

		data.className = if view.className then view.className else view.model.className

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