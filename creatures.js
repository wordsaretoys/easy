/**
	generate, animate, and display cave creatures
	
	@namespace EASY
	@class creatures
**/

EASY.creatures = {

	list: [],

	/**
		initialize texture canvas and shader
		
		@method init
	**/

	init: function() {
		var display = EASY.display;
	
		this.canvas = document.createElement("canvas");
		this.context = this.canvas.getContext("2d");
		
		this.skinShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-creature"), SOAR.textOf("fs-creature"),
			["position", "texturec"], 
//			["projector", "modelview", "rotations", "center", "scale"],
			["projector", "modelview", "center", "scale"]
//			["skin"]
		);
		
		// TEST TEST TEST
		this.add({x: 111, y: 2, z: 290});
	},
	
	/**
		add a new creature to the collection
		
		@method add
		@param center the creature's new center of mass
	**/
	
	add: function(center) {
		var display = EASY.display;
		var mesh, shaper;
		
		// create new mesh
		mesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		mesh.add(this.skinShader.position, 3);
		mesh.add(this.skinShader.texturec, 2);

		// create a noise function to shape the mesh
		shaper = SOAR.noise1D.create(0, 1, 8, 8);
		shaper.interpolate = SOAR.interpolator.linear;
		shaper.map[0] = 0;
		
		// generate the mesh data
		this.extrude(mesh);
		
		this.list.push({
			mesh: mesh,
			center: center
		});
	},

	/**
		generate a unit model using a cylindrical base
		
		@method extrude
		@param m the mesh to append vertexes to
	**/
	
	extrude: function(m) {
		var STEPS = 25;
		var STEP_Z = 1 / STEPS;
		var LAST_ANGLE = 2 * Math.PI;
		var STEP_ANGLE = LAST_ANGLE / STEPS;
		var oddrow = false;
		var za, zb, ya, yb;
		var txa, txb, ty;
		var x, y, z, step;

		for (z = -1; z <= 1; z += STEP_Z) {
			if (oddrow) {
				za = z + STEP_Z;
				zb = z;
				angle = 0;
				step = STEP_ANGLE;
			} else {
				za = z;
				zb = z + STEP_Z;
				angle = LAST_ANGLE;
				step = -STEP_ANGLE;
			}
			txa = za / 2;
			txb = zb / 2;
			for (; oddrow ? angle <= LAST_ANGLE : angle >= 0; angle += step) {
				x = Math.cos(angle);
				y = Math.sin(angle);
				ty = angle / LAST_ANGLE;
				m.set(x, y, za, txa, ty);
				m.set(x, y, zb, txb, ty);
			}
			oddrow = !oddrow;
		}
		m.build();
	},
	
	draw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;
		var i, il, creature;
	
		this.skinShader.activate();
		gl.uniformMatrix4fv(this.skinShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.skinShader.modelview, false, camera.modelview());
		for (i = 0, il = this.list.length; i < il; i++) {
			creature = this.list[i];
			c = creature.center;
			gl.uniform3f(this.skinShader.center, c.x, c.y, c.z);
			gl.uniform1f(this.skinShader.scale, 1);
			creature.mesh.draw();
		}
	}

};
