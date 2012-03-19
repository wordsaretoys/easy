/**
	generates and displays a part of a cave
	
	@namespace EASY
	@class cave
**/

EASY.cave = {

	LENGTH: 64,
	WALL_HEIGHT: 4,
	SEPARATION: 1,
	
	MAX_AREAS: 7,
	
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
			this.WALL_HEIGHT,
			this.LENGTH,
			1
		);
		
		this.rng = SOAR.random.create();
	
		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);

		this.palette = [
			{ r: 0, g: 0, b: 0 },
			{ r: 0, g: 0, b: 0 },
			{ r: 0, g: 0, b: 0 }
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
		map.context.fillStyle = "rgb(255, 0, 0)";
		map.context.fillRect(0, 0, this.LENGTH, this.LENGTH);
		
		// closure function for drawing a meandering path
		function drawPath(x, y, tx, ty) {
			var dx, dy, d, lx, ly;
			lx = tx;
			ly = ty;
			do {

				dx = lx - x;
				dy = ly - y;
				d = Math.sqrt(dx * dx + dy * dy);
				if (d > 1) {
					map.context.fillStyle = "rgba(0, 0, 0, 0.25)";
					map.context.beginPath();
					map.context.arc(x, y, 2, 0, SOAR.PIMUL2, false);
					map.context.fill();
					lx = x;
					ly = y;
					map.context.fillStyle = "rgba(0, 0, 0, 0.01)";
				}

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
				
				x = SOAR.clamp(x, 4, l - 4);
				y = SOAR.clamp(y, 4, l - 4);
				
				map.context.beginPath();
				map.context.arc(x, y, 2, 0, SOAR.PIMUL2, false);
				map.context.fill();
			} while (Math.abs(dx) > 1 || Math.abs(dy) > 1);
		}
		
		// generate areas of interest
		this.area = [];
		var i, il, a;
		for (i = 0; i < 7; i++) {
			this.area[i] = {
				x: 5 + (l - 10) * rng.get(),
				y: 5 + (l - 10) * rng.get()
			}
		}
		// areas near entrance and exit are special cases
		this.area[0].y = l - 5;
		this.area[6].y = 5;
		
		// generate paths between areas
		for	(i = 1, il = this.area.length; i < il; i++) {
			drawPath(this.area[i - 1].x, this.area[i - 1].y, 
				this.area[i].x, this.area[i].y);
		}
		
		// force entrance and exit tunnels
		map.context.strokeStyle = "rgba(0, 0, 0, 0.75)";
		map.context.lineWidth = 4;
		map.context.beginPath();
		map.context.moveTo(this.area[0].x, l + 1);
		map.context.lineTo(this.area[0].x, l - 5);
		map.context.stroke();
		map.context.beginPath();
		map.context.moveTo(this.area[6].x, -1);
		map.context.lineTo(this.area[6].x, 6);
		map.context.stroke();
		
		// construct map
		map.build();
		
		// generate the triangle mesh
		this.mesh.reset();
		var that = this;
		var zero = this.WALL_HEIGHT - this.SEPARATION;
		var ceil = zero * 2;
		SOAR.subdivide(6, 0, 0, this.LENGTH, this.LENGTH,
		function(x0, z0, x1, z1, x2, z2) {
			var y0 = that.getFloorHeight(x0, z0);
			var y1 = that.getFloorHeight(x1, z1);
			var y2 = that.getFloorHeight(x2, z2);
	
			if (!(y0 > zero && y1 > zero && y2 > zero)) {

				that.mesh.set(x0, y0, z0, x0, z0);
				that.mesh.set(x1, y1, z1, x1, z1);
				that.mesh.set(x2, y2, z2, x2, z2);

				y0 = ceil - y0;
				y1 = ceil - y1;
				y2 = ceil - y2;

				that.mesh.set(x0, y0, z0, x0, z0);
				that.mesh.set(x2, y2, z2, x2, z2);
				that.mesh.set(x1, y1, z1, x1, z1);
			}
		});
		
		// build the GL object (retain memory buffer for next generation)
		this.mesh.build(true);
		
		// place the player at the entrance
		EASY.player.footPosition.set(this.area[0].x, 
			this.getFloorHeight(this.area[0].x, this.area[0].y), 
			this.area[0].y);

		// update the palette
		(function() {
			var i, il;
			for (i = 0, il = that.palette.length; i < il; i++) {
				that.palette[i].r = 0.5 + 0.5 * rng.get();
				that.palette[i].g = 0.5 + 0.5 * rng.get();
				that.palette[i].b = 0.5 + 0.5 * rng.get();
			}
		})();

	},
	
	/**
		return the y-coordinate of the lower heightmap
		
		@method getFloorHeight
		@param x number representing x-coordinate
		@param z number representing z-coordinate
		@return number representing y-coordinate
	**/
	
	getFloorHeight: function(x, z) {
		return this.map.get(0, x, z);
	},
	
	/**
		returns whether the floor at a particular point is
		level enough (for situating an item or antagonist)
		
		@method isFlat
		@param x number representing x-coordinate
		@param z number representing z-coordinate
		@param r number representing test radius
		@return boolean, true if floor is free and level
	**/
	
	isFlat: function(x, z, r) {
		if (this.getFloorHeight(x, z) > 0) {
			return false;
		}
		if (this.getFloorHeight(x + r, z) > 0) {
			return false;
		}
		if (this.getFloorHeight(x - r, z) > 0) {
			return false;
		}
		if (this.getFloorHeight(x, z + r) > 0) {
			return false;
		}
		if (this.getFloorHeight(x, z - r) > 0) {
			return false;
		}
		return true;
	},
	
	/**
		returns whether the floor at a particular point is
		open enough for an antagonist to pass through
		
		@method isOpen
		@param x number representing x-coordinate
		@param z number representing z-coordinate
		@param r number representing test radius
		@return boolean, true if floor is open enough
	**/
	
	isOpen: function(x, z, r) {
		var h = this.WALL_HEIGHT - this.SEPARATION - r;
		if (this.getFloorHeight(x, z) >= h) {
			return false;
		}
		if (this.getFloorHeight(x + r, z) >= h) {
			return false;
		}
		if (this.getFloorHeight(x - r, z) >= h) {
			return false;
		}
		if (this.getFloorHeight(x, z + r) >= h) {
			return false;
		}
		if (this.getFloorHeight(x, z - r) >= h) {
			return false;
		}
		return true;
	},

	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		var display = EASY.display;
		var resources = EASY.lookup.resources;
		
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
