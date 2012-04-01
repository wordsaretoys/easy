/**
	generates and displays a part of a cave
	
	@namespace EASY
	@class cave
**/

EASY.cave = {

	LENGTH: 64,
	STEP: 0.35,
	EDGE: 4,
	ZERO_HEIGHT: 0.25,
	WALL_HEIGHT: 4,
	SEPARATION: 1,
	
	MAX_AREAS: 7,
	
	texture: {},

	area: [],
	flat: [],
	
	/**
		create data objects, meshes, and shader programs
		
		@method init
	**/
	
	init: function() {

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-cave"), SOAR.textOf("fs-cave"),
			["position", "texturec"],
			["projector", "modelview", "color", "torch"],
			["rock"]
		);
		
		this.map = EASY.canvasser.create(
			this.WALL_HEIGHT,
			this.LENGTH,
			1
		);
		
		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);

		//this.palette = [ 0, 0, 0,  0, 0, 0,  0, 0, 0 ];
		this.palette = [0.96, 1, 0.91, 0.64, 0.8, 0.86, 0.56, 0.5, 1];
		this.MIDDLE = this.WALL_HEIGHT - this.SEPARATION;
		this.CEILING = this.MIDDLE * 2;
	},
	
	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		this.texture.noise = 
			SOAR.texture.create(EASY.display, EASY.resources["noise1"].data);
	},
	
	/**
		(re)generate cave mesh and texture
		
		@method generate
	**/
	
	generate: function() {
		var map = this.map;
		var l = this.LENGTH;
		var ll = this.EDGE;
		var hl = l - ll;
		var that = this;
	
		// wipe the canvas
		map.context.fillStyle = "rgb(255, 0, 0)";
		map.context.fillRect(0, 0, l, l);
		
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

				dx = Math.random() - Math.random();
				dy = Math.random() - Math.random();
				d = Math.sqrt(dx * dx + dy * dy);
				x += 0.5 * dx / d;
				y += 0.5 * dy / d;

				dx = tx - x;
				dy = ty - y;
				d = Math.sqrt(dx * dx + dy * dy);
				x += 0.1 * dx / d;
				y += 0.1 * dy / d;
				
				x = SOAR.clamp(x, ll, hl);
				y = SOAR.clamp(y, ll, hl);
				
				map.context.beginPath();
				map.context.arc(x, y, 2, 0, SOAR.PIMUL2, false);
				map.context.fill();
			} while (d > 1);
		}
		
		// generate areas of interest
		(function() {
			var i, il;
			that.area.length = 0;
			for (i = 0; i < that.MAX_AREAS; i++) {
				that.area[i] = {
					x: ll + (hl - ll) * Math.random(),
					y: ll + (hl - ll) * Math.random()
				}
			}
			// areas near entrance and exit are special cases
			that.area[0].y = hl;
			that.area[that.MAX_AREAS - 1].y = ll;
			
			// generate paths between areas
			for	(i = 1; i < that.MAX_AREAS; i++) {
				drawPath(that.area[i - 1].x, that.area[i - 1].y, 
					that.area[i].x, that.area[i].y);
			}
		})();
		
		// force entrance and exit tunnels
		map.context.fillStyle = "rgba(0, 0, 0, 0.75)";
		map.context.beginPath();
		map.context.arc(this.area[0].x, l - 2, 2, 0, SOAR.PIMUL2, false);
		map.context.arc(this.area[0].x, l - 4, 2, 0, SOAR.PIMUL2, false);
		map.context.fill();
		map.context.beginPath();
		map.context.arc(this.area[this.MAX_AREAS - 1].x, 2, 2, 0, SOAR.PIMUL2, false);
		map.context.arc(this.area[this.MAX_AREAS - 1].x, 4, 2, 0, SOAR.PIMUL2, false);
		map.context.fill();
		
		// construct map
		map.build();
		//map.interpolate = SOAR.interpolator.linear;

		// generate the triangle mesh
		this.mesh.reset();
		(function() {
			var st = that.STEP;
			var x, z;
			var xs, zs;
			var y0, y1, y2, y3;
			
			for (x = 0; x < l; x += st) {
				for (z = 0; z < l; z += st) {
				
					xs = x + st;
					zs = z + st;
					
					y0 = that.getFloorHeight(x, z);
					y1 = that.getFloorHeight(xs, z);
					y2 = that.getFloorHeight(x, zs);
					y3 = that.getFloorHeight(xs, zs);
	
					if (!(y0 > that.MIDDLE && y1 > that.MIDDLE && y2 > that.MIDDLE && y3 > that.MIDDLE)) {

						that.mesh.set(x, y0, z, x, z);
						that.mesh.set(x, y2, zs, x, zs);
						that.mesh.set(xs, y1, z, xs, z);
						
						that.mesh.set(x, y2, zs, x, zs);
						that.mesh.set(xs, y3, zs, xs, zs);
						that.mesh.set(xs, y1, z, xs, z);

						y0 = that.CEILING - y0;
						y1 = that.CEILING - y1;
						y2 = that.CEILING - y2;
						y3 = that.CEILING - y3;

						that.mesh.set(x, y0, z, x, z);
						that.mesh.set(xs, y1, z, xs, z);
						that.mesh.set(x, y2, zs, x, zs);
						
						that.mesh.set(x, y2, zs, x, zs);
						that.mesh.set(xs, y1, z, xs, z);
						that.mesh.set(xs, y3, zs, xs, zs);
					}
				}
			}
		})();

		// build the GL object (retain memory buffer for next generation)
		this.mesh.build(true);
		
		// update the palette with a random walk through color space
		(function() {
			var i, il;
			for (i = 0, il = that.palette.length; i < il; i++) {
				that.palette[i] = SOAR.clamp(
					(that.palette[i] || 0.5 + 0.5 * Math.random()) +
					0.1 * (Math.random() - Math.random()), 0.5, 1);
			}
		})();
		
		// find all flat 1m square areas of the map
		// that aren't touching each other directly
		(function() {
			var m = hl - 10;
			var x, z;
			that.flat.length = 0;
			for (x = ll; x < hl; x += 1.5) {
				for (z = ll; z < m; z += 1.5) {
					if (that.isFlat(x, z, 0.5)) {
						that.flat.push( {
							x: x, 
							z: z
						} );
					}
				}
			}
			// shuffle the flats array into random order
			that.flat.shuffle();
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
		return Math.max(this.ZERO_HEIGHT, this.map.get(0, x, z));
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
		if (this.getFloorHeight(x, z) > this.ZERO_HEIGHT) {
			return false;
		}
		if (this.getFloorHeight(x + r, z) > this.ZERO_HEIGHT) {
			return false;
		}
		if (this.getFloorHeight(x - r, z) > this.ZERO_HEIGHT) {
			return false;
		}
		if (this.getFloorHeight(x, z + r) > this.ZERO_HEIGHT) {
			return false;
		}
		if (this.getFloorHeight(x, z - r) > this.ZERO_HEIGHT) {
			return false;
		}
		if (this.getFloorHeight(x - r, z - r) > this.ZERO_HEIGHT) {
			return false;
		}
		if (this.getFloorHeight(x - r, z + r) > this.ZERO_HEIGHT) {
			return false;
		}
		if (this.getFloorHeight(x + r, z - r) > this.ZERO_HEIGHT) {
			return false;
		}
		if (this.getFloorHeight(x + r, z + r) > this.ZERO_HEIGHT) {
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
		gl.uniform3fv(shader.color, palette);
		gl.uniform1i(shader.torch, camera.mapView ? 0 : 1);
		this.texture.noise.bind(0, shader.rock);
		this.mesh.draw();

		gl.disable(gl.CULL_FACE);
	},
	
	/**
		release all GL resources
		
		@method release
	**/
	
	release: function() {
		this.mesh.release();
		this.texture.noise.release();
	}

};
