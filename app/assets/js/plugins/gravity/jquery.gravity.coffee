###

    000000  0000000000    000000000000000000
    000000  0000000000    00000000000000000000
    000000      000000    000000   00000  000000
    000000      000000    000000     000  000000
     00000      000000    000000       0  000000
       000      000000    000000          000000
         0      000000    000000          000000

    Neue Medien - Kunsthochschule Kassel
    http://neuemedienkassel.de

###
(($, window) ->

	# http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	window.requestAnimFrame = (->
		window.requestAnimationFrame or window.webkitRequestAnimationFrame or window.mozRequestAnimationFrame or window.oRequestAnimationFrame or window.msRequestAnimationFrame or (callback, element) ->
			window.setTimeout callback, 1000 / 60
	)()

	window.debugGravity = false

	window.logger = ->
		if window.debugGravity
			console.log arguments[0]


	#window.B2D_SCALE = 100

	# ---------------------------------------------
	
	###
	 # Creates a basic Entity with the given parameters
	 # this should be just the base class to extend.
	 #
	 # @param int id
	 # @param float x
	 # @param float y
	 # @param float angle (optional)
	###
	class Entity
		constructor: (@id, @x, @y, @scaleFactor = 30) ->

		update: (@x, @y, @angle) ->
		setAwake: (@isAwake) ->
		scale: ->
			@scaleFactor

		draw: ->

	# ---------------------------------------------

	###
	 # Creates a Rectangle with the given parameters
	 #
	 # @param int id
	 # @param float x
	 # @param float y
	 # @param float width
	 # @param float height
	 # @param float angle (optional)
	###
	class RectangleEntity extends Entity

		color: 'red'
		sleepColor: 'gray'

		constructor: (@id, @x, @y, @width = 0, @height = 0, @scaleFactor = 30) ->
			###
			$item = $("[data-gravity-item=#{@id}]")

			if not $item.length
				$('<div class="entity" data-gravity-item="' + @id + '">' + @id + '</div>')
					.appendTo('.gravity')
			###
			super @id, @x, @y, @scaleFactor

		halfWidth: ->
			@width / 2

		halfHeight: ->
			@height / 2

		draw: ->
			# @todo cache variable in global storage
			$item = $("[data-gravity-item=#{@id}]")

			if $item.length
				###
				tooltip = window.currentTooltip
				if tooltip.targetId and tooltip.targetId is @id
					$item.qtip 'reposition'

					logger 'update tooltip'
				###

				$("[data-gravity-item=#{@id}]").css
					'top'			: @y * @scale()
					'left'			: @x * @scale()
					'margin-top'	: -@height * @scale() / 2
					'margin-left'	: -@width * @scale() / 2
					'height'		: @height * @scale()
					'width'			: @width * @scale()
					#'background'	: if @isAwake then @color else @sleepColor

	# ---------------------------------------------
	
	class Border extends RectangleEntity

		constructor: (@id, @x, @y, @width = 0, @height = 0, @scaleFactor = 30) ->
			
			$item = $("[data-gravity-item=#{@id}]")

			if not $item.length
				$('<div class="entity" data-gravity-item="' + @id + '">' + @id + '</div>')
					.appendTo('.gravity')

			super @id, @x, @y, @scaleFactor
	


	# ---------------------------------------------

	class GravityCenter extends RectangleEntity

		color: 'green'
		draw: ->

	# ---------------------------------------------

	class Box2DHolder

		# calculate physics using a webworker
		useWorker	: false

		# webworker pointer
		worker		: null

		# state of word entities
		bodiesState	: {}

		# world entities
		world		: {}

		border		: {}

		# box2D pointer as a fallback for no webworker support
		box			: null

		# message counter
		msgID		: 0

		# redraw flag
		needToDraw	: true

		# scale
		scaleFactor	: 30

		setScale: (val) ->
			logger "box2DHolder set scale to #{val}"
			@scaleFactor = val
			if @worker
				@worker.postMessage
					key: 'setscale'
					value: val

		setDimensions: (@width, @height) ->
			# @todo: check'n add non worker
			if @worker
				@worker.postMessage
					key		: 'dimensions'
					width	: @n(@width)
					height	: @n(@height)

				logger "set dimensions: #{@n(@width)} - #{@n(@height)}"

				@needToDraw = true

		###
		 # constructs the Box2DHolder
		 #
		 # @param int width
		 # @param int height
		###
		constructor: (@width, @height, @padding, scale, @workerOpts) ->

			# init
			@init = ->
				logger 'Box2DHolder init'

				# set scale
				@setScale scale

				# check webworker
				@useWorker = @hasWebWorker()

				# add page visibility change listener
				document.addEventListener 'webkitvisibilitychange', ( =>
					if document.webkitHidden
						@stop()
					else
						@start()
					), false

				# init physics
				if @useWorker then @initWorker() else @initNonWorker()

				@setDimensions @width, @height

				@loop()

			# ! Private methods

			###
			 # Returns whether the page supports web workers
			###
			@hasWebWorker = ->
				typeof Worker isnt 'undefined'

			###
			 # creates the worker and sends the entities down the wire
			###
			@initWorker = ->
				@worker = new Worker @workerOpts.physics

				# On a new message of the worker the transmitted 
				# entity-states will be set and the canvas is forced to re-draw
				#
				# NOTE: The worker sends only updated entities!
				#
				@worker.onmessage = (e) =>
					# logging hack
					if 'log' is e.data.key
						#console.info 'physics log:'
						logger e.data.log
						return

					newBodies = e.data.bodiesState
					@bodiesState = $.extend {}, @bodiesState, newBodies
					
					# iterate over all bodies
					for id of @bodiesState
						newBody = newBodies[id]

						# body will be updated and is still awake
						if @world[id]
							if newBody
								@world[id].setAwake true
								@bodiesState[id] = newBody
								@needToDraw = true

							# body was awake and went to sleep. sleep well ;)
							else if @world[id].isAwake
								@needToDraw = true
								@world[id].setAwake false

					# @todo: trigger update here
						

			###
			 # creates the worker fallback
			###
			@initNonWorker = ->
				alert 'no webworker support :('
				logger 'init non worker'

			# start
			@init()

		###
		 # public add
		###
		add: (obj) ->
			#logger obj
			if obj.id is 'gravity'
				gravity = new GravityCenter obj.id, @n(obj.left), @n(obj.top), @scaleFactor
				@addGravity gravity
			else if obj.width and obj.height
				entity = new RectangleEntity obj.id, @n(obj.left), @n(obj.top), @n(obj.width), @n(obj.height), @scaleFactor
				@addEntity entity

		###
		 # n pixel to float values
		###
		n: (num) ->
			num / @scaleFactor

		w: (num) ->
			num += @n(@padding * @width)

		h: (num) ->
			num += @n(@padding * @height)

		###
		 # running thread
		###
		looper: 0
		loop: (animStart) =>
			@update animStart
			@draw()
			#@looper++

			#if @looper < 100
			window.requestAnimFrame @loop

		###
		 # (re)-starts the simulation
		###
		start: ->
			@worker.postMessage
				key: 'start'

		###
		 # stops the simulation
		###
		stop: ->
			@worker.postMessage
				key: 'stop'

		###
		###
		addGravity: (gravity) ->
			logger 'add Gravity'
			@worker.postMessage
				key: 'addEntity'
				entity: gravity

		###
		###
		addEntity: (entity) ->
			logger "added entity '#{entity.id}'"
			@world[entity.id] = entity

			# send notification to the worker
			@worker.postMessage
				key: 'addEntity'
				entity: @world[entity.id]

			@needToDraw = true

		###
		 # triggers the update
		 # uses the worker if possible and sends him a message down the pipe
		 #
		###
		update: (animStart) ->
			#start stats
			#stats.update()

			if @useWorker
				if @needToDraw
					@worker.postMessage
						key: 'req'
						id: @msgID
					
					@msgID++
			else
				@box.update()
				@bodiesState = @box.getState()
				@needToDraw = true

			for id of @bodiesState
				entity = @world[id]
				state = @bodiesState[id]
				
				if entity 
					#entity.setAwake state.awake
					entity.update @w(state.x), @h(state.y), state.a

		###
		 # redraws the world entities if nessessary
		 #
		 # @use this.needToDraw
		###
		draw: ->
			if not @needToDraw then return

			# clear canvas
			#@ctx.clearRect 0, 0, @width, @height
			for id, entity of @world
				entity = @world[id]
				entity.draw()

			@needToDraw = false



	# ! Implementation =======================================

	RadialGravityStorage =
		itemIdCount: 0
		implementationCount: 0
		implementations: {}

	window.Storage = RadialGravityStorage
	window.currentTooltip = {}

	$.extend $.fn, RadialGravity: (methodOrOptions) ->

		@defaultOptions = 
			elementSelector: null #going to use children
			itemIdPrefix: 'gravity-item-'
			padding: 0
			box2d:
				scale: 100
			worker:
				physics: 'physics.js'

		# private options
		dataIdName = 'gravity-id'
		self = @

		#privat methods
		storage = (count) ->
			RadialGravityStorage.implementations[count]
		
		# http://stackoverflow.com/a/6871820/520544
		methods =
			init : (options) ->
				
				opts = $.extend {}, @defaultOptions, options

				getCountId = ->
					RadialGravityStorage.itemIdCount++
					return RadialGravityStorage.itemIdCount;

				# Code here will run each time your plugin is invoked
				@each (i, el) =>

					# set up vars
					storageId = RadialGravityStorage.implementationCount;
					RadialGravityStorage.implementationCount++;
					RadialGravityStorage.implementations[storageId] = 
						$container	: null
						box2DHolder	: null
						width		: 0
						height		: 0
						options		: opts

					# storage shortcut 
					storage = ->
						RadialGravityStorage.implementations[storageId]

					setDimensions = ->
						store = storage()
						store.$container.css 'min-height', $(window).height()

						width = store.$container.width()
						height = store.$container.height()

						width = width - (opts.padding * width)
						height = height - (opts.padding * height)

						store.width = width
						store.height = height

						# @todo trigger resize on box2DHolder
						# @todo fix it
						if store.height <= 0
							store.height = $(window).height()

					setAndUpdateDimensions = ->
						setDimensions()
						store = storage()
						store.box2DHolder.setDimensions store.width, store.height

					init = ->
						# init worker
						storage().$container = $(el).data dataIdName, storageId
						setDimensions()						
						storage().box2DHolder = new Box2DHolder storage().width, storage().height, opts.padding, opts.box2d.scale, opts.worker
						initResize()

						# add gravity and items
						addGravity()
						findItems()

					# resize timeout
					resizeTimeoutId = null
					initResize = ->
						# listener
						window.onresize = (event) =>
							clearTimeout resizeTimeoutId
							resizeTimeoutId = setTimeout =>
								# @todo: check'n add non worker
								
								#setDimensions()
								setAndUpdateDimensions()

								logger 'on resize'
								addGravity()
							, 10

					getStorageId = ->
						opts.itemIdPrefix + "#{storageId}-"

					getItemId = ->
						getStorageId() + getCountId()

					addGravity = ->
						methods.add
							id: 'gravity'
							top: storage().height / 2
							left: storage().width / 2
						, storageId

					layoutItems = ($items) ->
						inc = Math.PI * 2 / $items.length
						x = y = angle = 0
						store = storage()

						$items.each (i, el) ->
							noise = Math.random() * 100
							$item = $ el

							if Math.random() > .5
								noise *= -1

							d = Math.min(store.width, store.height) / 2
							x = Math.max $item.width(), Math.min(store.width - $item.width(), d * Math.cos(angle) + d + noise)
							y = Math.max $item.height(), Math.min(store.height - $item.height(), d * Math.sin(angle) + d + noise)

							console.log x
							console.log y
							#x = d * Math.cos(angle) + d
							#y = d * Math.sin(angle) + d

							el.style.position = 'absolute'
							el.style.left = x + 'px'
							el.style.top = y + 'px'
							angle += inc

					updateItemDimensions = ($items) ->
						$items.each (i,el) ->

							$item = $ el

							if not $item.hasClass 'resizable' then return

							rand = Math.max .2, Math.random() * 1.8

							width = $item.width() * rand
							height = $item.height() * rand

							# update container
							$item.width width
							$item.height height

					initTooltip = ($item) ->
						$metaSection = $ 'section[role=tooltip-content]', $item
						marginOffset = -20

						getMargin = (api) ->
							margin = marginOffset
							$tooltip = $ api.tooltip

							if $tooltip.hasClass('qtip-pos-rb')
								logger 'inverse margin'
								margin *= -1

							margin


						if $metaSection.length
							$item
							.qtip
								content:
									text: $metaSection.html()

								###
								events:
									render: (event, api) ->
										# Grab the tooltip element from the API elements object

										#updateMargin api
								###

								show:
									event: 'mouseenter'
									
									effect: (api) ->										
										$item.addClass 'has-tooltip'
										$(@)
											.stop(true, true)
											.css
												'margin-left': getMargin api
											.show()
											.animate
												'margin-left': 0
												'opacity': 1
											, 200
									
									#effect: false
									#ready: true

								hide: 
									event: 'mouseleave'
									effect: (api) ->
										$(@)
											.stop(true, true)
											.animate
												'margin-left': getMargin api
												'opacity': 0
											, 200, () ->
												$item.removeClass 'has-tooltip'
												$(@).hide()

								###
								events:
									show: (e, api) ->
										window.currentTooltip = 
											tip			: @
											target		: api.target
											targetId	: $(api.target).attr 'data-gravity-item'
											api			: api

									hide: (e, api) ->
										window.currentTooltip = {}
								###

								position:
									at: "right bottom"
									my: "left bottom"
									viewport: storage().$container
									#viewport: $ window
									adjust:
										method: 'flip shift'
										x: 0
										y: 10

							logger $item.qtip('api').tooltip

					addItemEvents = ($item) ->
						$item.imagesLoaded().done ($images) ->
							$item.addClass 'loaded'
							initTooltip $item


					findItems = ->
						$items = if opts.elementSelector then storage().$container.find(opts.elementSelector) else storage().$container.children()

						updateItemDimensions $items
						layoutItems $items

						$.each $items, (index, item) =>
							$item = $(item)
							pos = $item.position()
							itemId = getItemId()

							addItemEvents $item

							itemData = 
								id		: itemId
								width	: $item.width()
								height	: $item.height()
								#top		: 100
								#left	: 100
								top		: pos.top
								left	: pos.left

							#console.log itemData

							#logger itemData.top
							#logger itemData.left

							# logger itemData
							$item.attr 'data-gravity-item', itemId

							# add item to the box
							methods.add itemData, storageId

					init()

					return true;
		
			show: ->
				# IS

			hide: -> 
				# GOOD

			update: (content) ->
				# !!!
			
			###
			setPadding: (p) ->
				@
			###

			###
			 # adds an item to the gravity world
			 #
			 # @param object data
			 #
			 # @example
			 # 		$('selector').RadialGravity('add', {
			 #			id: 'foobar',
			 #			width: 100,
			 #			height: 100,
			 #			top: 0,
			 #			left: 0
			 #		});
			###
			add: (data, implementationCount) ->
				if implementationCount is undefined
					implementationCount = $(@).data dataIdName

				else if typeof implementationCount isnt 'number'
					console.error 'Couldn\'t add items to gravity container.'

				storage(implementationCount).box2DHolder.add data
				

		# - - - - - - - - - - - - - - - - -
		
		if methods[methodOrOptions]
			return methods[methodOrOptions].apply(@, Array.prototype.slice.call( arguments, 1 ))
		
		else if typeof methodOrOptions is 'object' or not methodOrOptions
			## Default to "init"
			return methods.init.apply @, arguments

		else
			console.error "Method #{method} does not exist on $.RadialGravity"		
		
		@ # allow chaining

) this.jQuery or this.Zepto, this