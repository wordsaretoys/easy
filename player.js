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
	HEIGHT: 1.5,
	MAX_RESOLVE: 50,
	RECOVERY_RATE: 0.5,
	ATTACK_DELAY: 2,
	ATTACK_DISTANCE: 6,
	
	COMMENTS: {
	
		cave: {

			entry: [
				"Nice decor, for a cave.",
				"These colors just don't go."
			]
		},
	
		trash: {
		
			wood: [
				"Another smashed treasure chest. Easy's not the most patient man, is he?",
				"Looks like <em>someone</em> forgot to bring his lockpicks again."
			],
			
			oil: [
				"Lamp oil. He must carry a barrel of the stuff."
			],
			
			flesh: [
				"Yeech. I hate picking up someone else's nose."
			],
			
			cloth: [
				"So, which priceless antique tapestry was this?",
				"Art makes Easy upset. I think he never learned to appreciate it."
			],
			
			change: [
				"All right! Enough money to buy a shoe! Retirement, here I come!"
			]
		},
		
		attack: {
		
			excuse: [
				"Easy's had a hard life. He was a deprived child. And a depraved teenager."
			],
			
			appease: [
				"Look, I can see that you've got valid complaints here."
			],
			
			flatter: [
				"The whole ethereal thing looks good on you."
			],
			
			blame: [
				"Hoarding gold? You were just asking for a brutal murder.",
				"I bet you were wearing something provactive. Like a shirt.",
				"Lurking in a dark cave? Might as well have been yelling <em>kill me</em>."
			],
			
			confuse: [
				"Look, a tiger. Wearing a hat. Indoors, even."
			],
			
			notready: [
				"...wait, it'll come to me...",
				"...I had a good one, hold on...",
				"...my mind's a blank right now...",
				"...oh look, rocks...",
				"...uh, okay, maybe not..."
			],
			
			toofar: [
				"What, am I talking to <em>myself</em> now?",
				"I'll bet no one can hear me over here."
			]

		}
		
	},

	headPosition: SOAR.vector.create(),
	footPosition: SOAR.vector.create(),
	velocity: SOAR.vector.create(),
	
	resolve: 0,
	trash: {},
	cooldown: 0,
	
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
	
	sprint: false,

	/**
		establish jQuery shells around player DOM objects &
		set up event handlers for player controls
		
		tracker div lies over canvas and HUD elements, which
		allows us to track mouse movements without issues in
		the mouse pointer sliding over an untracked element.
		
		@method init
	**/

	init: function() {
	
		var dom = this.dom = {
			tracker: jQuery("#tracker"),
			window: jQuery(window)
		};
		
		dom.window.bind("keydown", this.onKeyDown);
		dom.window.bind("keyup", this.onKeyUp);

		dom.tracker.bind("mousedown", this.onMouseDown);
		dom.tracker.bind("mouseup", this.onMouseUp);
		dom.tracker.bind("mousemove", this.onMouseMove);

		// create a yaw/pitch constrained camera for player view
		this.eyeview = SOAR.camera.create(
			EASY.display, 
			SOAR.camera.BOUND_ROTATION);
		this.eyeview.nearLimit = 0.01;
		this.eyeview.farLimit = 100;

		// create a free camera for overhead views
		this.overhead = SOAR.camera.create(
			EASY.display,
			SOAR.camera.FREE_ROTATION);
		this.overhead.nearLimit = 1;
		this.overhead.farLimit = 500;
		this.overhead.position.set(
			EASY.cave.LENGTH * 0.5, 75, EASY.cave.LENGTH * 0.5);
		this.overhead.turn(SOAR.PIDIV2, 0, 0);
		
		// default camera to player view
		this.camera = this.eyeview;
		
		// init player state
		this.resolve = this.MAX_RESOLVE;

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
		
		if (camera === this.overhead)
			return;
		
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
		scratch.direction.norm();
		
		this.velocity.x = scratch.direction.x * speed;
		this.velocity.y = this.velocity.y - 9.81 * dt;
		this.velocity.z = scratch.direction.z * speed;
		this.constrainVelocity(this.footPosition, this.velocity);

		scratch.velocity.copy(this.velocity).mul(dt);
		this.footPosition.add(scratch.velocity);
		this.constrainPosition(this.footPosition);

		this.headPosition.copy(this.footPosition);
		this.headPosition.y += this.HEIGHT;
		camera.position.copy(this.headPosition);
		
		if (this.cooldown > 0) {
			this.cooldown = Math.max(0, this.cooldown - dt);
		}
		
		if (this.resolve < this.MAX_RESOLVE && EASY.ghost.motion !== EASY.ghost.ATTACKING) {
			this.resolve = Math.min(this.resolve + this.RECOVERY_RATE * dt, this.MAX_RESOLVE);
			EASY.hud.setPlayerResolve(this.resolve / this.MAX_RESOLVE);
		}
	},
	
	/**
		adjust velocity to conform to environment
		
		@method constrainVelocity
		@param p player position
		@param v player velocity (to be adjusted)
	**/
	
	constrainVelocity: function(p, v) {
		var down = this.scratch.direction;
	
		// on the ground, v can't be negative
		if (p.y === EASY.cave.getFloorHeight(p.x, p.z)) {
			v.y = v.y > 0 ? v.y : 0;
		}

		// generate a vector that points to "down" and whose 
		// magnitude increases geometrically with the slope
		down.set(
			EASY.cave.getFloorHeight(p.x - 1, p.z) - EASY.cave.getFloorHeight(p.x + 1, p.z),
			0, 
			EASY.cave.getFloorHeight(p.x, p.z - 1) - EASY.cave.getFloorHeight(p.x, p.z + 1)
		).set(
			Math.pow(down.x, 2) * SOAR.sign(down.x),
			0,
			Math.pow(down.z, 2) * SOAR.sign(down.z)
		);
		v.add(down);

		// don't let player's head go above the wall
		if (p.y >= EASY.cave.WALL_HEIGHT - this.HEIGHT - 0.5) {
			v.x = down.x;
			v.z = down.z;
		}
		
	},
	
	/**
		adjust position to conform to environment
		
		@method constrainPosition
		@param p player position (to be adjusted)
	**/
	
	constrainPosition: function(p) {
		var lh = EASY.cave.getFloorHeight(p.x, p.z);
	
		// p isn't allowed to be below ground
		if (p.y < lh) {
			p.y = lh;
		}

		// if we've gone past the exit, signal that it's
		// time to go to a new cave
		if (p.z <= 0) {
			EASY.hud.darken(EASY.hud.waitMsg);
			SOAR.schedule(function() {
				EASY.generate();
				EASY.hud.lighten();
			}, 1, false);
		}
		
		// don't allow player to go past the entrance
		if (p.z >= EASY.cave.LENGTH - 2) {
			p.z = EASY.cave.LENGTH - 2;
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
			case SOAR.KEY.SPACE:
				if (that.footPosition.y === EASY.cave.getFloorHeight(that.footPosition.x, that.footPosition.z))
					that.velocity.y += 5;
				break;
			case SOAR.KEY.SHIFT:
				that.sprint = true;
				break;
			case SOAR.KEY.Q:
				that.camera = that.overhead;
				break;
			case SOAR.KEY.ONE:
				that.attack("excuse");
				break;
			case SOAR.KEY.TWO:
				that.attack("appease");
				break;
			case SOAR.KEY.THREE:
				that.attack("flatter");
				break;
			case SOAR.KEY.FOUR:
				that.attack("blame");
				break;
			case SOAR.KEY.FIVE:
				that.attack("confuse");
				break;
				
// debugging keys -- remove in production release

			case SOAR.KEY.H:
				EASY.hideCave = !EASY.hideCave;
				break;
			case SOAR.KEY.T:
				EASY.generate();
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
			case SOAR.KEY.Q:
				that.camera = that.eyeview;
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

		if (that.camera === that.overhead)
			return;

		if (that.mouse.down) {
			dx = that.SPIN_RATE * (event.pageX - that.mouse.x);
			dy = that.SPIN_RATE * (event.pageY - that.mouse.y);
			that.camera.turn(-dx, -dy);
		}
		that.mouse.x = event.pageX;
		that.mouse.y = event.pageY;
		return false;
	},
	
	/**
		accept a trash object the player has picked up
		
		@method collect
		@param item the item of trash picked up
	**/
	
	collect: function(item) {
		var type = item.object;
		var num = item.number;
		EASY.hud.comment(this.COMMENTS.trash[type].pick());
		this.trash[type] = (this.trash[type] || 0) + num;
		if (type === "change") {
			EASY.hud.setPlayerMoney(this.trash[type]);
		}
	},

	/**
		attack the ghost if it's in earshot
		and player isn't still cooling down
		
		@method attack
		@param type string, attack type
	**/
	
	attack: function(type) {
	
		if (this.cooldown > 0) {
			EASY.hud.comment(this.COMMENTS.attack.notready.pick());
		} else if (this.footPosition.distance(EASY.ghost.position) > this.ATTACK_DISTANCE) {
			EASY.hud.comment(this.COMMENTS.attack.toofar.pick());
		} else {
			EASY.hud.comment(this.COMMENTS.attack[type].pick());
			EASY.ghost.weaken(type);
			this.cooldown = this.ATTACK_DELAY;
		}
	
	},
	
	/**
		handle damage caused by proximity to the ghost
		
		@method weaken
		@param damage number, subtract this from resolve
	**/
	
	weaken: function(damage) {
		this.resolve = Math.max(0, this.resolve - damage);
		EASY.hud.setPlayerResolve(this.resolve / this.MAX_RESOLVE);
		if (this.resolve === 0) {
			EASY.hud.log("You Flee The Caves In Terror", "warning");
			SOAR.running = false;
		}
	}
};

