/**
	generate and animate the wall of words, 
	the player's only weapon against ghosts
	
	@namespace EASY
	@class wordwall
**/

EASY.wordwall = {

	RING_STEPS: 20,
	MAX_RADIUS: 15,
	EXPAND_RATE: 20,
	
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
			["projector", "rotations", "radius"],
			["sign"]
		);
		
		this.mesh = SOAR.mesh.create(EASY.display, EASY.display.gl.TRIANGLE_STRIP);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		
		(function() {
			var dang = SOAR.PIMUL2 / that.RING_STEPS;
			var ang, x, z, tx;
			for (ang = 0; ang <= SOAR.PIMUL2; ang += dang) {
				x = Math.cos(ang);
				z = Math.sin(ang);
				tx = 4 * ang / SOAR.PIMUL2;
				that.mesh.set(x, -0.5, z, tx, 0);
				that.mesh.set(x, 0.5, z, tx, 1);
			}
		})();
		
		this.mesh.build();

		this.canvas = document.createElement("canvas");
		this.canvas.height = 64;
		this.canvas.width = 2048;
		this.context = this.canvas.getContext("2d");
		
		this.context.font = "64px Arial";
		this.context.textAlign = "center";
		this.context.textBaseline = "middle";
		this.context.fillStyle = "rgba(255, 255, 255, 1)";
	},
	
	/**
		generate a wordwall of a particular attack type
		
		recognized attacks: excuse, appease, flatter, blame, confuse
		
		@method spawn
		@param type string, attack type
	**/
	
	spawn: function(type) {
		var cntx = this.context;
		var w = this.canvas.width;
		var h = this.canvas.height;
	
		if (!this.active) {
		
			cntx.clearRect(0, 0, w, h);
			cntx.fillText("Why wrestle with your conscience? Wrestle with a python instead.", w / 2, h / 2);
	
			this.sign = SOAR.texture.create(EASY.display, cntx.getImageData(0, 0, w, h));
		
			this.active = true;
			this.radius = 2;
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
				this.sign.release();
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
			
			this.sign.bind(0, shader.sign);
			this.mesh.draw();
			
			gl.disable(gl.BLEND);
		}
	
	}
};