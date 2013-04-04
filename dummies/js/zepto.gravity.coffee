(($, window) ->

	# http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	window.requestAnimFrame = (->
		window.requestAnimationFrame or window.webkitRequestAnimationFrame or window.mozRequestAnimationFrame or window.oRequestAnimationFrame or window.msRequestAnimationFrame or (callback, element) ->
			window.setTimeout callback, 1000 / 60
	)()

	#window.B2D_SCALE = 100

	# add zepto deferred plugin
	if Deferred
		Deferred.installInto Zepto

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
		constructor: (@id, @x, @y, @angle = 0) ->
		update: (@x, @y, @angle) ->
		setAwake: (@isAwake) ->
		scale: ->
			window.BOX2D_SCALE or 30
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

		constructor: (@id, @x, @y, @width = 0, @height = 0, @angle = 0) ->
			###
			$item = $("[data-gravity-item=#{@id}]")

			if not $item.length
				$('<div class="entity" data-gravity-item="' + @id + '">' + @id + '</div>')
					.appendTo('.gravity')
			###
			super @id, @x, @y, @angle

		halfWidth: ->
			@width / 2

		halfHeight: ->
			@height / 2

		draw: ->
			#.add($("##{@id}"))
			#$("##{@id}").css
			#console.log @id
			#console.log "draw entity #{@id}"
			#console.log $("[data-gravity-item=#{@id}]")
			$("[data-gravity-item=#{@id}]").css
				'top'			: @y * @scale()
				'left'			: @x * @scale()
				'margin-top'	: -@height * @scale() / 2
				'margin-left'	: -@width * @scale() / 2
				'height'		: @height * @scale()
				'width'			: @width * @scale()
				'background'	: if @isAwake then @color else @sleepColor

			#super ctx

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
			@scaleFactor = val
			if @worker
				@worker.postMessage
					key: 'setscale'
					value: val

		###
		 # constructs the Box2DHolder
		 #
		 # @param int width
		 # @param int height
		###
		constructor: (@width, @height, @zoom, @workerOpts) ->

			# init
			@init = ->
				console.log 'Box2DHolder init'

				# check webworker
				@useWorker = @hasWebWorker()

				# add page visibility change listener
				document.addEventListener 'webkitvisibilitychange', ( =>
					if document.webkitHidden
						@stop()
					else
						@start()
					), false

				@initResize()

				# DOM loaded (wi don't need this anymore (everything is wrapped in Zeptos DOM ready))
				#document.addEventListener 'DOMContentLoaded', =>
				# create dummy entities
				#@createDummies dummies

				# init physics
				if @useWorker then @initWorker() else @initNonWorker()

				@loop()

				# create gravity center
				#gravity = new GravityCenter 'gravity', 0.5 * 50, 0.5 * 20, 0, 0
				#@addEntity gravity

			# ! Private methods

			# window resize with timeout to fix an internet explorer bug
			# @link http://mbccs.blogspot.de/2007/11/fixing-window-resize-event-in-ie.html
			@initResize = ->
				# resize timeout
				@resizeTimeoutId

				# listener
				window.onresize = (event) =>
					clearTimeout @resizeTimeoutId
					@resizeTimeoutId = window.setTimeout () =>
						@width	= window.innerWidth or document.documentElement.clientWidth # w3c or IE
						@height	= window.innerHeight or document.documentElement.clientHeight # w3c or IE

						# @todo: check'n add non worker
						if @worker
							@worker.postMessage
								key		: 'dimensions'
								width	: @n(@width)
								height	: @n(@height)

							@needToDraw = true
					, 10

				#window.resize()
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
						console.info 'physics log:'
						console.log e.data.log
						return

					#console.log e.data.bodiesState
					newBodies = e.data.bodiesState

					@bodiesState = $.extend {}, @bodiesState, newBodies
					console.log Object.keys(@bodiesState).length
					#console.log @bodiesState

					# first run, reset our bodiesState
					###
					if not @bodiesState
						@bodiesState = newBodies
						@needToDraw = true
					else
					###
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
								@world[id].setAwake fals

				# pushes the dimensions down to the worker
				@worker.postMessage
					key		: 'dimensions'
					width	: @n(@width)
					height	: @n(@height)

				console.log 'sent dimensions %i, %i'
				console.log @n(@width)
				console.log @height
				console.log @n(@height)

				# pushes the entities to the worker
				#@worker.postMessage
				#	key: 'bodies'
				#	value: @world

			###
			 # creates the worker fallback
			###
			@initNonWorker = ->
				alert 'no webworker support :('
				console.log 'init non worker'

			###
			 # creates dummy entities
			###
			@createDummies = (amount = 20) ->
				i = 0

				while i < amount
					x = Math.random() * 50
					y = Math.random() * 20

					entity = new RectangleEntity "entity_#{i}", x, y, Math.random() + 0.4, Math.random() + 0.4

					@addEntity entity
					i++

			# start
			@init()

		###
		 # public add
		###
		add: (obj) ->
			if obj.id is 'gravity'
				gravity = new GravityCenter obj.id, @n(obj.left), @n(obj.top)
				@addGravity gravity
			else if obj.width and obj.height
				entity = new RectangleEntity obj.id, @n(obj.left), @n(obj.top), @n(obj.width), @n(obj.height)
				@addEntity entity

		###
		 # n pixel to float values
		###
		n: (num) ->
			num / @scaleFactor

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
			@worker.postMessage
				key: 'addEntity'
				entity: gravity

		###
		###
		addEntity: (entity) ->
			#console.log entity
			console.log "added entity '#{entity.id}'"
			@world[entity.id] = entity

			console.log @world

			# send notification to the worker
			@worker.postMessage
				key: 'addEntity'
				entity: @world[entity.id]

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
				#console.log state.linearVelocity
				if entity 
					#entity.setAwake state.awake
					entity.update state.x, state.y, state.a

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

	$.extend $.fn, RadialGravity: (methodOrOptions) ->

		@defaultOptions = 
			box2dZoom: 5
			elementSelector: null #going to use children
			itemIdPrefix: 'gravity-item-'
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

					init = ->
						# init worker
						storage().$container = $(el).data dataIdName, storageId

						storage().width = storage().$container.width()
						storage().height = storage().$container.height()

						# @todo fix it
						if storage().height <= 0
							storage().height = $(window).height()
						
						console.log storage().width
						console.log storage().height

						storage().box2DHolder = new Box2DHolder storage().width, storage().height, opts.box2dZoom, opts.worker
						
						# @todo make setScale accessable via public method
						storage().box2DHolder.setScale opts.box2d.scale
						window.BOX2D_SCALE = opts.box2d.scale

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
								console.log 'on resize'
								addGravity()
							, 10

					getStorageId = ->
						opts.itemIdPrefix + "#{storageId}-"

					getItemId = ->
						getStorageId() + getCountId()

					addGravity = ->
						methods.add
							id: 'gravity',
							top: storage().height / 2,
							left: storage().width / 2
						, storageId

					layoutItems = ($items) ->
						###
						elems = document.getElementsByTagName('div');
						increase = Math.PI * 2 / elems.length;

						var x = 0, y = 0, angle = 0, elem;

						for (var i = 0; i < elems.length; i++) {
							elem = elems[i];
							x = 100 * Math.cos(angle) + 200;
							y = 100 * Math.sin(angle) + 200;
							elem.style.position = 'absolute';
							elem.style.left = x + 'px';
							elem.style.top = y + 'px';
							angle += increase;
						}
						###

					findItems = ->
						$items = if opts.elementSelector then storage().$container.find(opts.elementSelector) else storage().$container.children()

						$.each $items, (index, item) =>
							$item = $(item)
							pos = $item.position()
							itemId = getItemId()

							itemData =
								id		: itemId
								width	: $item.width()
								height	: $item.height()
								top		: pos.top,
								left	: pos.left

							console.log $item
							$item.data 'gravity-item', itemId

							# add item to the box
							methods.add itemData, storageId

					init();

					return true;
		
			show : ->
				# IS

			hide : -> 
				# GOOD

			update : (content) ->
				# !!!
			
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
					implementationCount = $(@).data(dataIdName);

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