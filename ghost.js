/**
	generate and display a ghost
	
	@namespace EASY
	@class ghost
**/

EASY.ghost = {

	RADIUS: 0.5,
	ATTACK_DISTANCE: 5,
	ATTACK_DELAY: 2,
	
	DORMANT: 0,
	ATTACKING: 1,
	BECALMED: 2,
	RESTING: 3,
	
	COMMENTS: {
	
		attack: {
		
			death: [
				"Blood. Blood. Blood. Blood? Blood."
			]
		},
		
		spotted: [
			"I see you, flesh."
		],
		
		damage: [
			[
				"No. Not a thing. Sorry.",
				"Were you talking to me?",
				"I can't be bothered to care."
			],
			[
				"You make a very small point.",
				"There is something to that. <em>What</em>, I have no idea.",
				"I will not argue semantics."
			],
			[
				"I can see your side of it.",
				"This line of argument may lead us somewhere.",
				"There are possibilities in what you say."
			],
			[
				"I am forced by circumstances to agree.",
				"I can find no substantial quarrel with that.",
				"There is little left to debate, then."
			],
			[
				"I've never heard such a concise argument.",
				"I have no disagreement worth uttering.",
				"Astonishing, and I must agree."
			]
		],
		
		rebuff: [
			"I must consider this further."
		],
		
		travel: [
			"I have my own troubles. Begone."
		],
		
		fled: [
			"Gone. I feel oddly disappointed."
		]
			
	},				
	
	rating: {
		excuse: 0,
		appease: 0,
		flatter: 0,
		blame: 0,
		confuse: 0,
		speed: 0,
		resolve: 0,
		recovery: 0
	},
	
	motion: 0,
	resolve: 0,
	cooldown: 0,
	
	identity: "",

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
			["projector", "modelview", "rotations", "center", "time"],
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
		var l = EASY.cave.LENGTH;
		var title, tribe, reason, level;
		var p = EASY.corpse.position;

		// start the ghost just above the corpse 
		this.position.set(p.x, 1, p.z);
		this.target.copy(this.position);
		
		// generate ratings and susceptibility modifiers
		this.rating.speed = 2.5 + Math.floor(1.5 * Math.random());
		this.rating.resolve = 10 + Math.floor(20 * Math.random());
		this.rating.recovery = 0.1 + Math.random();
		
		this.rating.excuse = Math.floor(5 * Math.random());
		this.rating.appease = Math.floor(5 * Math.random());
		this.rating.flatter = Math.floor(5 * Math.random());
		this.rating.blame = Math.floor(5 * Math.random());
		this.rating.confuse = Math.floor(5 * Math.random());
		
		// reset state
		this.motion = this.DORMANT;
		this.resolve = this.rating.resolve;
		this.velocity.set();
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
		implement ghost AI, detection, and motion
		
		@method update
	**/
	
	update: function() {
		var pp = EASY.player.footPosition;
		var dir = this.scratch.dir;
		var dt = SOAR.interval * 0.001;
		var hit, len;

		switch(this.motion) {
		
		case this.DORMANT:
		
			// look for the player, and attack if spotted
			if (this.lookFor(pp, this.RADIUS)) {
				EASY.hud.comment(this.COMMENTS.spotted.pick(), "ghosty");
				this.target.copy(pp);
				this.motion = this.ATTACKING;
			}
		
			break;
		
		case this.BECALMED:

			// accumlate random error into the velocity over time
			dir.copy(this.velocity);
			dir.x += (Math.random() - Math.random()) * dt * 0.001;
			dir.z += (Math.random() - Math.random()) * dt * 0.001;
			dir.norm();
			this.velocity.copy(dir).mul(this.rating.speed);
			
			// if resolve is maxed out
			if (this.resolve === this.rating.resolve) {
			
				// look for the player, and attack if spotted
				if (this.lookFor(pp, this.RADIUS)) {
					EASY.hud.comment(this.COMMENTS.spotted.pick(), "ghosty");
					this.target.copy(pp);
					this.motion = this.ATTACKING;
				}
			
			} else {
			
				// otherwise, rebuild resolve
				this.resolve = Math.min(
					this.rating.resolve, 
					this.resolve + this.rating.recovery * dt
				);
				
			}
		
			break;
			
		case this.ATTACKING:
		
			hit = this.lookFor(pp, this.RADIUS);
			if (hit) {
				// update target position if visible--remember,
				// target is LAST KNOWN GOOD position of player
				this.target.copy(pp);
			}
			len = dir.copy(this.target).sub(this.position).length();
			
			if (len < this.ATTACK_DISTANCE && hit) {
				// we're within earshot and can see the player
				// don't move, attack if possible
				if (this.cooldown > 0) {
					this.cooldown = Math.max(0, this.cooldown - dt);
				} else {
					EASY.hud.comment(this.COMMENTS.attack.death.pick(), "ghosty");
					EASY.player.weaken(1);
					this.cooldown = this.ATTACK_DELAY + Math.random();
				}
			} else if (len < 1.1 && !hit) {

				// reached target and can't see the player?
				// lost the bugger, so go back to wandering
				EASY.hud.comment(this.COMMENTS.fled.pick(), "ghosty");
				this.motion = this.WANDERING;
			
			} else {

				// fix velocity to point to target
				dir.norm();
				this.velocity.x = this.rating.speed * dir.x;
				this.velocity.z = this.rating.speed * dir.z;
				
			}

			break;
			
		case this.RESTING:
		
			break;
			
		}
		
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
	},
	
	/**
		draw the ghost
		
		@method draw
	**/
	 
	draw: function() {
		var gl = EASY.display.gl;
		var shader = this.shader;
		var camera = EASY.player.camera;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		gl.uniformMatrix4fv(shader.rotations, false, camera.transpose());

		gl.uniform3f(shader.center, this.position.x, this.position.y, this.position.z);
		gl.uniform1f(shader.time, SOAR.elapsedTime);

		this.texture.noise.bind(0, shader.noise);
		this.mesh.draw();
		
		gl.disable(gl.BLEND);
		
	},
	
	/**
		handle weakening of resolve
		
		@method weaken
		@param attack string, the attack type
	**/
	
	weaken: function(attack) {
		// can only take damge when attacking
		if (this.motion === this.ATTACKING) {
			var damage = this.rating[attack];
			EASY.hud.comment(this.COMMENTS.damage[damage].pick(), "ghosty");
			this.resolve = Math.max(0, this.resolve - damage);
			if (this.resolve === 0) {
				EASY.hud.comment(this.COMMENTS.rebuff.pick(), "ghosty");
				this.motion = this.BECALMED;
			}
		} else {
			EASY.hud.comment(this.COMMENTS.travel.pick(), "ghosty");
		}
	}

};

