/**
	generate and display a ghost
	
	@namespace EASY
	@class ghost
**/

EASY.ghost = {

	SPEED: 2.5,
	RADIUS: 0.5,
	BUFFER_ZONE: 4,
	SYMPATHY_LOSS: 0.4,
	
	DORMANT: 0,
	ATTACKING: 1,
	BECALMED: 2,
	ISEASY: 3,
	
	COMMENTS: {
	
		attack: {
			
			scare: [
				"What's that behind you? Oh, it's probably nothing.",
				"Strange, how the walls seem to close in on you.",
				"Words will not save you from what waits ahead.",
				"I am not the only horror that prowls these ruins.",
				"Not all shadows are merely the absence of light."
			],
			
			snark: [
				"Do you enjoy working for a bloody-minded loon?",
				"Some jobs even village idiots wouldn't do. You certainly showed them.",
				"Whatever he's paying you, you're not worth it.",
				"Perhaps you should have paid better attention in school."
			],
			
			shame: [
				"I did nothing to provoke your master.",
				"I meant no one any harm.",
				"I died for no good reason.",
				"I was struck down before I could utter a word."
				
			],
			
			calmed: [
				"My soul rests. Not easily, but it will do.",
				"Against my better judgement, I concede.",
				"Fair enough.",
				"I can argue no longer. Beaten again, it seems.",
				"I yield. May your victory bring you joy."
			],
			
			disgust: [
				"I want nothing more to do with you.",
				"Enough. You mean nothing to me.",
				"How insipid. Go away."
			]
			
		},
		
		awaken: [
			"I see you, flesh.",
			"Oh, look. After the lion, comes the mouse.",
			"Hello, meat. I was just counting my organs.",
			"Have you come to apologize? Too bad.",
			"The worms already?"
		],
		
		release: [
			"Farewell, o brave apologist.",
			"You have the soul of a weasel, but there is some small good in you.",
			"I pray I am as pleased to see the gods as they are to see me.",
			"May you also find the release you seek.",
			"I go to my reward. You must go to yours.",
			"My spirit ascends. Yours remains. Beware."
		],
		
		alone: [
			"Gone. How disappointing.",
			"You reveal your true nature. I will pursue you no further.",
			"Flee, then. Run forever."
		]
			
	},

	sympathy: {

		excuse: 0,
		appease: 0,
		flatter: 0,
		
		normalize: function() {
			var mag = this.excuse + this.appease + this.flatter;
			this.excuse = this.excuse / mag;
			this.appease = this.appease / mag;
			this.flatter = this.flatter / mag;
		}
			
	},
	
	phase: 0,
	mode: 0,
	will: 0,
	alpha: 0,
	delay: 0,
	blink: 0,
	
	lastAttack: {
		type: "scare",
		fail: false
	},
	
	newAttack: {
		"scare": [ "snark", "shame" ],
		"snark": [ "scare", "shame" ],
		"shame": [ "scare", "snark" ]
	},
	
	position: SOAR.vector.create(),
	velocity: SOAR.vector.create(),

	target: SOAR.vector.create(),

	scratch: {
		pos: SOAR.vector.create(),
		dir: SOAR.vector.create()
	},
	
	texture: {},
	
	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var that = this;

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-ghost"), SOAR.textOf("fs-ghost"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center", "time", "alpha"],
			["noise"]
		);
		
		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		
		SOAR.subdivide(0, -0.5, -0.5, 0.5, 0.5, 
			function(x0, y0, x1, y1, x2, y2) {
				that.mesh.set(x0, y0, 0, x0, y0);
				that.mesh.set(x1, y1, 0, x1, y1);
				that.mesh.set(x2, y2, 0, x2, y2);
			}
		);
		
		this.mesh.build();
	},
	
	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		this.texture.noise = 
			SOAR.texture.create(EASY.display, EASY.resources["noise2"].data);
	},
	
	/**
		(re)generate ghost position and identity
		
		@method generate
	**/
	
	generate: function() {

		var base;
	
		// determine initial sympathies
		this.sympathy.excuse = Math.random();
		this.sympathy.appease = Math.random();
		this.sympathy.flatter = Math.random();
		this.sympathy.normalize();

		// set initial state
		this.delay = 1 + Math.random();
		this.will = Math.round(EASY.player.maxWill * 1.0);
		this.velocity.set();
		this.lastAttack.type = "scare";
		this.lastAttack.fail = false;

		// start in dormant state
		this.suspend();
		this.mode = this.DORMANT;
		
		// if this is the end
		// set up for player's choice
		if (EASY.isTheEnd()) {
			this.mode = this.ISEASY;
			this.alpha = 1;
			this.blink = Math.PI;
		}
	},
	
	/**
		determine if target is in ghost's line of sight
		
		@method lookFor
		@param target object, contains x, z coordinates
		@param size number, radial size of target
		@return boolean, true if target spotted
	**/
	
	lookFor: function(target, size) {
		var pos = this.scratch.pos;
		var dir = this.scratch.dir;
		var clear = true;

		pos.copy(this.position);
		dir.copy(target).sub(pos).norm().mul(size);
		while (clear && (Math.abs(pos.x - target.x) > size || Math.abs(pos.z - target.z) > size) ) {
			pos.add(dir);
			clear = EASY.cave.isOpen(pos.x, pos.z, size);
		}
		return clear;
	},
	
	/**
		make the ghost transparent
		and send it back to its body
		
		@method suspend
	**/
	
	suspend: function() {
		this.position.copy(EASY.corpse.position).y = 
			1 + EASY.cave.getFloorHeight(this.position.x, this.position.z);
		this.alpha = 0;
	},
	
	/**
		implement ghost AI, detection, and mode
		
		@method update
	**/
	
	update: function() {
		var pp = EASY.player.footPosition;
		var dir = this.scratch.dir;
		var dt = SOAR.interval * 0.001;
		var hit, len;

		switch(this.mode) {
		
		case this.DORMANT:
		
			// wait for the player to walk up
			if (pp.distance(this.position) < this.BUFFER_ZONE) {
				EASY.hud.comment(this.COMMENTS.awaken.pick(), "ghost");
				this.target.copy(pp);
				this.mode = this.ATTACKING;
			}
		
			break;
			
		case this.ATTACKING:
		
			// fade the ghost in if not visible
			if (this.alpha < 1) {
				this.alpha = Math.min(1, this.alpha + dt);
			}

			// count down the blink effect
			if (this.blink > 0) {
				this.blink = Math.max(0, this.blink - dt * 4);
			}
			
			// attack if we're not cooling down
			if (this.delay > 0) {
				this.delay = Math.max(0, this.delay - dt);
			} else {
				this.attack();
			}
			
			// look for the player
			hit = this.lookFor(pp, this.RADIUS);
			if (hit) {
				// update target position if visible--remember,
				// target is LAST KNOWN GOOD position of player
				this.target.copy(pp);
			} 
			
			// if ghost can't see player or is too far away
			len = dir.copy(this.target).sub(this.position).length();
			if (!hit || len > this.BUFFER_ZONE) {
				
				// fix velocity to point to target
				dir.norm();
				this.velocity.x = this.SPEED * dir.x;
				this.velocity.z = this.SPEED * dir.z;
				
				// generate a vector that points away from the walls
				// and adjust the ghost's velocity
				dir.set(
					EASY.cave.getFloorHeight(this.position.x - 1, this.position.z) - EASY.cave.getFloorHeight(this.position.x + 1, this.position.z),
					0, 
					EASY.cave.getFloorHeight(this.position.x, this.position.z - 1) - EASY.cave.getFloorHeight(this.position.x, this.position.z + 1)
				);
				this.velocity.add(dir);

				// update the ghost's position, maintaining distance from cave floor
				this.position.add(this.velocity.mul(dt));
				this.position.y = EASY.cave.getFloorHeight(this.position.x, this.position.z) + 1;

			} 
			
			// can't see the player even once you're on top of the target?
			if (!hit && len < 1.1) {
				// lost the bugger, so go back to dormancy
				EASY.hud.comment(this.COMMENTS.alone.pick(), "ghost");
				this.mode = this.DORMANT;
				this.suspend();
			}

			break;
			
		case this.BECALMED:

			// count down the blink effect
			if (this.blink > -SOAR.PIDIV2) {
				this.blink = Math.max(-SOAR.PIDIV2, this.blink - dt * 4);
			} else {
				this.alpha = 0;
			}
			
			break;
			
		case this.ISEASY:
		
			break;

		}
		
	},
	
	/**
		draw the ghost
		
		@method draw
	**/
	 
	draw: function() {
		var gl = EASY.display.gl;
		var shader = this.shader;
		var camera = EASY.player.camera;
		var bl;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		gl.uniformMatrix4fv(shader.rotations, false, camera.transpose());
		gl.uniform3f(shader.center, this.position.x, this.position.y, this.position.z);
		gl.uniform1f(shader.time, SOAR.elapsedTime);

		bl = 1 - Math.sin(this.blink) * Math.abs(Math.sin(8 * this.blink));
		gl.uniform1f(shader.alpha, this.alpha * bl);

		this.texture.noise.bind(0, shader.noise);
		this.mesh.draw();
		
		gl.disable(gl.BLEND);
		
	},
	
	/**
		attempt an attack on the player
		
		@method attack
	**/
	
	attack: function() {
		var result, attack, history;
		// repeat the last attack
		attack = this.lastAttack.type;
		history = this.lastAttack.fail;
		EASY.hud.comment(this.COMMENTS.attack[attack].pick(), "ghost");
		result = EASY.player.defend(attack);
		this.lastAttack.fail = result;
		// if player defended attack
		if (result) {
			// if this attack's failed twice in a row
			if (history) {
				// switch to another attack
				this.lastAttack.type = this.newAttack[attack].pick();
				// that hasn't failed yet
				this.lastAttack.fail = false;
			}
		}
		// set random delay for next attack
		this.delay = 1 + Math.random();
	},
	
	/**
		handle an attack from the player
		
		determine if the attack succeeded
		and how much it weakened will
		
		@method defend
		@param attack string, the attack type
		@return true if ghost defended attack (i.e., attack *failed*)
	**/
	
	defend: function(attack) {
		var sympathy = this.sympathy[attack];
		var damage;
		// saving throw against attack
		if ((1 - EASY.player.luck) * Math.random() < sympathy) {
			// failed the saving throw, calculate damage
			damage = Math.ceil(sympathy * EASY.player.will);
			this.will = Math.max(0, this.will - damage);
			// make the ghost blink in surprise
			this.blink = Math.PI;
			// if we run out of will
			if (this.will === 0) {
				// ghost is calmed down
				this.mode = this.BECALMED;
				this.suspend();
				EASY.hud.comment(this.COMMENTS.attack.calmed.pick(), "ghost");
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
		react to player's concession
		
		@method concede
	**/
	
	concede: function() {
		this.suspend();
		this.mode = this.BECALMED;
		EASY.hud.comment(this.COMMENTS.attack.disgust.pick(), "ghost");
	},
	
	/**
		react to cremation if calmed
		
		@method cremate
	**/
	
	cremate: function() {
		if (this.mode === this.BECALMED) {
			// one last blink and whisper
			this.alpha = 1;
			this.blink = SOAR.PIDIV2;
			EASY.hud.comment(this.COMMENTS.release.pick(), "ghost");
		}
		if (this.mode === this.ISEASY) {
			this.mode = this.BECALMED;
		}
	}
};

