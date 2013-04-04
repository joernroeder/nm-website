"use strict";

# ! Imports
importScripts './Box2D.js' # box2D Library
importScripts './RadialGravity.js' # RadialGravity Extension

# =============================================

hz = 30
box = new RadialGravity hz, false
# ---------------------------------------------

ready = false

# ! Interface Message Listener ----------------

log = (value) ->
	self.postMessage
		key: 'log'
		log: value
###
 # passes dimensions to the worker
 #
 # @param int width
 # @param int height
###
setDimensions = (width, height) ->
	box.setDimensions width, height

addEntity = (entity) ->
	box.setBody entity.id, entity

	# trigger first run
	if box.ready() and not ready
		postState()

		pos = box.getGravityPosition()

		log pos
		#ready = true

postState = (id) ->
	timing = box.update()
	state = box.getState()

	if state
		self.postMessage
			time		: timing
			bodiesState	: state
			id			: id

setScale = (val) ->
	box.setScale val

self.onmessage = (e) ->

	# switch on message key
	switch e.data.key

		# onAddEntity
		when 'addEntity' then addEntity e.data.entity

		# passes dimensions down to the worker
		when 'dimensions' then setDimensions e.data.width, e.data.height

		# set bodies
		#when 'bodies' then box.setBodies e.data.value
		
		# require update
		when 'req' then	postState e.data.id

		when 'setscale' then setScale e.data.value