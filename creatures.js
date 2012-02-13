/**
	generate, animate, and display cave creatures
	
	@namespace EASY
	@class creatures
**/

EASY.creatures = {

	EXTRUDE_STEPS: 24,
	PALETTE_SIZE: 10,

	list: [],
	
	/**
		initialize texture canvas and shader
		
		@method init
	**/

	init: function() {
		var display = EASY.display;
	
		this.canvas = document.createElement("canvas");
		this.canvas.width = 256;
		this.canvas.height = 32;
		this.context = this.canvas.getContext("2d");
		
		this.skinShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-creature"), SOAR.textOf("fs-creature"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center", "time"],
			["skin"]
		);
		
		// TEST TEST TEST
		this.add({x: 111, y: 1, z: 294});
	},
	
	/**
		add a new creature to the collection
		
		@method add
		@param center the creature's new center of mass
	**/
	
	add: function(center) {
		var display = EASY.display;
		var mesh, shaper, skin;
		
		// create new mesh
		mesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		mesh.add(this.skinShader.position, 3);
		mesh.add(this.skinShader.texturec, 2);

		// create a noise function to shape the mesh
		shaper = SOAR.noise1D.create(0, 0.5, 8, 8);
		shaper.interpolate = SOAR.interpolator.linear;
		shaper.map[0] = 0;
		shaper.map[1] = 0.25;
		
		// generate the mesh data
		this.extrude(mesh, shaper);
		
		// generate a skin
		skin = SOAR.texture.create(display, this.coat());
		
		// add to collection
		this.list.push({
			mesh: mesh,
			skin: skin,
			center: center,
			rotor: SOAR.freeRotor.create()
		});
	},

	/**
		generate a unit model using a cylindrical base
		
		@method extrude
		@param m the mesh to append vertexes to
		@param f the noise function to use as a silhouete model
	**/
	
	extrude: function(m, f) {
		var twopi = SOAR.PIMUL2;
		var stepZ = 1 / this.EXTRUDE_STEPS;
		var stepAngle = twopi / this.EXTRUDE_STEPS;
		var xa, xb, ya, yb, za, zb;
		var txa, txb, tya, tyb;
		var angle, s, c;
		var ra, rb, e;

		for (za = -0.5; za <= 0.5; za += stepZ) {
			zb = za + stepZ;
			txa = za + 0.5;
			txb = zb + 0.5;
			// ra and rb modulate the radius of the cylinder
			// square root provides a nice rounding effect
			// without sanding off all of the straight edges
			ra = Math.sqrt(f.get(txa));
			rb = Math.sqrt(f.get(txb));
			for (angle = twopi; angle >= 0; angle -= stepAngle) {
				s = Math.sin(angle);
				c = Math.cos(angle);
				// e modulates the cylinder to flatten it in the y direction
				e = 0.25 * Math.pow(s, 4);
				// xa|b, ya|b are modulated circle coordinates
				xa = ra * c;
				ya = e * ra * s;
				xb = rb * c;
				yb = e * rb * s;
				// absolute value of cosine provides {1..0..1} coverage
				// across x, and we multiply by the radius to avoid the
				// effect of "squeezing" many vertexes into small areas
				// multiply by 8 to account for dimensions of texture
				tya = Math.abs(8 * ra * c);
				tyb = Math.abs(8 * rb * c);
				m.set(xa, ya, za, txa, tya);
				m.set(xb, yb, zb, txb, tyb);
			}
		}
		m.build();
	},
	
	coat: function() {
		var ctx = this.context;
		var w = this.canvas.width;
		var h = this.canvas.height;
		var hh = h / 2;
		var palette = [];
		var rng = SOAR.random.create();
		var i, il, j, x, y, s;

		// generate a palette
		for (i = 0, il = this.PALETTE_SIZE; i < il; i++) {
			palette.push("rgba(" + 
				Math.floor(rng.getn(256)) + ", " +
				Math.floor(rng.getn(256)) + ", " +
				Math.floor(rng.getn(256)) + ", 0.01)"
			);
		}

		ctx.fillStyle = palette[0];
		ctx.fillRect(0, 0, w, h);
		
		for (i = 1, il = palette.length; i < il; i++) {
			ctx.fillStyle = palette[i];
			for (j = 0; j < 200; j++) {
				x = rng.getn(w);
				y = rng.getm(h) + hh;
				ctx.fillRect(x, y, 16, 16);
			}
		}
		
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(0, 0, 5, h);
		
		return ctx.getImageData(0, 0, w, h);
	},
	
	draw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;
		var i, il, creature, time;
	
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		this.skinShader.activate();
		gl.uniformMatrix4fv(this.skinShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.skinShader.modelview, false, camera.modelview());
		for (i = 0, il = this.list.length; i < il; i++) {
			creature = this.list[i];
			c = creature.center;
			time = SOAR.elapsedTime * 0.01;
			gl.uniformMatrix4fv(this.skinShader.rotations, false, 
				creature.rotor.matrix.rotations);
			gl.uniform3f(this.skinShader.center, c.x, c.y, c.z);
			gl.uniform1f(this.skinShader.time, time);
			creature.skin.bind(0, this.skinShader.skin);
			creature.mesh.draw();
		}
		gl.disable(gl.CULL_FACE);
	}

};
