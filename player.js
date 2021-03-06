/**
	maintain player state and camera, handle control 
	events related to player motion and interactions
	
	@namespace EASY
	@class player
**/

EASY.player = {

	SPIN_RATE: 0.007,

	NORMAL_SPEED: 4,
	SPRINT_SPEED: 10,

	HEIGHT: 1.5,

	SYMPATHY_LOSS: 0.3,

	COMMENTS: {
	
		trash: {
		
			wood: [
				"Easy's not the most patient man when it comes to treasure.",
				"Looks like <em>someone</em> forgot to bring his lockpicks again.",
				"Another wooden box that'll never again mock a stupid adventurer.",
				"Who needs skill and craft when you've got a short temper?",
				"Poor little treasure chest. Must have set him off somehow.",
				"It's amazing what a massive iron battleaxe will do to rotten wood.",
				"Someday, I'll find a chest Easy hasn't smashed to bits.",
				"Easy failed Lockpicking 101, but he found a way to deal with it.",
				"Ancient locksmiths put all their ingenuity into this pile of splinters.",
				"When the only tool you have is an axe, every problem ends up in pieces."
			],
			
			oil: [
				"Another sample of Easy's extra smoky lamp oil.",
				"Guess who can't figure out a simple light spell?",
				"Whoops. Almost slipped in that.",
				"The great adventurers swear by Leakey Oil Lamps."
			],
			
			coin: [
				"A few moldy pennies make the terror worthwhile.",
				"Nice of him to leave me a pittance.",
				"Hey, look what rolled out of Easy's pocket.",
				"That's almost a million gold. Very, very almost.",
				"I've nearly saved enough for a new bootlace.",
				"I see that Sir has left his usual 0.01% gratuity.",
				"Coins. Why didn't the old kings hoard land deeds?"				
			]
		},
		
		attack: {
		
			excuse: [
				"You can't expect good behavior from a treasure-seeker.",
				"Shadowy ruins? Poor lighting? Accidents happen.",
				"These spooky passages would make anyone axe-happy.",
				"Once Easy smells gold, he's no longer in control.",
				"Easy has an expensive lifestyle to maintain.",
				"Easy was in full compliance with his personal Code of Conduct.",
				"Easy was merely upholding the standards of his profession.",
				"You can't blame a man for not knowing how to love."
			],
			
			appease: [
				"I can see you have valid complaints.",
				"You have good reason to be annoyed.",
				"I accept that being killed wasn't in your best interest.",
				"Naturally you weren't expecting a major life change today.",
				"Of <em>course</em> I'd be upset in your position.",
				"I concede that the system failed you in this instance.",
				"I understand you're going through a difficult transition.",
				"Your needs weren't fully anticipated by our organization."
			],
			
			flatter: [
				"You look good in ectoplasm.",
				"<em>Un</em>dead? Now there's a can-do attitude.",
				"Ghostliness is next to godliness.",
				"Even a gory death couldn't slow you down.",
				"It takes a lot of courage to start over.",
				"You make a windy, echoing moan sound good.",
				"Poise and dignity. Poise&mdash;and <em>dignity</em>.",
				"What excellent taste in apparitions.",
				"You've made me see death in a whole new light."
			],
			
			notready: [
				"...wait, it'll come to me...",
				"...I had a good one, hold on...",
				"...my mind's a blank right now...",
				"...oh look, rocks...",
				"...uh, okay, maybe not...",
				"...hang on, hang on...",
				"...got this song in my head...",
				"...er, just a second..."
			],
			
			notarget: [
				"What, am I talking to <em>myself</em> now?",
				"Why? No one can hear me.",
				"Nothing to say and no one to say it to.",
				"Nobody's listening."
			]
		},
		
		cremate: {
		
			notcalm: [
				"I have to deal with the ghost first.",
				"See that angry ghost? One thing at a time."
			],
			
			nowood: [
				"I don't have enough wood for kindling.",
				"Blood-soaked cloth doesn't burn well. I need more wood."
			],
			
			nooil: [
				"I don't have enough oil for the anointing.",
				"Got to grease that corpse up first. I need more oil."
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

	delay: 0,
	
	maxWill: 10,
	
	will: 0,
	luck: 0.5,
	
	sympathy: {

		snark: 0,
		scare: 0,
		shame: 0,
		
		normalize: function() {
			var mag = this.snark + this.scare + this.shame;
			this.snark = this.snark / mag;
			this.scare = this.scare / mag;
			this.shame = this.shame / mag;
		}
			
	},
	
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
		velocity: SOAR.vector.create(),
		matrix: new Float32Array(16)
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
		var that = this;
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
		this.eyeview = SOAR.camera.create(EASY.display);
		this.eyeview.nearLimit = 0.01;
		this.eyeview.farLimit = 100;
		this.eyeview.free = false;
		this.eyeview.bound.set(Math.sqrt(2) / 2, -1, 0);
		this.eyeview.mapView = false;

		// create an overhead free camera for map viewing
		this.overhead = SOAR.camera.create(EASY.display);
		this.overhead.nearLimit = 1;
		this.overhead.farLimit = 500;
		this.overhead.position.set(
			EASY.cave.LENGTH * 0.5, 75, EASY.cave.LENGTH * 0.5);
		this.overhead.turn(SOAR.PIDIV2, 0, 0);
		this.overhead.mapView = true;
		
		// default camera to player view
		this.camera = this.eyeview;
		
		// set initial sympathies
		this.sympathy.shame = Math.random();
		this.sympathy.scare = Math.random();
		this.sympathy.snark = Math.random();
		this.sympathy.normalize();
		
		// create a shader for the map pointer
		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-item"), SOAR.textOf("fs-item"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center"],
			["sign"]
		);
		
		// and a mesh
		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		SOAR.subdivide(0, -0.5, -0.5, 0.5, 0.5, 
			function(x0, y0, x1, y1, x2, y2) {
				that.mesh.set(x0, 0, y0, x0 + 0.5, y0 + 0.5);
				that.mesh.set(x1, 0, y1, x1 + 0.5, y1 + 0.5);
				that.mesh.set(x2, 0, y2, x2 + 0.5, y2 + 0.5);
			}
		);
		this.mesh.build();
		
		// and the image itself
		(function() {
			var cntx = EASY.texture.context;
			var w = EASY.texture.canvas.width;
			var h = EASY.texture.canvas.height;
			cntx.clearRect(0, 0, w, h);
			cntx.fillStyle = "rgb(255, 255, 255)"
			cntx.strokeStyle = "rgb(0, 0, 0)";
			cntx.lineWidth = 3;
			cntx.beginPath();
			cntx.moveTo(w / 2, h);
			cntx.lineTo(0, 0);
			cntx.lineTo(w / 2, h / 4);
			cntx.lineTo(w, 0);
			cntx.lineTo(w / 2, h);
			cntx.fill();
			cntx.stroke();
			that.texture = 
				SOAR.texture.create(EASY.display, cntx.getImageData(0, 0, w, h));
		})();
		
		// create a scheduled function that maintains player will
		// if player is not arguing, restore will by 1 point/sec
		SOAR.schedule(function() {
			if (that.will < that.maxWill && EASY.ghost.mode !== EASY.ghost.ATTACKING) {
				that.will++;
				EASY.hud.setWill(that.will, that.maxWill);
			}
		}, 1000, true);

	},
	
	/**
		(re)generate player position and state
		
		@method generate
	**/
	
	generate: function() {
		var x, z;
		// place the player at the cave entrance
		x = EASY.cave.area[0].x;
		z = EASY.cave.LENGTH - 2;
		this.footPosition.set(x, EASY.cave.getFloorHeight(x, z), z);
		
		// align eyeview camera to z-axis
		this.eyeview.component.y.set(0, 0, 0, 1);
		this.eyeview.make();

		// reset state
		this.will = this.maxWill;
		EASY.hud.setWill(this.will, this.maxWill);
		EASY.hud.setLuck(this.luck);
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

		// nextMap triggered in exitCave
		// we handle it here to yield to UI
		if (this.nextMap) {
			EASY.generate();
			EASY.hud.lighten();
			delete this.nextMap;
		}
		
		scratch.direction.set();
		if (motion.movefore) {
			scratch.direction.add(camera.front);
		}
		if (motion.moveback) {
			scratch.direction.sub(camera.front);
		}
		if (motion.moveleft) {
			scratch.direction.sub(camera.right);
		}
		if (motion.moveright) {
			scratch.direction.add(camera.right);
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
		
		if (this.delay > 0) {
			this.delay = Math.max(0, this.delay - dt);
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
			this.exitCave();
		}
		
		// don't allow player to go past the entrance
		if (p.z > EASY.cave.LENGTH - 2) {
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
		
		if (EASY.hud.starting) {
			return true;
		}
		
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
		}
		return true;
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

		if (EASY.hud.starting) {
			return true;
		}
		
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
		return true;
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

		if (that.mouse.down && !that.camera.mapView && SOAR.running && !that.mouse.invalid) {
			dx = that.SPIN_RATE * (event.pageX - that.mouse.x);
			dy = that.SPIN_RATE * (event.pageY - that.mouse.y);
			that.camera.turn(dy, dx, 0);
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
		var ghost = EASY.ghost;
		// display comment if not in combat and it's not the last map
		if (ghost.mode !== ghost.ATTACKING && !EASY.isTheEnd()) {
			EASY.hud.comment(this.COMMENTS.trash[type].pick(), "player");
		}
		this.trash[type] = (this.trash[type] || 0) + num;
		EASY.hud.setCollection(type, this.trash[type]);
	},

	/**
		attempt an attack on the ghost
	
		@method attack
		@param type string, attack type
	**/

	attack: function(type) {
		var result;
		if (EASY.isTheEnd()) {
			//EASY.hud.comment("What can I say?", "player");
		} else if (EASY.ghost.mode !== EASY.ghost.ATTACKING) {
			EASY.hud.comment(this.COMMENTS.attack.notarget.pick(), "player");
		} else if (this.delay > 0) {
			EASY.hud.comment(this.COMMENTS.attack.notready.pick(), "player");
		} else {
			EASY.hud.comment(this.COMMENTS.attack[type].pick(), "player");
			result = EASY.ghost.defend(type);
			// if the ghost fails to defend against the attack
			if (!result) {
				// if we've calmed the ghost down
				if (EASY.ghost.mode === EASY.ghost.BECALMED) {
				
					// gain a point of will
					this.maxWill++;
					this.will = this.maxWill;
					EASY.hud.setWill(this.will, this.maxWill);
					
				}
			} else {
				// reset delay as we're staggered
				this.delay = 1 + Math.random();
			}
		}
	},
	
	/**
		handle an attack from the ghost
		
		determine if the attack succeeded
		and how much it weakened will
		
		@method defend
		@param attack string, the attack type
		@return true if player defended attack (i.e., attack *failed*)
	**/
	
	defend: function(attack) {
		var sympathy = this.sympathy[attack];
		var damage;
		
		// saving throw against attack
		if (this.luck * Math.random() < sympathy) {
			// defense failed, calculate damage
			damage = Math.ceil(sympathy * EASY.ghost.will);
			this.will = Math.max(0, this.will - damage);
			EASY.hud.setWill(this.will, this.maxWill);
			// if we're out of will, must concede to ghost
			if (this.will === 0) {
				EASY.ghost.concede();
			}
			// sympathy to arguments decreases with success
			this.sympathy[attack] = sympathy * (1 - this.SYMPATHY_LOSS);
			// other arguments become more sympathetic
			this.sympathy.normalize();
			return false;
		} else {
			return true;
		}
	},
	
	/**
		attempt a cremation

		@method cremate
	**/
	
	cremate: function() {
		var corpse = EASY.corpse;
		var ghost = EASY.ghost;
		var hud = EASY.hud;
		var nl;
	
		// check that the ghost is not attacking
		if (ghost.mode === ghost.ATTACKING) {
			hud.comment(this.COMMENTS.cremate.notcalm.pick(), "player");
			return;
		}
		
		// check that player has sufficient materials
		if (this.trash.wood < corpse.wood) {
			hud.comment(this.COMMENTS.cremate.nowood.pick(), "player");
			return;
		}
		if (this.trash.oil < corpse.oil) {
			hud.comment(this.COMMENTS.cremate.nooil.pick(), "player");
			return;
		}
		
		// go ahead and burn it, deducting materials for pyre
		this.trash.wood -= corpse.wood;
		hud.setCollection("wood", this.trash.wood);
		this.trash.oil -= corpse.oil;
		hud.setCollection("oil", this.trash.oil);
		
		corpse.cremate();
		
		// reward the player with a little luck
		if (!EASY.isTheEnd()) {
			this.luck = this.luck + 0.01;
			hud.setLuck(this.luck);
		}
	},
	
	/**
		handle player exit from the cave
		
		called when player steps out of the cave exit
		
		@method exitCave
	**/
	
	exitCave: function() {
		// have we reached the end?
		if (EASY.isTheEnd()) {
			EASY.end();
		} else {
			// throw up a wait screen
			EASY.hud.darken();
			// on the next animation frame, generate a new map
			this.nextMap = true;
		}
	},
	
	/**
		draw the player pointer
		
		only call this in map mode!
		
		@method draw
	**/
	 
	draw: function() {
		var gl = EASY.display.gl;
		var shader = this.shader;
		var center, eye;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, this.camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, this.camera.modelview());

		// the yaw.w negation implements a cheeky matrix transpose!
		eye = this.eyeview;
		eye.component.y.w = -eye.component.y.w;
		eye.component.y.toMatrix(this.scratch.matrix);
		eye.component.y.w = -eye.component.y.w;
		gl.uniformMatrix4fv(shader.rotations, false, this.scratch.matrix);
		
		center = this.headPosition;
		gl.uniform3f(shader.center, center.x, center.y, center.z);
		this.texture.bind(0, shader.sign);
		this.mesh.draw();
		
		gl.disable(gl.BLEND);
	}
	

};
