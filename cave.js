/**
	generates and displays the cave environment
	
	@namespace EASY
	@class cave
**/

EASY.cave = {

	BOUND_LIMIT: 1,

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
		// create cave floor mesh
		//
	
		this.lowerShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-cave"), SOAR.textOf("fs-cave-lower"),
			["position", "texturec", "a_light"], 
			["projector", "modelview"],
			["noise", "leaf", "dirt"]
		);

		var lights = SOAR.noise2D.create(1294934, 1, 64, 0.2);
		var common = SOAR.noise2D.create(5234512, 2, 64, 0.2);

		this.lowerMesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		this.lowerMesh.add(this.lowerShader.position, 3);
		this.lowerMesh.add(this.lowerShader.texturec, 2);
		this.lowerMesh.add(this.lowerShader.a_light, 1);

		this.getLowerHeight = function(x, z) {
			var h = Math.pow(common.get(x, z), 6);
			return (h > 6) ? 6 : h;
		};

		this.createSheet(
			this.lowerMesh, 
			this.getLowerHeight, 
			function(x, z) {
				return lights.get(x, z);
			}
		);
		
		this.lowerMesh.build();

		//
		// create cave ceiling mesh
		//

		this.upperShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-cave"), SOAR.textOf("fs-cave-upper"),
			["position", "texturec", "a_light"], 
			["projector", "modelview"],
			["noise"]
		);

		this.upperMesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		this.upperMesh.add(this.upperShader.position, 3);
		this.upperMesh.add(this.upperShader.texturec, 2);
		this.upperMesh.add(this.upperShader.a_light, 1);

		this.getUpperHeight = function(x, z) {
			var h = 10 - Math.pow(common.get(x, z), 6); 
			return (h < 4) ? 4 : h;
		};

		this.createSheet(
			this.upperMesh, 
			this.getUpperHeight, 
			function(x, z) {
				return lights.get(x, z);
			}
		);
		
		this.upperMesh.build();
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
		this.dirtTexture = 
			SOAR.texture.create(display, resources["dirt"].data);
		this.leafTexture = 
			SOAR.texture.create(display, resources["leaf"].data);
	},
	
	/**
		adjust position and velocity to conform to environment
		
		@constrain
		@param p position of object or actor
		@param v velocity of object or actor
	**/
	
	constrain: function(p, v) {
		var bound = EASY.world.boundary;
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

		// don't permit player to walk into boundary
		if (p.x < this.BOUND_LIMIT) {
			p.x = this.BOUND_LIMIT;
			v.x = v.x > 0 ? v.x : 0;
		}
		if (p.x > bound.x - this.BOUND_LIMIT) {
			p.x = bound.x - this.BOUND_LIMIT;
			v.x = v.x < 0 ? v.x : 0;
		}
		if (p.z < this.BOUND_LIMIT) {
			p.z = this.BOUND_LIMIT;
			v.z = v.z > 0 ? v.z : 0;
		}
		if (p.z > bound.z - this.BOUND_LIMIT) {
			p.z = bound.z - this.BOUND_LIMIT;
			v.z = v.z < 0 ? v.z : 0;
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

		this.lowerShader.activate();
		gl.uniformMatrix4fv(this.lowerShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.lowerShader.modelview, false, camera.modelview());
		this.noise1Texture.bind(0, this.lowerShader.noise);
		this.leafTexture.bind(1, this.lowerShader.leaf);
		this.dirtTexture.bind(2, this.lowerShader.dirt);
		this.lowerMesh.draw();
		
		gl.cullFace(gl.FRONT);

		this.upperShader.activate();
		gl.uniformMatrix4fv(this.upperShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.upperShader.modelview, false, camera.modelview());
		this.noise1Texture.bind(0, this.upperShader.noise);
		this.lowerMesh.draw();
		this.upperMesh.draw();
		
		gl.disable(gl.CULL_FACE);
	}

};
