/**
	generates and displays the forest environment
	
	@namespace FOUR
	@class forest
**/

FOUR.forest = {

	SUN_HEIGHT: 1000,
	CEILING_HEIGHT: 5,

	scratch: {
		down: SOAR.vector.create()
	},
		

	/**
		create data objects, meshes, and shader programs
		
		@method init
	**/
	
	init: function() {
	
		var display = FOUR.display;
		var bound = FOUR.world.boundary;

		//
		// create ground mesh
		//
	
		this.groundShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-ground"), SOAR.textOf("fs-ground"),
			["position", "texturec", "a_light"], 
			["projector", "modelview"],
			["tex0"]
		);
		this.groundMesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		this.groundMesh.add(this.groundShader.position, 3);
		this.groundMesh.add(this.groundShader.texturec, 2);
		this.groundMesh.add(this.groundShader.a_light, 1);

		var ceiling = SOAR.noise2D.create(3184967, 10, 32, 0.05);
		var ground1 = SOAR.noise2D.create(2388343, 0.5, 32, 0.1);
		var ground2 = SOAR.noise2D.create(1947832, 2, 32, 0.1);
		var ground3 = SOAR.noise2D.create(8472837, 50, 32, 0.1);
		var ch = this.CEILING_HEIGHT;
		
		this.getGroundHeight = function(x, z) {
			var g = ground1.get(x, z) * ground2.get(x, z) * ground3.get(x, z);
			var c = ceiling.get(x, z) + ch;
			if (g > c) {
				g = c;
			}
			return g;
		};

		var lights = SOAR.noise2D.create(1294934, 1, 32, 0.1);
		this.createSheet(
			this.groundMesh, 
			this.getGroundHeight, 
			function(x, z) {
				return lights.get(x, z);
			}
		);		
		this.groundMesh.build();
		
		//
		// create sun mesh
		//
		
		this.sunShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-sun"), SOAR.textOf("fs-sun"),
			["position", "texturec",], 
			["projector", "modelview"]
		);
		this.sunMesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		this.sunMesh.add(this.sunShader.position, 3);
		this.sunMesh.add(this.sunShader.texturec, 2);
		this.sunMesh.set(bound.x0, this.SUN_HEIGHT, bound.z0, -0.5, -0.5);
		this.sunMesh.set(bound.x0, this.SUN_HEIGHT, bound.z1, -0.5, 0.5);
		this.sunMesh.set(bound.x1, this.SUN_HEIGHT, bound.z1, 0.5, 0.5);
		this.sunMesh.set(bound.x0, this.SUN_HEIGHT, bound.z0, -0.5, -0.5);
		this.sunMesh.set(bound.x1, this.SUN_HEIGHT, bound.z0, 0.5, -0.5);
		this.sunMesh.set(bound.x1, this.SUN_HEIGHT, bound.z1, 0.5, 0.5);
		this.sunMesh.build();
		
		//
		// create treeline
		//
	
		this.treeShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-trees"), SOAR.textOf("fs-trees"),
			["position", "texturec", "a_light"], 
			["projector", "modelview"],
			["tex0"]
		);
		this.treeMesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		this.treeMesh.add(this.treeShader.position, 3);
		this.treeMesh.add(this.treeShader.texturec, 2);
		this.treeMesh.add(this.treeShader.a_light, 1);
		this.createSheet(
			this.treeMesh,
			function(x, z) {
				return ch + ceiling.get(x, z) + 10;
			},
			function(x, z) {
				return lights.get(x, z);
			}
		);
		this.createSheet(
			this.treeMesh,
			function(x, z) {
				return ch + ceiling.get(1273 + x, 4321 + z) + 5;
			},
			function(x, z) {
				return lights.get(x, z);
			}
		);		
		this.createSheet(
			this.treeMesh,
			function(x, z) {
				return ch + ceiling.get(x + 2372, z + 2372);
			},
			function(x, z) {
				return lights.get(x, z);
			}
		);
		this.treeMesh.build();
		
	},
	
	/**
		create modulated triangle strip "sheet" conforming to world boundaries
		
		@method createSheet
		@param m triangle strip mesh to add vertexes to
		@param f modulation function
		@param l 3D static light intensity function
	**/
	
	createSheet: function(m, f, l) {
	
		var bound = FOUR.world.boundary;
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
		var display = FOUR.display;
		var resources = FOUR.world.resources;
		var bound = FOUR.world.boundary;
		
		this.groundTexture = 
			SOAR.texture.create(display, resources["ground"].data);
		this.treeTexture = 
			SOAR.texture.create(display, resources["branches"].data);
	},
	
	/**
		adjust position and velocity to conform to environment
		
		@constrain
		@param p position of object or actor
		@param v velocity of object or actor
	**/
	
	constrain: function(p, v) {

		var h = this.getGroundHeight(p.x, p.z);
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
			this.getGroundHeight(p.x - 1, p.z) - this.getGroundHeight(p.x + 1, p.z),
			0, 
			this.getGroundHeight(p.x, p.z - 1) - this.getGroundHeight(p.x, p.z + 1)
		).set(
			Math.pow(down.x, 2) * SOAR.sign(down.x),
			0,
			Math.pow(down.z, 2) * SOAR.sign(down.z)
		);
		v.add(down);
	},
	
	/**
		draw forest environment
		
		@method draw
	**/
	
	draw: function() {
		var gl = FOUR.display.gl;
		var camera = FOUR.player.camera;

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
		this.groundShader.activate();
		gl.uniformMatrix4fv(this.groundShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.groundShader.modelview, false, camera.modelview());
		this.groundTexture.bind(0, this.groundShader.tex0);
		this.groundMesh.draw();
		
		gl.disable(gl.CULL_FACE);

		this.sunShader.activate();
		gl.uniformMatrix4fv(this.sunShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.sunShader.modelview, false, camera.modelview());
		this.sunMesh.draw();

		this.treeShader.activate();
		gl.uniformMatrix4fv(this.treeShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.treeShader.modelview, false, camera.modelview());
		this.treeTexture.bind(0, this.treeShader.tex0);
		this.treeMesh.draw();

		gl.disable(gl.BLEND);		
	}

};
