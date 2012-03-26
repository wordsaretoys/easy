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
			
			coin: [
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

		},
		
		cremate: {
		
			notcalm: [
				"I have to calm the ghost down first."
			],
			
			notenough: [
				"I don't have what I need to do that."
			]
		}
		
	},

	headPosition: SOAR.vector.create(),
	footPosition: SOAR.vector.create(),
	velocity: SOAR.vector.create(),
	
	trash: {
		wood: 0,
		oil: 0,
		coin: 0
	},
	
	resolve: 0,
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
		this.eyeview.mapView = false;

		// create an overhead free camera for map viewing
		this.overhead = SOAR.camera.create(
			EASY.display,
			SOAR.camera.FREE_ROTATION);
		this.overhead.nearLimit = 1;
		this.overhead.farLimit = 500;
		this.overhead.position.set(
			EASY.cave.LENGTH * 0.5, 75, EASY.cave.LENGTH * 0.5);
		this.overhead.turn(SOAR.PIDIV2, 0, 0);
		this.overhead.mapView = true;
		
		// default camera to player view
		this.camera = this.eyeview;
	},
	
	/**
		(re)generate player position and state
		
		@method generate
	**/
	
	generate: function() {
		var x, z;
		// place the player at the cave entrance
		x = EASY.cave.area[0].x;
		z = EASY.cave.area[0].y;
		this.footPosition.set(x, EASY.cave.getFloorHeight(x, z), z);

		// reset state
		this.resolve = this.MAX_RESOLVE;
		EASY.hud.setReadout("resolve", this.resolve + "/" + this.MAX_RESOLVE);
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
		
		if (this.resolve < this.MAX_RESOLVE && EASY.ghost.mode !== EASY.ghost.ATTACKING) {
			this.resolve = Math.min(this.resolve + this.RECOVERY_RATE * dt, this.MAX_RESOLVE);
			EASY.hud.setReadout("resolve", Math.floor(this.resolve) +  "/" + this.MAX_RESOLVE);
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
				EASY.updating = false;
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
			case SOAR.KEY.R:
				EASY.corpse.cremate();
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
				EASY.updating = true;
				that.mouse.invalid = true;
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

		if (that.mouse.down && !that.camera.mapView && !that.mouse.invalid) {
			dx = that.SPIN_RATE * (event.pageX - that.mouse.x);
			dy = that.SPIN_RATE * (event.pageY - that.mouse.y);
			that.camera.turn(-dx, -dy);
		}
		that.mouse.x = event.pageX;
		that.mouse.y = event.pageY;
		that.mouse.invalid = false;
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
		EASY.hud.setReadout(type, this.trash[type]);
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
		EASY.hud.setReadout("resolve", Math.floor(this.resolve) + "/" + this.MAX_RESOLVE);
		if (this.resolve === 0) {
			// TODO: add credit sequence?
			SOAR.running = false;
		}
	},
	
	/**
		attempt a cremation
		
		@method cremate
	**/
	
	cremate: function() {
		var player = EASY.player
		var corpse = EASY.corpse;
		var ghost = EASY.ghost;
		var hud = EASY.hud;
	
		// check that the ghost is calmed down
		if (ghost.mode !== ghost.BECALMED) {
			hud.comment(player.COMMENTS.cremate.notcalm.pick());
			return;
		}
		
		// check that player can build pyre
		if (player.trash.wood < corpse.wood ||
		player.trash.oil < corpse.oil ||
		player.trash.coin <corpse.coin) {
			hud.comment(player.COMMENTS.cremate.notenough.pick());
			return;
		}
		
		// go ahead and burn it, deducting materials for pyre
		player.trash.wood -= corpse.wood;
		hud.setReadout("wood", player.trash.wood);
		player.trash.oil -= corpse.oil;
		hud.setReadout("oil", player.trash.oil);
		player.trash.coin -= corpse.coin;
		hud.setReadout("coin", player.trash.coin);
		
		corpse.cremate();
	}

};

