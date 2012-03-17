/**
	generate and display a ghost
	
	@namespace EASY
	@class ghost
**/

EASY.ghost = {

	RADIUS: 0.5,
	
	WANDERING: 0,
	ATTACKING: 1,
	RESTING: 2,
	
	rating: {
		excuse: 0,
		appease: 0,
		flatter: 0,
		blame: 0,
		confuse: 0,
		speed: 0,
		effect: 0,
		resolve: 0,
		recovery: 0
	},
	
	motion: 0,
	resolve: 0,
	
	identity: "",

	position: SOAR.vector.create(),
	velocity: SOAR.vector.create(),

	rotor: SOAR.freeRotor.create(),
	target: SOAR.vector.create(),

	scratch: {
		pos: SOAR.vector.create(),
		dir: SOAR.vector.create()
	},
	
	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var cntx = EASY.texture.context;
		var w = EASY.texture.canvas.width;
		var h = EASY.texture.canvas.height;
		var that = this;

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-trash"), SOAR.textOf("fs-trash"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center"],
			["sign"]
		);
		
		this.rng = SOAR.random.create();

		cntx.font = "48pt Arial";
		cntx.textAlign = "center";
		cntx.textBaseline = "middle";
		cntx.strokeStyle = "rgba(255, 255, 255, 1)";
		cntx.fillStyle = "rgba(255, 255, 255, 1)";
		cntx.lineWidth = 3;

		cntx.clearRect(0, 0, w, h);
		cntx.beginPath();
		cntx.arc(w / 2, h / 2, 127, 0, SOAR.PIMUL2, false);
		cntx.stroke();
		cntx.fillText("ghost", w / 2, h / 2);

		this.mesh = SOAR.mesh.create(EASY.display);
		this.sign = SOAR.texture.create(EASY.display, cntx.getImageData(0, 0, w, h));
			
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		
		SOAR.subdivide(0, -0.5, -0.5, 0.5, 0.5, 
			function(x0, y0, x1, y1, x2, y2) {
				that.mesh.set(x0, y0, 0, x0 + 0.5, y0 + 0.5);
				that.mesh.set(x1, y1, 0, x1 + 0.5, y1 + 0.5);
				that.mesh.set(x2, y2, 0, x2 + 0.5, y2 + 0.5);
			}
		);
		
		this.mesh.build();
			
	},
	
	/**
		(re)generate ghost position and identity
		
		@method generate
	**/
	
	generate: function() {
		var l = EASY.cave.LENGTH;
		var title, tribe, reason, level;
		var x, y, z;

		// pick a nice flat space for the starting point
		// TODO: this will be moved to the corpse object
		do {
			x = this.rng.getn(l);
			z = this.rng.getn(l);
		} while(!EASY.cave.isFlat(x, z, this.RADIUS));
	
		this.position.set(x, EASY.cave.getFloorHeight(x, z) + 1, z);
		this.target.copy(this.position);
		
		// select title, trible, reason, and level for ghost
		title = EASY.lookup.select("title");
		tribe = EASY.lookup.select("tribe");
		reason = EASY.lookup.select("reason");
		level = EASY.lookup.select("ghost", EASY.player.level);
		
		// generate an identity string
		this.identity = level.text + " of " + reason.text + " " + title + " of " + tribe.text;
		
		// reset ratings and susceptibility modifiers
		this.rating.speed = level.speed + reason.speed + tribe.speed;
		this.rating.effect = level.effect + reason.effect + tribe.effect;
		this.rating.resolve = level.resolve + reason.resolve + tribe.resolve;
		this.rating.recovery = level.recovery + reason.recovery + tribe.recovery;
		
		this.rating.excuse = 1 + reason.excuse + tribe.excuse;
		this.rating.appease = 1 + reason.appease + tribe.appease;
		this.rating.flatter = 1 + reason.flatter + tribe.flatter;
		this.rating.blame = 1 + reason.blame + tribe.blame;
		this.rating.confuse = 1 + reason.confuse + tribe.confuse;
		
		// reset state
		this.motion = this.WANDERING;
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
		var hit, dam;

		this.rotor.turn(0, 0.05, 0);
		
		switch(this.motion) {
		
		case this.WANDERING:

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
					EASY.hud.addMessage("Spotted By The " + this.identity, "warning");
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
		
			// update target position if visible--remember,
			// target is LAST KNOWN GOOD position of player
			hit = this.lookFor(pp, this.RADIUS);
			if (hit) {
				this.target.copy(pp);
			}
			
			// weaken the player if inside area of effect
			dam = SOAR.clamp(
				(this.rating.effect - pp.distance(this.position)) / this.rating.effect,
				0, 1 
			) * dt;
			if (dam > 0) {
				EASY.player.weaken(dam);
			}
		
			// if we haven't reached the target
			// ( 1.1 instead of 1.0 because sometimes length === 1.00001... )
			dir.copy(this.target).sub(this.position);
			if (dir.length() > 1.1) {
			
				// fix velocity to point to target
				dir.norm();
				this.velocity.x = this.rating.speed * dir.x;
				this.velocity.z = this.rating.speed * dir.z;
				
			} else {
			
				// reached the player's last spot and nothing's there?
				// go back to wandering
				if (!hit) {
					EASY.hud.addMessage("The " + this.identity + " Has Broken Off", "success");
					this.motion = this.WANDERING;
				}
				
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
		gl.uniformMatrix4fv(shader.rotations, false, this.rotor.matrix.transpose);

		gl.uniform3f(shader.center, this.position.x, this.position.y, this.position.z);

		this.sign.bind(0, shader.sign);
		this.mesh.draw();
		
		gl.disable(gl.BLEND);
		
	},
	
	/**
		handle damage caused by the word wall
		
		@method weaken
		@param attack string, the attack type
	**/
	
	weaken: function(attack) {
		var damage = this.rating[attack];
		EASY.hud.addMessage("The " + this.identity + " Weakened By " + damage);
		this.resolve = Math.max(0, this.resolve - damage);
		if (this.resolve === 0) {
			EASY.hud.addMessage("The " + this.identity + " Has Been Rebuffed!");
			this.motion = this.WANDERING;
		}
	}

};

