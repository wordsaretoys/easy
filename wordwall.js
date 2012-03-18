/**
	generate and animate the wall of words, 
	the player's only weapon against ghosts
	
	@namespace EASY
	@class wordwall
**/

EASY.wordwall = {

	MAX_RADIUS: 15,
	EXPAND_RATE: 2,
	
	active: false,
	radius: 0,
	attack: "",
	damage: false,

	/**
		initialize shaders and persistent objects
		
		@method init
	**/

	init: function() {
		var that = this;
		
		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-wordwall"), SOAR.textOf("fs-wordwall"),
			["position", "texturec"], 
			["projector", "rotations", "radius", "height"],
			["noise"]
		);
		
		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);

		SOAR.subdivide(5, -0.5, 0, 0.5, 
			(EASY.cave.WALL_HEIGHT - EASY.cave.SEPARATION) * 2, 
			function(x0, y0, x1, y1, x2, y2) {
				var z0, z1, z2;
				var tx0, tx1, tx2;
				var ty0, ty1, ty2;
				var a0, a1, a2;
			
				tx0 = x0 + 0.5;
				tx1 = x1 + 0.5;
				tx2 = x2 + 0.5;
				ty0 = y0;
				ty1 = y1;
				ty2 = y2;
				
				a0 = (x0 + 0.5) * Math.PI;
				a1 = (x1 + 0.5) * Math.PI;
				a2 = (x2 + 0.5) * Math.PI;
				
				x0 = Math.cos(a0);
				x1 = Math.cos(a1);
				x2 = Math.cos(a2);
				
				z0 = Math.sin(a0);
				z1 = Math.sin(a1);
				z2 = Math.sin(a2);
				
				that.mesh.set(x0, y0, z0, tx0, ty0);
				that.mesh.set(x1, y1, z1, tx1, ty1);
				that.mesh.set(x2, y2, z2, tx2, ty2);

				that.mesh.set(x0, y0, -z0, tx0, ty0);
				that.mesh.set(x2, y2, -z2, tx2, ty2);
				that.mesh.set(x1, y1, -z1, tx1, ty1);
			}
		);
	
		this.mesh.build();
		
	},
	
	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		this.noiseTexture = 
			SOAR.texture.create(EASY.display, EASY.lookup.resources["noise2"].data);
	},
	
	/**
		generate a wordwall of a particular attack type
		
		recognized attacks: excuse, appease, flatter, blame, confuse
		
		@method spawn
		@param type string, attack type
	**/
	
	spawn: function(type) {
		if (!this.active) {
			this.active = true;
			this.radius = 0;
			this.attack = type;
			this.damage = false;
			EASY.hud.addMessage("Attacked with " + type);
		}
	},
	
	/**
		update the wordwall expansion and fire off
		damage whenever called for
		
		@method update
	**/
	
	update: function() {
		var dt, dd;

		if (this.active) {

			dt = SOAR.interval * 0.001;
			dd = EASY.ghost.position.distance(EASY.player.footPosition);
		
			if (dd < this.MAX_RADIUS && !this.damage) {
				EASY.ghost.weaken(this.attack);
				this.damage = true;
			}

			this.radius = Math.min(
				this.radius + this.EXPAND_RATE * dt,
				this.MAX_RADIUS
			);
			
			if (this.radius === this.MAX_RADIUS) {
				this.active = false;
			}
		}
	},
	
	/**
		draw the wordwall if it's active
		
		@method draw
	**/
	
	draw: function() {
	
		var gl = EASY.display.gl;
		var shader = this.shader;
		var camera = EASY.player.camera;

		if (this.active) {
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			
			shader.activate();
			gl.uniformMatrix4fv(shader.projector, false, camera.projector());
			gl.uniformMatrix4fv(shader.rotations, false, camera.rotations());

			gl.uniform1f(shader.radius, this.radius);
			gl.uniform1f(shader.height, EASY.player.PLAYER_HEIGHT);

			this.noiseTexture.bind(0, shader.noise);
			this.mesh.draw();
			
			gl.disable(gl.BLEND);
		}
	
	}
};