/**
	maintain player state and camera, handle control 
	events related to player motion and interactions
	
	@namespace EASY
	@class player
**/

EASY.player = {

	SPIN_RATE: -0.007,
	NORMAL_SPEED: 4,
	SPRINT_SPEED: 10,
	PLAYER_HEIGHT: 1.5,

	headPosition: SOAR.vector.create(),
	footPosition: SOAR.vector.create(),
	velocity: SOAR.vector.create(),

	motion: {
		moveleft: false, moveright: false,
		movefore: false, moveback: false
	},
	
	mouse: {
		down: false,
		x: 0,
		y: 0,
		invalid: true
	},
	
	scratch: {
		direction: SOAR.vector.create(),
		velocity: SOAR.vector.create()
	},
	
	debug: false,
	sprint: false,

	/**
		establish jQuery shells around player DOM objects &
		set up event handlers for player controls
		
		mouseTracker div lies over canvas and HUD elements to
		prevent mouse dragging from selecting anything under it
		
		@method init
	**/

	init: function() {
	
		var dom = this.dom = {
			mouseTracker: jQuery("#mouse-tracker"),
			window: jQuery(window)
		};
		
		dom.mouseTracker.resize = function() {
			dom.mouseTracker.width(EASY.display.width);
			dom.mouseTracker.height(EASY.display.height);
		}
		dom.window.bind("resize", dom.mouseTracker.resize);
		dom.mouseTracker.resize();

		dom.window.bind("keydown", this.onKeyDown);
		dom.window.bind("keyup", this.onKeyUp);

		dom.mouseTracker.bind("mousedown", this.onMouseDown);
		dom.mouseTracker.bind("mouseup", this.onMouseUp);
		dom.mouseTracker.bind("mousemove", this.onMouseMove);

		// create a yaw/pitch constrained camera
		this.camera = SOAR.camera.create(
			EASY.display, 
			SOAR.camera.BOUND_ROTATION);
		this.camera.nearLimit = 0.01;
		this.camera.farLimit = 1024;
	},
	
	/**
		react to player controls by updating velocity and position
		handle collision detection
		
		called on every animation frame
		
		@method update
	**/

	update: function() {
		var dt = SOAR.interval * 0.001;
		var speed = (this.sprint) ? this.SPRINT_SPEED : this.NORMAL_SPEED;
		var scratch = this.scratch;
		var motion = this.motion;
		var camera = this.camera;
		
		scratch.direction.set();
		if (motion.movefore) {
			scratch.direction.add(camera.orientation.front);
		}
		if (motion.moveback) {
			scratch.direction.sub(camera.orientation.front);
		}
		if (motion.moveleft) {
			scratch.direction.sub(camera.orientation.right);
		}
		if (motion.moveright) {
			scratch.direction.add(camera.orientation.right);
		}
		if (!this.debug)
			scratch.direction.y = 0;
		scratch.direction.norm();
		
		this.velocity.x = scratch.direction.x * speed;
		this.velocity.y = this.debug ? scratch.direction.y * speed : this.velocity.y - 9.81 * dt;
		this.velocity.z = scratch.direction.z * speed;
//		this.constrainVelocity(this.footPosition, this.velocity);

		scratch.velocity.copy(this.velocity).mul(dt);
		this.footPosition.add(scratch.velocity);
		this.constrainPosition(this.footPosition);

		this.headPosition.copy(this.footPosition);
		this.headPosition.y += this.PLAYER_HEIGHT;
		camera.position.copy(this.headPosition);
		
		EASY.debug(this.footPosition.x + "<br>" + this.footPosition.z);
	},
	
	/**
		adjust velocity to conform to environment
		
		@method constrainVelocity
		@param p player position
		@param v player velocity (to be adjusted)
	**/
	
	constrainVelocity: function(p, v) {
		var bound = EASY.world.boundary;
		var lh = EASY.chamber.getFloorHeight(p.x, p.z);
		var uh = EASY.chamber.getCeilingHeight(p.x, p.z);
		var down = this.scratch.direction;
	
		// on the ground, v can't be negative
		if (p.y === lh) {
			v.y = v.y > 0 ? v.y : 0;
		}

		// generate a vector that points to "down" and whose 
		// magnitude increases geometrically with the slope
		down.set(
			EASY.chamber.getFloorHeight(p.x - 1, p.z) - EASY.chamber.getFloorHeight(p.x + 1, p.z),
			0, 
			EASY.chamber.getFloorHeight(p.x, p.z - 1) - EASY.chamber.getFloorHeight(p.x, p.z + 1)
		).set(
			Math.pow(down.x, 2) * SOAR.sign(down.x),
			0,
			Math.pow(down.z, 2) * SOAR.sign(down.z)
		);
		v.add(down);

		// don't let player's head go into the upper wall
		if (p.y + this.PLAYER_HEIGHT >= uh) {
			v.copy(down);
		}
		
	},
	
	/**
		adjust position to conform to environment
		
		@method constrainPosition
		@param p player position (to be adjusted)
	**/
	
	constrainPosition: function(p) {
		var bound = EASY.world.boundary;
		var lh = EASY.chamber.getFloorHeight(p.x, p.z);
		var uh = EASY.chamber.getCeilingHeight(p.x, p.z);
	
		// p isn't allowed to be below ground
		if (p.y < lh) {
			p.y = lh;
		}

		// don't let player's head go into the upper wall
//		if (p.y + this.PLAYER_HEIGHT + 0.1 >= uh) {
//			p.y = uh - (this.PLAYER_HEIGHT + 0.1);
//		}

		// if we've gone past the exit, signal that it's
		// time to go to a new cave chamber
		if (p.z <= 0) {
			EASY.generate();
		}
	},
	
	/**
		handle a keypress
		
		@method onKeyDown
		@param event browser object containing event information
		@return true to enable default key behavior
	**/

	onKeyDown: function(event) {

		var that = EASY.player;
		var motion = that.motion;
		
		switch(event.keyCode) {
			case SOAR.KEY.A:
				motion.moveleft = true;
				break;
			case SOAR.KEY.D:
				motion.moveright = true;
				break;
			case SOAR.KEY.W:
				motion.movefore = true;
				break;
			case SOAR.KEY.S:
				motion.moveback = true;
				break;
			case SOAR.KEY.SHIFT:
				that.sprint = true;
				break;
				
// debugging keys -- remove in production release

			case SOAR.KEY.H:
				EASY.world.hideCave = !EASY.world.hideCave;
				break;
			case SOAR.KEY.N:
				EASY.world.stopModels = !EASY.world.stopModels;
				break;
			case SOAR.KEY.G:
				EASY.player.footPosition.y = 100;
				EASY.player.velocity.y = 0;
				break;
			case SOAR.KEY.T:
				EASY.chamber.generate();
				break;
		}
	},

	/**
		handle a key release
		
		@method onKeyUp
		@param event browser object containing event information
		@return true to enable default key behavior
	**/

	onKeyUp: function(event) {

		var that = EASY.player;
		var motion = that.motion;

		switch(event.keyCode) {
		
			case SOAR.KEY.A:
				motion.moveleft = false;
				break;
			case SOAR.KEY.D:
				motion.moveright = false;
				break;
			case SOAR.KEY.W:
				motion.movefore = false;
				break;
			case SOAR.KEY.S:
				motion.moveback = false;
				break;
			case SOAR.KEY.SHIFT:
				that.sprint = false;
				break;
		}
	},

	/**
		handle a mouse down event
		
		@method onMouseDown
		@param event browser object containing event information
		@return true to enable default mouse behavior
	**/

	onMouseDown: function(event) {
		EASY.player.mouse.down = true;
		return false;
	},
	
	/**
		handle a mouse up event
		
		@method onMouseUp
		@param event browser object containing event information
		@return true to enable default mouse behavior
	**/

	onMouseUp: function(event) {
		EASY.player.mouse.down = false;
		return false;
	},

	/**
		handle a mouse move event
		
		@method onMouseMove
		@param event browser object containing event information
		@return true to enable default mouse behavior
	**/

	onMouseMove: function(event) {
		var that = EASY.player;
		var dx, dy;

		if (that.mouse.down) {
			dx = that.SPIN_RATE * (event.pageX - that.mouse.x);
			dy = that.SPIN_RATE * (event.pageY - that.mouse.y);
			that.camera.turn(-dx, -dy);
		}
		that.mouse.x = event.pageX;
		that.mouse.y = event.pageY;
		return false;
	},
	
};

