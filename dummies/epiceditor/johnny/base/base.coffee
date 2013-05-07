$ = jQuery

$ ->

	
	# init file transfer
	jQuery.event.props.push 'dataTransfer'
	# disable drag'n'drop for whole document
	$(document).on 'dragover drop', (e) ->
		e.preventDefault()


	editor = new JJMarkdownEditor '#editor'