/**
	generates and displays a cave chamber 
	
	@namespace EASY
	@class chamber
**/

EASY.chamber = {

	LENGTH: 64,
	MAX_HEIGHT: 4,
	SEPARATION: 1,

	/**
		create data objects, meshes, and shader programs
		
		@method init
	**/
	
	init: function() {

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-cave"), SOAR.textOf("fs-cave"),
			["position", "texturec"],
			["projector", "modelview", "color0", "color1", "color2"],
			["rock"]
		);
		
		this.map = EASY.canvasser.create(
			this.MAX_HEIGHT, 
			this.LENGTH + 2, // extra insures buffer zone
			1
		);
		
		this.rng = SOAR.random.create();
	
		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);

		this.palette = [
			{ r: 0.8, g: 0.4, b: 0.2 },
			{ r: 0.5, g: 0.7, b: 0.8 },
			{ r: 0.2, g: 0.9, b: 0.5 }
		];
	},
	
	/**
		(re)generate cave mesh and texture
		
		@method generate
	**/
	
	generate: function() {
		var map = this.map;
		var rng = this.rng;
		var l = this.LENGTH;
		var hl = l * 0.5;
		var ql = hl * 0.5;
	
		// wipe the canvas
		map.context.fillStyle = "rgb(0, 0, 0)";
		map.context.fillRect(0, 0, this.LENGTH, this.LENGTH);
		
		// closure function for drawing a meandering path
		function drawPath(x, y, tx, ty) {
			var dx, dy, d;
			do {

				dx = rng.get() - rng.get();
				dy = rng.get() - rng.get();
				d = Math.sqrt(dx * dx + dy * dy);
				x += 0.5 * dx / d;
				y += 0.5 * dy / d;

				dx = tx - x;
				dy = ty - y;
				d = Math.sqrt(dx * dx + dy * dy);
				x += 0.05 * dx / d;
				y += 0.05 * dy / d;
				
				x = SOAR.clamp(x, 0, l);
				y = SOAR.clamp(y, 0, l);
				
				map.context.fillRect(x - 2, y - 2, 4, 4);
			} while (Math.abs(dx) > 1 || Math.abs(dy) > 1);
		}
		
		// generate paths
		map.context.fillStyle = "rgba(255, 0, 0, 0.05)";
		drawPath(hl, l, hl, hl);
		drawPath(hl, hl, hl - ql, 0);
		drawPath(hl, hl, hl + ql, 0);

		// insure integrity of entrance and exit
		map.context.fillStyle = "rgba(255, 0, 0, 1)";
		map.context.beginPath();
		map.context.arc(hl, l, 4, 0, SOAR.PIMUL2, false);
		map.context.arc(hl - ql, 0, 4, 0, SOAR.PIMUL2, false);
		map.context.arc(hl + ql, 0, 4, 0, SOAR.PIMUL2, false);
		map.context.fill();

		// construct map
		map.build();
		
		// generate the triangle mesh
		this.mesh.reset();
		var that = this;
		var zero = that.SEPARATION;
		SOAR.subdivide(7, 0, 0, this.LENGTH, this.LENGTH,
		function(x0, z0, x1, z1, x2, z2) {
			var y0 = that.getFloorHeight(x0, z0);
			var y1 = that.getFloorHeight(x1, z1);
			var y2 = that.getFloorHeight(x2, z2);
	
			if (!(y0 === zero && y1 === zero && y2 === zero)) {

				that.mesh.set(x0, y0, z0, x0, z0);
				that.mesh.set(x1, y1, z1, x1, z1);
				that.mesh.set(x2, y2, z2, x2, z2);

				y0 = that.getCeilingHeight(x0, z0);
				y1 = that.getCeilingHeight(x1, z1);
				y2 = that.getCeilingHeight(x2, z2);

				that.mesh.set(x0, y0, z0, x0, z0);
				that.mesh.set(x2, y2, z2, x2, z2);
				that.mesh.set(x1, y1, z1, x1, z1);
			}
		});
		
		// build the GL object (retrain memory buffer for next generation)
		this.mesh.build(true);
		
		// place the player at the entrance
		EASY.player.footPosition.set(hl, this.getFloorHeight(hl, l - 2), l - 2);
/*
		// update the palette
		(function() {
			var i, il;
			for (i = 0, il = that.palette.length; i < il; i++) {
				that.palette[i].r += 0.1 * (rng.get() - rng.get());
				that.palette[i].g += 0.1 * (rng.get() - rng.get());
				that.palette[i].r += 0.1 * (rng.get() - rng.get());
			}
		})();
*/
	},
	
	/**
		return the y-coordinate of the lower heightmap
		
		@method getFloorHeight
		@param x number representing x-coordinate
		@param z number representing z-coordinate
		@return number representing y-coordinate
	**/
	
	getFloorHeight: function(x, z) {
		return -this.map.get(0, x, z) + this.SEPARATION;
	},
	
	/**
		return the y-coordinate of the upper heightmap
		
		@method getCeilingHeight
		@param x number representing x-coordinate
		@param z number representing z-coordinate
		@return number representing y-coordinate
	**/
	
	getCeilingHeight: function(x, z) {
		return this.map.get(0, x, z) - this.SEPARATION;
	},

	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		var display = EASY.display;
		var resources = EASY.world.resources;
		var bound = EASY.world.boundary;
		
		this.noise1Texture = 
			SOAR.texture.create(display, resources["noise1"].data);
		this.noise2Texture = 
			SOAR.texture.create(display, resources["noise2"].data);
	},
	
	/**
		draw cave environment
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;
		var palette = this.palette;
		var shader = this.shader;

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		gl.uniform3f(shader.color0, palette[0].r, palette[0].g, palette[0].b);
		gl.uniform3f(shader.color1, palette[1].r, palette[1].g, palette[1].b);
		gl.uniform3f(shader.color2, palette[2].r, palette[2].g, palette[2].b);
		this.noise1Texture.bind(0, shader.rock);
		this.mesh.draw();

		gl.disable(gl.CULL_FACE);
	},
	
	/**
		release all GL resources
		
		@method release
	**/
	
	release: function() {
		this.mesh.release();
		this.noise1Texture.release();
		this.noise2Texture.release();
	}

};
