/**
	generate and display a ghost
	
	@namespace EASY
	@class ghost
**/

EASY.ghost = {

	RADIUS: 0.5,
	BUFFER_ZONE: 4,
	MAX_DAMAGE: 5,
	SYMPATHY_LOSS: 0.4,
	
	GRACE_MULTIPLE: 1,
	DELAY_MULTIPLE: 2,
	SPEED_MULTIPLE: 2.5,
	RESOLVE_MULTIPLE: 10,
	
	DORMANT: 0,
	ATTACKING: 1,
	BECALMED: 2,
	
	COMMENTS: {
	
		attack: [
			"Blood. Blood. Blood. Blood? Blood."
		],
		
		awaken: [
			"I see you, flesh."
		],
		
		weaken: [
			"I can see your side of it.",
			"This line of argument may lead us somewhere.",
			"There are possibilities in what you say.",
			"I am forced by circumstances to agree.",
			"I can find no substantial quarrel with that."
		],
		
		ignore: [
				"No. Not a thing. Sorry.",
				"Were you talking to me?",
				"I can't be bothered to care."
		],
		
		calmed: [
			"The weight is gone. Perhaps I can move on now."
		],
		
		alone: [
			"Gone. How disappointing."
		]
			
	},				
	
	sympathy: {

		excuse: 0,
		appease: 0,
		flatter: 0,
		blame: 0,
		confuse: 0,
		
		normalize: function() {
			var mag = this.excuse + this.appease + 
				this.flatter + this.blame + this.confuse;
			this.excuse = this.excuse / mag;
			this.appease = this.appease / mag;
			this.flatter = this.flatter / mag;
			this.blame = this.blame / mag;
			this.confuse = this.confuse / mag;
		}
			
	},
	
	phase: 0,
	mode: 0,
	resolve: 0,
	cooldown: 0,
	alpha: 0,
	grace: 0,
	delay: 0,
	
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
		this.sympathy.blame = Math.random();
		this.sympathy.confuse = Math.random();
		this.sympathy.normalize();

		// requirements cycle quasi-periodically over time
		base = 1.5 + 0.5 * Math.cos(this.phase);
		
		this.speed = this.SPEED_MULTIPLE * base * (1 + Math.random());
		this.delay = this.DELAY_MULTIPLE * base * (1 + Math.random());
		this.resolve = Math.ceil(this.RESOLVE_MULTIPLE * base * (1 + Math.random()));
		this.grace = Math.ceil(this.GRACE_MULTIPLE * base * (1 + Math.random()));
		
		// next random phase
		this.phase += Math.random();
		
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
				this.alpha = Math.min(1, this.alpha + dt);
			}

			// attack if we're not cooling down
			if (this.cooldown > 0) {
				this.cooldown = Math.max(0, this.cooldown - dt);
			} else {
				EASY.hud.comment(this.COMMENTS.attack.pick(), "ghosty");
				EASY.player.weaken(1);
				this.cooldown = this.delay + Math.random();
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
				EASY.hud.comment(this.COMMENTS.alone.pick(), "ghosty");
				this.suspend();
			}

			break;
			
		case this.BECALMED:

			// fade the ghost out
			if (this.alpha > 0) {
				this.alpha = Math.max(0, this.alpha - dt);
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
		handle an attack from the player
		
		determine if the attack succeeded
		and how much it weakened resolve
		
		@method defend
		@param attack string, the attack type
		@return true if ghost defended attack (i.e., attack *failed*)
	**/
	
	defend: function(attack) {
		var sympathy = this.sympathy[attack];
		var damage;
		
		// saving throw against attack
		// biasing toward lower values
		if (Math.random() * Math.random() < sympathy) {
			EASY.hud.comment(this.COMMENTS.weaken.pick(), "ghosty");
			// damage is based on the idea that the most convincing
			// argument is the one not anticipated. thus, damage is
			// greater if an unexpected argument succeeds.
			damage = this.MAX_DAMAGE * (1 - sympathy);
			this.resolve = Math.max(0, this.resolve - damage);
			// if we run out of resolve
			if (this.resolve === 0) {
				// ghost is calmed down
				EASY.hud.comment(this.COMMENTS.calmed.pick(), "ghosty");
				this.mode = this.BECALMED;
			}
			// sympathy to arguments decreases with success
			this.sympathy[attack] = sympathy * (1 - this.SYMPATHY_LOSS);
			// other arguments become more sympathetic
			this.sympathy.normalize();
			return false;
		} else {
			EASY.hud.comment(this.COMMENTS.ignore.pick(), "ghosty");
			return true;
		}
	}

};

