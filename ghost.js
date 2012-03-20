/**
	generate and display a ghost
	
	@namespace EASY
	@class ghost
**/

EASY.ghost = {

	RADIUS: 0.5,
	ATTACK_DISTANCE: 5,
	
	WANDERING: 0,
	ATTACKING: 1,
	RESTING: 2,
	
	TRIBE: [ 
		"Boothrede", "Clanmorgan", "Cowlberth", "Monkshockey", "Throckton", "Treblerath" 
	],
	REASON: [ 
		"an Afflicted", "a Disgraced",  "a Disillusioned", "a Fanatical",  "an Introverted" 
	],
	TITLE: [
		"Monk", "Dogsbody", "Illusionist", "Deacon", "Squire", "Conjurer",
		"Priest", "Knight", "Enchanter", "Bishop", "Clanlord", "Mage", "Scholar"
	],
	STYLE: [ 
		"Shade", "Phantom", "Spectre", "Wraith", "Revenant" 
	],
	
	COMMENTS: {
	
		attack: {
		
			death: [
				"Blood. Blood. Blood. Blood? Blood."
			]
		}
	},				
	
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
		var cntx = EASY.texture.context;
		var w = EASY.texture.canvas.width;
		var h = EASY.texture.canvas.height;
		var that = this;

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-ghost"), SOAR.textOf("fs-ghost"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center", "time"],
			["noise"]
		);
		
		this.rng = SOAR.random.create();

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
		var x, y, z;

		// pick a nice flat space for the starting point
		// TODO: this will be changed
		x = EASY.cave.area[6].x;
		z = EASY.cave.area[6].y;
	
		this.position.set(x, EASY.cave.getFloorHeight(x, z) + 1, z);
		this.target.copy(this.position);
		
		// select title, trible, reason, and style of ghost
		title = this.TITLE.pick();
		tribe = this.TRIBE.pick();
		reason = this.REASON.pick();
		style = this.STYLE.pick();
		
		// generate an identity string
		this.identity = style + " of " + reason + " " + title + " of " + tribe;
		
		// generate ratings and susceptibility modifiers
		this.rating.speed = 2.5 + Math.floor(1.5 * Math.random());
		this.rating.effect = 5 + Math.floor(10 * Math.random());
		this.rating.resolve = 10 + Math.floor(20 * Math.random());
		this.rating.recovery = 0.1 + Math.random();
		
		this.rating.excuse = Math.floor(5 * Math.random());
		this.rating.appease = Math.floor(5 * Math.random());
		this.rating.flatter = Math.floor(5 * Math.random());
		this.rating.blame = Math.floor(5 * Math.random());
		this.rating.confuse = Math.floor(5 * Math.random());
		
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
		var hit, len;

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
					EASY.hud.log("Spotted By The " + this.identity, "warning");
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
				//EASY.player.weaken(dam * dt);
			} else if (len < 1.1 && !hit) {

				// reached target and can't see the player?
				// lost the bugger, so go back to wandering
				EASY.hud.log("The " + this.identity + " Has Broken Off", "success");
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
		handle damage caused by the word wall
		
		@method weaken
		@param attack string, the attack type
	**/
	
	weaken: function(attack) {
		// can only take damge when attacking
		if (this.motion === this.ATTACKING) {
			var damage = this.rating[attack];
			EASY.hud.log("The " + this.identity + " Weakened By " + damage);
			this.resolve = Math.max(0, this.resolve - damage);
			if (this.resolve === 0) {
				EASY.hud.log("The " + this.identity + " Has Been Rebuffed!");
				this.motion = this.WANDERING;
				EASY.hud.weaken(0);
			}
		}
	}

};

