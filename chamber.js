/**
	generates and displays a cave chamber 
	
	@namespace EASY
	@class chamber
**/

EASY.chamber = {

	RADIUS: 32,
	MAX_HEIGHT: 5,
	SEPARATION: 9,

	/**
		create data objects, meshes, and shader programs
		
		@method init
	**/
	
	init: function() {
	
		this.lowerShader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-cave-lower"), 
			SOAR.textOf("fs-cave-texture") + SOAR.textOf("fs-cave-lower"),
			["position", "texturec", "a_light"], 
			["projector", "modelview"],
			["noise", "leaf"]
		);

		this.upperShader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-cave-upper"), 
			SOAR.textOf("fs-cave-texture") + SOAR.textOf("fs-cave-upper"),
			["position", "texturec", "a_light"], 
			["projector", "modelview", "separation"],
			["noise"]
		);

		var lights = SOAR.noise2D.create(1294934, 1, 8, 0.2);
		var height0 = SOAR.noise2D.create(5234512, 2, 16, 16 / (this.RADIUS * 2));
		var height1 = SOAR.noise2D.create(9153095, 2, 16, 16 / (this.RADIUS * 2));

		var a, x, y, i;
		for (a = 0; a <= SOAR.PIMUL2; a += SOAR.PIMUL2 / (16 * 16)) {
			x = Math.round(8 * (1 + Math.cos(a)));
			y = Math.round(8 * (1 + Math.sin(a)));
			i = x + 16 * y;
			height0.map[i] = 1;
			height1.map[i] = 1;
		}


		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.lowerShader.position, 3);
		this.mesh.add(this.lowerShader.texturec, 2);
		this.mesh.add(this.lowerShader.a_light, 1);

		var that = this;
		this.getHeight = function(x, z) {
			var h = Math.pow(height0.get(x, z) * height1.get(x, z), 4);
			return Math.min(h, that.MAX_HEIGHT);
		};

		this.generateDisc(7, function(x, z) {
			var mx = that.RADIUS * (x + 1);
			var mz = that.RADIUS * (z + 1);
			var my = that.getHeight(mx, mz);
			that.mesh.set(mx, my, mz, mx, mz, lights.get(mx, mz));
		});
		
		this.mesh.build();
		this.lights = lights;
	},
	
	/**
		generates a mesh of triangles within a 2D unit circle.
		
		useful for generating heightmaps.
		
		@method generateDisc
		@param detail number of triangle subdivisions to generate
		@param callback function(x, y) to call for each vertex
	**/
	
	generateDisc: function(detail, callback) {
		
		function recurse(level, x0, y0, x1, y1, x2, y2) {
		
			var x3, y3;
			var x4, y4;
			var x5, y5;
			var xc, yc;
			
			if (0 === level) {
				xc = (x0 + x1 + x2) / 3;
				yc = (y0 + y1 + y2) / 3;
				if (xc * xc + yc * yc <= 1) {
					callback(x0, y0);
					callback(x2, y2);
					callback(x1, y1);
				}
			} else {
				x3 = (x0 + x1) * 0.5;
				y3 = (y0 + y1) * 0.5;
				x4 = (x2 + x1) * 0.5;
				y4 = (y2 + y1) * 0.5;
				x5 = (x0 + x2) * 0.5;
				y5 = (y0 + y2) * 0.5;
				level--;
				recurse(level, x0, y0, x3, y3, x5, y5);
				recurse(level, x3, y3, x1, y1, x4, y4);
				recurse(level, x5, y5, x4, y4, x2, y2);
				recurse(level, x4, y4, x5, y5, x3, y3);
			}
		}
		
		recurse(detail, 2, 0, -1, 1.732, -1, -1.732);
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
		this.leafTexture = 
			SOAR.texture.create(display, resources["leaf"].data);
	},
	
	/**
		draw cave environment
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		this.lowerShader.activate();
		gl.uniformMatrix4fv(this.lowerShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.lowerShader.modelview, false, camera.modelview());
		this.noise1Texture.bind(0, this.lowerShader.noise);
		this.leafTexture.bind(1, this.lowerShader.leaf);
		this.mesh.draw();

		gl.cullFace(gl.FRONT);

		// though the mesh attributes were defined in terms of the lower shader,
		// upper shader attributes still work; same underlying representation?
		// TODO: swap out attributes via direct access to mesh array
		this.upperShader.activate();
		gl.uniformMatrix4fv(this.upperShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.upperShader.modelview, false, camera.modelview());
		gl.uniform1f(this.upperShader.separation, this.SEPARATION);
		this.noise1Texture.bind(0, this.upperShader.noise);
		this.mesh.draw();
		
		gl.disable(gl.CULL_FACE);
	}

};
