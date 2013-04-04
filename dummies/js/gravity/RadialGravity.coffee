"use strict"

b2Vec			= Box2D.Common.Math.b2Vec2
b2BodyDef		= Box2D.Dynamics.b2BodyDef
b2Body			= Box2D.Dynamics.b2Body

b2FixtureDef	= Box2D.Dynamics.b2FixtureDef
b2Fixture		= Box2D.Dynamics.b2Fixture

b2World			= Box2D.Dynamics.b2World

#b2MassData		= Box2D.Collision.Shapes.b2MassData
b2PolygonShape	= Box2D.Collision.Shapes.b2PolygonShape
#b2CircleShape	= Box2D.Collision.Shapes.b2CircleShape

#b2DebugDraw		= Box2D.Dynamics.b2DebugDraw
b2AABB			= Box2D.Collision.b2AABB
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

	log: (value) ->
		self.postMessage
			key: 'log'
			log: value

	###
	 #
	 # @param int intervalRate
	 # @param boolean adaptive
	###
	constructor: (@intervalRate, @adaptive) ->
		# ! init
		@init = ->
			@world = new b2World new b2Vec(0, 0), true
			@setBox2DSettings()

			# wait for bodies @setBodies
			@hasGravity = false
			@bodyCount = 0

		# ! private constructors
		@fixDef = ->
			fix = new b2FixtureDef
			fix.density		= 0.0
			fix.friction	= 1.0
			fix.restitution	= 0.0

			#fixDef.restitution = 0
			#fixDef.density = 1
			#fixDef.friction = 1

			fix.shape = new b2PolygonShape

			fix # return

		@bodyDef = (staticBody) ->
			body = new b2BodyDef

			if staticBody
				body.type = b2Body.b2_staticBody
			else
				body.type = b2Body.b2_dynamicBody
				body.allowSleep = true

			body.fixedRotation = true
			body.linearDamping = .5
			body.angularDamping = .5
			body.gravityScale = 0.0

			body # return

		@setBox2DSettings = ->
			b2Settings.b2_linearSleepTolerance = .5
			b2Settings.b2_angularSleepTolerance = .5
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
	# world borders
	borders: {}
	borderWidth: 1
	hasBorders: false
	setDimensions: (@width, @height) ->

		#@width = @width / 2
		#@height = @height / 2
		
		borderDefs = [
			# top
			{
				id: 'border-top'
				x: @width / 2
				y: @borderWidth / -2
				width: @width
				height: @borderWidth
			},

			# right
			{
				id: 'border-right'
				x: @width + (@borderWidth / 2)
				y: @height / 2
				width: @borderWidth
				height: @height
			},

			# bottom
			{
				id: 'border-bottom'
				x: @width / 2
				y: @height + (@borderWidth / 2)
				width: @width
				height: @borderWidth
			},

			# left
			{
				id: 'border-left'
				x: @borderWidth / -2
				y: @height / 2
				width: @borderWidth
				height: @height
			}

		]
		
		createBorder = (border) =>
			body = @bodyDef true
			#bodyDef = new b2BodyDef
			#bodyDef.type = b2Body.b2_staticBody
			body.userData = border.id

			body.position.Set border.x, border.y

			fix = @fixDef()
			#fixDef = new b2FixtureDef
			#fixDef.density = 1.0
			#fixDef.friction = 0
			#fixDef.restitution = 1

			#fixDef.shape = new b2PolygonShape
			fix.shape.SetAsBox border.width / 2, border.height / 2

			@world.CreateBody(body).CreateFixture fix
			@borders[border.id] = 
				body: body
				fixture: fix

			true

			#create ground
         #bodyDef.type = b2Body.b2_staticBody;
         #fixDef.shape = new b2PolygonShape;
         #fixDef.shape.SetAsBox(20, 2);
         #bodyDef.position.Set(10, 400 / 30 + 1.8);
         #world.CreateBody(bodyDef).CreateFixture(fixDef);
         #bodyDef.position.Set(10, -1.8);
         #world.CreateBody(bodyDef).CreateFixture(fixDef);
         #fixDef.shape.SetAsBox(2, 14);
         #bodyDef.position.Set(-1.8, 13);
         #world.CreateBody(bodyDef).CreateFixture(fixDef);
         #bodyDef.position.Set(21.8, 13);
         #world.CreateBody(bodyDef).CreateFixture(fixDef);

		createBorders = =>
			for border in borderDefs
				log border
				createBorder border
			
			#@world.CreateBody(body).CreateFixture fix
			@hasBorders = true

		updateBorders = ->


		#if Object.keys(@borders).length or @hasBorders
		#if @hasBorders
		#	updateBorders()
		#else
		log 'create borders'
		createBorders()

		true
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

		# get gravity position
		gravityPosition = @getGravityPosition()

		return false if not gravityPosition

		# get entities
		b = @world.GetBodyList()

		# calc entities
		while b
			id = b.GetUserData()
			# if has id
			if b.IsAwake() and b.IsActive() and id and id isnt 'gravity'
				pos = b.GetPosition()
				
				# calc gravity
				gravityDistance = new b2Vec 0, 0
				gravityDistance.Add pos
				gravityDistance.Subtract gravityPosition

				distance = gravityDistance.Length()
				gravityDistance.NegativeSelf()
				vecSum = Math.abs pos.x + Math.abs pos.y
				gravityDistance.Multiply (1000 / vecSum) * 10 / distance
				#postMessage gravityDistance
				d = new b2Vec gravityDistance.x, gravityDistance.y
				b.ApplyForce d, b.GetPosition()

				state[id] = 
					x: pos.x
					y: pos.y

			else if id and id.indexOf('border') isnt -1
				###
				fixture = b.GetFixtureList()

				aabb = new b2AABB
				aabb.lowerBound = new b2Vec 0, 0
				aabb.upperBound = new b2Vec 0, 0

				while fixture
					aabb.Combine aabb, fixture.GetAABB()
					fixture = fixture.m_next

				log aabb

				if not state[id] then state[id] is {}
				###
				border = @borders[id]

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
		#@world.Step stepRate, 10, 100, 50
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

	setGravity: (gravity) ->
		@gravityPosition = new b2Vec gravity.x, gravity.y
		log 'gravity position:'
		log @gravityPosition
		#@gravityPosition = new b2Vec @width / 2, @height / 2
		@hasGravity = true
		@forceRecalc()


	getGravity: ->
		b = @world.GetBodyList()
		while b
			id = b.GetUserData()
			if id is 'gravity'
				return b
			b = b.m_next

		false

	forceRecalc: ->
		# get entities
		b = @world.GetBodyList()

		while b
			b.SetAwake true
			b = b.m_next


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
		bodyDef = @bodyDef()

		if id is 'gravity'
			@setGravity entity
		else
			fixDef = @fixDef()
			fixDef.shape.SetAsBox entity.width / 2 , entity.height / 2

			bodyDef.position.x = entity.x
			bodyDef.position.y = entity.y
			bodyDef.userData = entity.id

			@world.CreateBody(bodyDef).CreateFixture fixDef

			@bodyCount++

