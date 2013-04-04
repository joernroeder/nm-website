"use strict"

b2Vec			= Box2D.Common.Math.b2Vec2
b2BodyDef		= Box2D.Dynamics.b2BodyDef
b2Body			= Box2D.Dynamics.b2Body

b2FixtureDef	= Box2D.Dynamics.b2FixtureDef
b2Fixture		= Box2D.Dynamics.b2Fixture

b2World			= Box2D.Dynamics.b2World

#b2MassData		= Box2D.Collision.Shapes.b2MassData
b2PolygonShape	= Box2D.Collision.Shapes.b2PolygonShape
b2EdgeShape		= Box2D.Collision.Shapes.b2EdgeShape
b2CircleShape	= Box2D.Collision.Shapes.b2CircleShape

b2DebugDraw		= Box2D.Dynamics.b2DebugDraw

b2Settings		= Box2D.Common.b2Settings

# =============================================

class RadialGravity

	# canvas dimensions. 
	# @link setDimensions()
	width	: 0
	height	: 0

	# set by constructor
	intervalRate	: 0
	adaptive		: false

	# world borders
	borders: {}

	###
	 #
	 # @param int intervalRate
	 # @param boolean adaptive
	###
	constructor: (@intervalRate, @adaptive) ->
		# ! init
		@init = ->
			@setBox2DSettings()
			@world = new b2World(
				new b2Vec(0, 0),
				true
			)

			# wait for bodies @setBodies
			@hasGravity = false
			@bodyCount = 0

			@bodyDef()
			@fixDef()

			@world.CreateBody(@bodyDef).CreateFixture @fixDef

		# ! private methods
		@fixDef = ->
			fix = new b2FixtureDef
			fix.density		= 1.0
			fix.friction	= 0
			fix.restitution	= 0

			fix.shape = new b2PolygonShape
			fix.shape.SetAsBox @width / @scale() / 2, @height / @scale() / 2

			@fixDef = fix

		@bodyDef = ->
			body = new b2BodyDef
			body.type = b2Body.b2_staticBody
			body.position.x = @width / 2 / @scale()
			body.position.y = @height / @scale()
			body.fixedRotation = true

			@bodyDef = body

		@setBox2DSettings = ->
			#b2Settings.b2_linearSleepTolerance = 5
			#b2Settings.b2_angularSleepTolerance = 5
			b2Settings.b2_timeToSleep = .5


		# run
		@init()
		
	###
	 # set canvas dimensions
	 #
	 # @param int width
	 # @param int height
	 #
	###
	@hasBorders: false
	setDimensions: (@width, @height) ->

		#@width = @width / 2
		#@height = @height / 2

		borderWidth = 2
		borders = 
			#top
			{
				x: 0
				y: 0
				width: @width
				height: borderWidth
			}

		createBorder = (border) =>
			bodyDef = new b2BodyDef
			bodyDef.type = b2Body.b2_staticBody;
			#bodyDef.userData = border.id

			bodyDef.position.x = border.x
			bodyDef.position.y = border.y

			fixDef = new b2FixtureDef
			fixDef.density = 1.0
			fixDef.friction = .2
			fixDef.restitution = 1

			fixDef.shape = new b2PolygonShape
			fidDef.shape.SetAsBox border.width / 2, border.height / 2

			@world.CreateBody(bodyDef).CreateFixture(fixDef)

		createBorders = =>
			for border in borders
				createBorder border
			
			#@world.CreateBody(body).CreateFixture fix
			@hasBorders = true

		updateBorders = ->


		#if Object.keys(@borders).length or @hasBorders
		if @hasBorders
			updateBorders()
		else
			createBorders()
	###
	 # returns the box2D scale
	 #
	 # @return int
	###
	scaleFactor: 30
	scale: ->
		#window.B2D_SCALE or 30
		@scaleFactor

	setScale: (val) ->
		@scaleFactor = val

	ready: ->
		return @hasGravity and @bodyCount > 0

	getState: ->
		state = {}

		# get gravity
		# @todo put body somewhere so we dont't have to get it every update!
		#b = @world.GetBodyList()
		###
		gravity = null
		while b
			id = b.GetUserData()
			if id is 'gravity'
				gravity = b
			b = b.m_next
		return false if not gravity
		###

		# get gravity position
		gravityPosition = @getGravityPosition()

		return false if not gravityPosition

		###
		state['gravity'] = 
			x: gravityPosition.x
			y: gravityPosition.y
			#a: gravity.GetAngle()
		###

		# get entities
		b = @world.GetBodyList()

		# calc entities
		while b
			id = b.GetUserData()
			# if has id
			if b.IsAwake() and b.IsActive() and typeof id isnt 'undefined' and id? and id isnt 'gravity'
				pos = b.GetPosition()
				
				# calc gravity
				gravityDistance = new b2Vec 0, 0
				gravityDistance.Add pos
				gravityDistance.Subtract gravityPosition

				distance = gravityDistance.Length()
				gravityDistance.NegativeSelf()
				vecSum = Math.abs pos.x + Math.abs pos.y
				gravityDistance.Multiply ( 1000 / vecSum) * 10 / distance
				#postMessage gravityDistance
				d = new b2Vec gravityDistance.x, gravityDistance.y
				b.ApplyForce d, b.GetPosition()

				state[id] = 
					x: pos.x
					y: pos.y

			# get next
			b = b.m_next

		# return state
		state


	update: ->
		now = Date.now()
		stepRate = if @adaptive then (now - @timestamp / 1000) else (1 / @intervalRate)

		@world.Step stepRate, 10, 10
		@world.ClearForces()

		# return timing
		Date.now() - now
	
	###
	 # creates a gravity box2D-Element
	 #
	 # @param gravity GravityCenter
	 #	
	###
	gravity: null
	gravityPosition: null
	
	getGravityPosition: ->
		p = false

		if @gravity
			p = @gravity.GetPosition()

		else if @gravityPosition
			p = @gravityPosition

		p
	## #
	setGravity: (gravity) ->
		#@gravityPosition = new b2Vec gravity.x, gravity.y
		@gravityPosition = new b2Vec 1,1
		@hasGravity = true
	###
	setGravity: (gravity) ->
		if @gravity
			@updateGravity gravity
			return

		#postMessage gravity
		@bodyDef.type = b2Body.b2_staticBody

		@fixDef.restitution = 0
		@fixDef.density = 500
		@fixDef.friction = 1
		@fixDef.shape = new b2PolygonShape
		@fixDef.shape.SetAsBox gravity.width / 2 , gravity.height / 2

		@bodyDef.position.x = gravity.x
		@bodyDef.position.y = gravity.y
		@bodyDef.userData = 'gravity'

		@world.CreateBody(@bodyDef).CreateFixture @fixDef

		@gravity = @getGravity()

		@hasGravity = true
	###

	updateGravity: (gravity) ->
		if @gravity
			pos = new b2Vec gravity.x, gravity.y
			@gravity.position.x = gravity.x
			@gravity.position.y = gravity.y

		#@bodyDef.position.x = gravity.x
		#@bodyDef.position.y = gravity.y


	getGravity: ->
		b = @world.GetBodyList()
		while b
			id = b.GetUserData()
			if id is 'gravity'
				return b
			b = b.m_next

		false


	###
	 # creates the bodies and sets the this.ready flag
	 #
	 # @param object id: RectangleEntity
	###
	setBodies: (entities) ->
		#@bodyDef.type = b2Body.b2_dynamicBody

		for id, entity of entities
			setBody id, entity

	###
	 # creates a body
	###
	setBody: (id, entity) ->
		@bodyDef.type = b2Body.b2_dynamicBody

		if id is 'gravity'
			@setGravity entity
		else
			@fixDef.restitution = 0
			@fixDef.density = 1
			@fixDef.friction = 1
			@fixDef.shape = new b2PolygonShape
			@fixDef.shape.SetAsBox entity.width / 2 , entity.height / 2

			@bodyDef.position.x = entity.x
			@bodyDef.position.y = entity.y
			@bodyDef.userData = entity.id
			@bodyDef.allowSleep = true
			@bodyDef.fixedRotation = true

			@world.CreateBody(@bodyDef).CreateFixture @fixDef

			@bodyCount++

