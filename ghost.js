/**
	generate and display a ghost
	
	@namespace EASY
	@class ghost
**/

EASY.ghost = {

	RADIUS: 0.5,
	BUFFER_ZONE: 4,
	ATTACK_DELAY: 2,
	
	DORMANT: 0,
	ATTACKING: 1,
	BECALMED: 2,
	
	COMMENTS: {
	
		attack: {
		
			death: [
				"Blood. Blood. Blood. Blood? Blood."
			]
		},
		
		awaken: [
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
		
		calmed: [
			"The weight is gone. Perhaps I can move on now."
		],
		
		fled: [
			"Gone. How disappointing."
		]
			
	},				
	
	rating: {
		excuse: 0,
		appease: 0,
		flatter: 0,
		blame: 0,
		confuse: 0
	},
	
	mode: 0,
	resolve: 0,
	cooldown: 0,
	alpha: 0,
	
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

		// generate attributes
		this.rating.excuse = Math.floor(5 * Math.random());
		this.rating.appease = Math.floor(5 * Math.random());
		this.rating.flatter = Math.floor(5 * Math.random());
		this.rating.blame = Math.floor(5 * Math.random());
		this.rating.confuse = Math.floor(5 * Math.random());

		this.speed = 2.5 + Math.floor(1.5 * Math.random());
		this.resolve = 10 + Math.floor(20 * Math.random());
		
		this.velocity.set();

		// start in dormant state
		this.suspend();
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
		make the ghost dormant and transparent
		and send it back to its body
		
		@method suspend
	**/
	
	suspend: function() {
		this.position.copy(EASY.corpse.position).y = 1;
		this.alpha = 0;
		this.mode = this.DORMANT;
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
				EASY.hud.comment(this.COMMENTS.awaken.pick(), "ghosty");
				this.target.copy(pp);
				this.mode = this.ATTACKING;
			}
		
			break;
			
		case this.ATTACKING:
		
			// fade the ghost in if not visible
			if (this.alpha < 1) {
				this.alpha = Math.min(1, this.alpha + 0.01);
			}

			// attack if we're not cooling down
			if (this.cooldown > 0) {
				this.cooldown = Math.max(0, this.cooldown - dt);
			} else {
				EASY.hud.comment(this.COMMENTS.attack.death.pick(), "ghosty");
				EASY.player.weaken(1);
				this.cooldown = this.ATTACK_DELAY + Math.random();
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
				this.velocity.x = this.speed * dir.x;
				this.velocity.z = this.speed * dir.z;
				
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
				EASY.hud.comment(this.COMMENTS.fled.pick(), "ghosty");
				this.suspend();
			}

			break;
			
		case this.BECALMED:

			// fade the ghost out
			if (this.alpha > 0) {
				this.alpha = Math.max(0, this.alpha - 0.01);
			}
			
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

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		gl.uniformMatrix4fv(shader.rotations, false, camera.transpose());

		gl.uniform3f(shader.center, this.position.x, this.position.y, this.position.z);
		gl.uniform1f(shader.time, SOAR.elapsedTime);
		gl.uniform1f(shader.alpha, this.alpha);

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
		if (this.mode === this.ATTACKING) {
			var damage = this.rating[attack];
			EASY.hud.comment(this.COMMENTS.damage[damage].pick(), "ghosty");
			this.resolve = Math.max(0, this.resolve - damage);
			// if we run out of resolve
			if (this.resolve === 0) {
				// ghost is calmed down
				EASY.hud.comment(this.COMMENTS.calmed.pick(), "ghosty");
				this.mode = this.BECALMED;
			}
		}
	}

};

