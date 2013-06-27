define [
		'app'
		'modules/DataRetrieval'
		'modules/DocImage'
	],
(app, DataRetrieval, DocImage) ->

	class ImageMarkdownParser extends CustomMarkdownParser
		className: 'DocImage'
		rule: /\[img\s{1,}(.*?)\]/gi

		parseFound: (found) ->
			parseInt found

		isVisibleForMember: (model) ->
			_.each

		getData: (ids) ->
			@data = []
			# we must return a Deferred, so build it up already
			dfd = new $.Deferred()
			DataRetrieval.forMultipleDocImages(ids).done (models) =>
				# okay, so we have our models now, but we need to check if they may be seen anyway!
				toShow = []
				_.each models, (model) =>
					if model.isVisibleForMember() then toShow.push(model)
				
				# add to our data
				_.each toShow, (img) =>
					src = img.get('Urls')._1200.Url
					@data.push { id: img.id, tag: "<span><img src=\"#{src}\" /></span>" }

				dfd.resolve()

			dfd



	class OEmbedMarkdownParser extends CustomMarkdownParser
		rule: /\[embed\s{1,}(.*?)\]/gi
		url: '/_md_/oembed/'


	# make available
	window.ImageMarkdownParser = ImageMarkdownParser
	window.OEmbedMarkdownParser = OEmbedMarkdownParser