/**
	generates and displays the cave environment
	
	@namespace EASY
	@class cave
**/

EASY.cave = {

	CEILING_HEIGHT: 5,

	scratch: {
		down: SOAR.vector.create()
	},
		

	/**
		create data objects, meshes, and shader programs
		
		@method init
	**/
	
	init: function() {
	
		var display = EASY.display;
		var bound = EASY.world.boundary;

		//
		// create ground mesh
		//
	
		this.shader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-cave"), SOAR.textOf("fs-cave"),
			["position", "texturec", "a_light"], 
			["projector", "modelview"],
			["tex0"]
		);
		this.lowerMesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		this.lowerMesh.add(this.shader.position, 3);
		this.lowerMesh.add(this.shader.texturec, 2);
		this.lowerMesh.add(this.shader.a_light, 1);

		var ceiling = SOAR.noise2D.create(3184967, 10, 32, 0.05);
		var ground1 = SOAR.noise2D.create(2388343, 0.5, 32, 0.1);
		var ground2 = SOAR.noise2D.create(1947832, 2, 32, 0.1);
		var ground3 = SOAR.noise2D.create(8472837, 50, 32, 0.1);
		var ch = this.CEILING_HEIGHT;
		
		this.getLowerHeight = function(x, z) {
			var g = ground1.get(x, z) * ground2.get(x, z) * ground3.get(x, z);
			var c = ceiling.get(x, z) + ch;
			if (g > c) {
				g = c;
			}
			return g;
		};

		var lights = SOAR.noise2D.create(1294934, 1, 32, 0.1);
		this.createSheet(
			this.lowerMesh, 
			this.getLowerHeight, 
			function(x, z) {
				return lights.get(x, z);
			}
		);		
		this.lowerMesh.build();
		
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
		var x0 = bound.x0, x1 = bound.x1;
		var z0 = bound.z0, z1 = bound.z1;
		var dx = x1 - x0;
		var dz = z1 - z0;
		var oddrow = false;
		var xa, xb, ya, yb;
		var x, y, z;

		// building a triangle strip-based grid takes some fiddling
		for (x = x0; x <= x1; x++) {
			// we have to construct the grid in different directions on alternating rows
			for (z = oddrow ? z0 : z1; oddrow ? z <= z1 : z >= z0; z += oddrow ? 1 : -1) {
				xa = oddrow ? x + 1 : x;
				xb = oddrow ? x : x + 1;
				ya = f(xa, z);
				yb = f(xb, z);
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
		
		this.groundTexture = 
			SOAR.texture.create(display, resources["ground"].data);
	},
	
	/**
		adjust position and velocity to conform to environment
		
		@constrain
		@param p position of object or actor
		@param v velocity of object or actor
	**/
	
	constrain: function(p, v) {

		var h = this.getLowerHeight(p.x, p.z);
		var down = this.scratch.down;
	
		// p isn't allowed to be below ground
		if (p.y < h) {
			p.y = h;
		}

		// on the ground, v can't be negative
		if (p.y === h) {
			v.y = v.y > 0 ? v.y : 0;
		}

		// generate a vector that points to "down" and whose 
		// magnitude increases geometrically with the slope
		down.set(
			this.getLowerHeight(p.x - 1, p.z) - this.getLowerHeight(p.x + 1, p.z),
			0, 
			this.getLowerHeight(p.x, p.z - 1) - this.getLowerHeight(p.x, p.z + 1)
		).set(
			Math.pow(down.x, 2) * SOAR.sign(down.x),
			0,
			Math.pow(down.z, 2) * SOAR.sign(down.z)
		);
		v.add(down);
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

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
		this.shader.activate();
		gl.uniformMatrix4fv(this.shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.shader.modelview, false, camera.modelview());
		this.groundTexture.bind(0, this.shader.tex0);
		this.lowerMesh.draw();
		
		gl.disable(gl.CULL_FACE);
		gl.disable(gl.BLEND);		
	}

};
