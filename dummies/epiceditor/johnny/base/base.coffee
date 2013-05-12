$ = jQuery

$ ->

	
	# init file transfer
	jQuery.event.props.push 'dataTransfer'
	# disable drag'n'drop for whole document
	
	$(document).on 'dragover drop', (e) ->
		e.preventDefault()
	
	$('#testimg').on 'dragstart', (e) ->
		e.dataTransfer.setData 'text/html', null

	$('#testarea').on 'dragover', (e) ->
		console.log e


	editor = new JJMarkdownEditor '#editor'

	JJMarkdownEditor.setAsDraggable $('#testimg')