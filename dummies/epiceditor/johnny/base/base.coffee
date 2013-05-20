$ = jQuery

$ ->

	
	# init file transfer
	jQuery.event.props.push 'dataTransfer'
	
	# disable drag'n'drop for whole document
	$(document).on 'dragover drop', (e) ->
		e.preventDefault()

	$('#testarea').on 'dragover', (e) ->
		console.log e

	JJMarkdownEditor.setAsDraggable $('#testimg')
	editor = new JJMarkdownEditor '#editor',
		afterRender: ->
			window.picturefill()

	new JJImageDropzone '#dropper',
		url: '/_md_/images/personimage'