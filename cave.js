/**
	generates and displays the cave environment
	
	@namespace EASY
	@class cave
**/

EASY.cave = {

	BOUND_LIMIT: 1,
	SEARCH_LIMIT: 32,
	SEPARATION: 10,

	scratch: {
		down: SOAR.vector.create(),
		pos: SOAR.vector.create()
	},

	/**
		create data objects, meshes, and shader programs
		
		@method init
	**/
	
	init: function() {
	
		var display = EASY.display;
		var bound = EASY.world.boundary;
	
		this.lowerShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-cave-lower"), SOAR.textOf("fs-cave-lower"),
			["position", "texturec", "a_light"], 
			["projector", "modelview"],
			["noise", "leaf"]
		);

		this.upperShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-cave-upper"), SOAR.textOf("fs-cave-upper"),
			["position", "texturec", "a_light"], 
			["projector", "modelview"],
			["noise"]
		);

		var lights = SOAR.noise2D.create(1294934, 1, 64, 0.2);
		var height0 = SOAR.noise2D.create(5234512, 2, 64, 0.2);
		var height1 = SOAR.noise2D.create(9153095, 2, 64, 0.2);

		this.mesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		this.mesh.add(this.lowerShader.position, 3);
		this.mesh.add(this.lowerShader.texturec, 2);
		this.mesh.add(this.lowerShader.a_light, 1);
		this.mesh.grow(bound.x * bound.z * 2 * 6);

		this.getHeight = function(x, z) {
			var h = Math.pow(height0.get(x, z) * height1.get(x, z), 4);
			return (h > 6) ? 6 : h;
		};

		this.createSheet(
			this.mesh, 
			this.getHeight, 
			function(x, z) {
				return lights.get(x, z);
			}
		);
		
		this.mesh.build();
		
		bound.cx0 = this.BOUND_LIMIT;
		bound.cx1 = bound.x - this.BOUND_LIMIT;
		bound.cz0 = this.BOUND_LIMIT;
		bound.cz1 = bound.z - this.BOUND_LIMIT;
		
		this.lights = lights;
		
	},
	
	/**
		create modulated triangle strip "sheet" conforming to world boundaries
		
		@method createSheet
		@param m triangle strip mesh to add vertexes to
		@param f modulation function
		@param l 3D static light intensity function
	**/
	
	createSheet: function(m, f, l) {
	
		var bound = EASY.world.boundary;
		var x0 = 0, x1 = bound.x;
		var z0 = 0, z1 = bound.z;
		var oddrow = false;
		var xa, xb, ya, yb;
		var txa, txb, tz;
		var x, y, z;

		// building a triangle strip-based grid takes some fiddling
		// we have to construct the grid in different directions on alternating rows
		for (x = x0; x <= x1; x++) {
			xa = oddrow ? x + 1 : x;
			xb = oddrow ? x : x + 1;
			txa = xa / x1;
			txb = xb / x1;
			for (z = oddrow ? z0 : z1; oddrow ? z <= z1 : z >= z0; z += oddrow ? 1 : -1) {
				ya = f(xa, z);
				yb = f(xb, z);
				tz = z / z1;
				m.set(xa, ya, z, xa, z, l(xa, z));
				m.set(xb, yb, z, xb, z, l(xb, z));
			}
			oddrow = !oddrow;
		}
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
		this.upperShader.activate();
		gl.uniformMatrix4fv(this.upperShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.upperShader.modelview, false, camera.modelview());
		this.noise1Texture.bind(0, this.upperShader.noise);
		this.mesh.draw();
		
		gl.disable(gl.CULL_FACE);
	}

};
