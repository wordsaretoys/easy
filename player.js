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

		var that = this;		
		dom.window.bind("keydown", function(event) {
			that.onKeyDown(event);
		});
		dom.window.bind("keyup", function(event) {
			that.onKeyUp(event);
		});
		dom.mouseTracker.bind("mousedown", function(event) {
			that.onMouseDown(event);
		});
		dom.mouseTracker.bind("mouseup", function(event) {
			that.onMouseUp(event);
		});
		dom.mouseTracker.bind("mousemove", function(event) {
			that.onMouseMove(event);
		});

		// create a yaw/pitch constrained camera
		this.camera = SOAR.camera.create(
			EASY.display, 
			SOAR.camera.BOUND_ROTATION);
		this.camera.nearLimit = 0.01;
		this.camera.farLimit = 1024;
		
		// move player to starting point and orientation
		this.footPosition.copy(EASY.world.player.position);
		this.camera.turn(EASY.world.player.rotation, 0);
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
			scratch.direction.sub(camera.orientation.front);
		}
		if (motion.moveback) {
			scratch.direction.add(camera.orientation.front);
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
		this.constrainVelocity(this.footPosition, this.velocity);

		scratch.velocity.copy(this.velocity).mul(dt);
		this.footPosition.add(scratch.velocity);
		this.constrainPosition(this.footPosition);

		this.headPosition.copy(this.footPosition);
		this.headPosition.y += this.PLAYER_HEIGHT;
		camera.position.copy(this.headPosition);
	},
	
	/**
		adjust velocity to conform to environment
		
		@method constrainVelocity
		@param p player position
		@param v player velocity (to be adjusted)
	**/
	
	constrainVelocity: function(p, v) {
		var bound = EASY.world.boundary;
		var lh = EASY.cave.getLowerHeight(p.x, p.z);
		var uh = EASY.cave.getUpperHeight(p.x, p.z);
		var down = this.scratch.direction;
	
		// on the ground, v can't be negative
		if (p.y === lh) {
			v.y = v.y > 0 ? v.y : 0;
		}
		
		// don't permit player to walk into boundary
		if (p.x < bound.cx0) {
			v.x = v.x > 0 ? v.x : 0;
		}
		if (p.x > bound.cx1) {
			v.x = v.x < 0 ? v.x : 0;
		}
		if (p.z < bound.cz0) {
			v.z = v.z > 0 ? v.z : 0;
		}
		if (p.z > bound.cz1) {
			v.z = v.z < 0 ? v.z : 0;
		}
		
		// generate a vector that points to "down" and whose 
		// magnitude increases geometrically with the slope
		down.set(
			EASY.cave.getLowerHeight(p.x - 1, p.z) - EASY.cave.getLowerHeight(p.x + 1, p.z),
			0, 
			EASY.cave.getLowerHeight(p.x, p.z - 1) - EASY.cave.getLowerHeight(p.x, p.z + 1)
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
		var lh = EASY.cave.getLowerHeight(p.x, p.z);
		var uh = EASY.cave.getUpperHeight(p.x, p.z);
	
		// p isn't allowed to be below ground
		if (p.y < lh) {
			p.y = lh;
		}

		// don't let player's head go into the upper wall
//		if (p.y + this.PLAYER_HEIGHT + 0.1 >= uh) {
//			p.y = uh - (this.PLAYER_HEIGHT + 0.1);
//		}

		// don't permit player to walk into boundary
		if (p.x < bound.cx0) {
			p.x = bound.cx0;
		}
		if (p.x > bound.cx1) {
			p.x = bound.cx1;
		}
		if (p.z < bound.cz0) {
			p.z = bound.cz0;
		}
		if (p.z > bound.cz1) {
			p.z = bound.cz1;
		}
	},
	
	/**
		handle a keypress
		
		@method onKeyDown
		@param event browser object containing event information
		@return true to enable default key behavior
	**/

	onKeyDown: function(event) {

		var motion = this.motion;
		
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
				this.sprint = true;
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

		var motion = this.motion;

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
				this.sprint = false;
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
		this.mouse.down = true;
		return false;
	},
	
	/**
		handle a mouse up event
		
		@method onMouseUp
		@param event browser object containing event information
		@return true to enable default mouse behavior
	**/

	onMouseUp: function(event) {
		this.mouse.down = false;
		return false;
	},

	/**
		handle a mouse move event
		
		@method onMouseMove
		@param event browser object containing event information
		@return true to enable default mouse behavior
	**/

	onMouseMove: function(event) {
		var dx, dy;

		if (this.mouse.down) {
			dx = this.SPIN_RATE * (event.pageX - this.mouse.x);
			dy = this.SPIN_RATE * (event.pageY - this.mouse.y);
			this.camera.turn(dx, dy);
		}
		this.mouse.x = event.pageX;
		this.mouse.y = event.pageY;
		return false;
	},
	
};

