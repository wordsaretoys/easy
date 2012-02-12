/**
	generate, animate, and display cave creatures
	
	@namespace EASY
	@class creatures
**/

EASY.creatures = {

	EXTRUDE_STEPS: 24,

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
//			["projector", "modelview", "rotations", "center", "scale"],
			["projector", "modelview", "center", "scale"],
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
		shaper.map[1] = 0.5;
		
		// generate the mesh data
		this.extrude(mesh, shaper);
		
		// generate a skin
		skin = SOAR.texture.create(display, this.coat());
		
		// add to collection
		this.list.push({
			mesh: mesh,
			center: center,
			skin: skin
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
			for (angle = 0; angle <= twopi; angle += stepAngle) {
				s = Math.sin(angle);
				c = Math.cos(angle);
				// e modulates the cylinder to flatten it in the y direction
				e = 0.25 * Math.pow(s, 4);
				// xa|b, ya|b are modulated circle coordinates
				xa = ra * c;
				ya = e * ra * s;
				xb = rb * c;
				yb = e * rb * s;
				// cosine provides texture coordinates {1..-1} across x
				// modulates by radius to avoid "squeezing" the texture
				// where the radius is small
				tya = 8 * ra * c;
				tyb = 8 * rb * c;
				m.set(xb, yb, zb, txb, tyb);
				m.set(xa, ya, za, txa, tya);
			}
		}
		m.build();
	},
	
	coat: function() {
		var ctx = this.context;
		var w = this.canvas.width;
		var h = this.canvas.height;
		var palette = [];
		var rng = SOAR.random.create();
		var i, il, x, y, s;

		// generate a palette
		for (i = 0, il = 5 + Math.floor(rng.getn(5)); i < il; i++) {
			palette.push("rgb(" + 
				Math.floor(rng.getn(256)) + ", " +
				Math.floor(rng.getn(256)) + ", " +
				Math.floor(rng.getn(256)) + ")"
			);
		}

		ctx.fillStyle = palette[0];
		ctx.fillRect(0, 0, w, h);
		
		for (i = 0; i < 1000; i++) {
			ctx.fillStyle = palette[1 + Math.floor(rng.getn(palette.length - 1))];
			x = Math.floor(rng.getn(w));
			y = Math.floor(rng.getn(h));
			s = 2 + Math.floor(rng.getn(2));
			ctx.fillRect(x, y, s, s);
		}
		
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(0, 0, 4, h);
		
		return ctx.getImageData(0, 0, w, h);
	},
	
	draw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;
		var i, il, creature;
	
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		this.skinShader.activate();
		gl.uniformMatrix4fv(this.skinShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.skinShader.modelview, false, camera.modelview());
		for (i = 0, il = this.list.length; i < il; i++) {
			creature = this.list[i];
			c = creature.center;
			c.y = 1.5 + 0.5 * Math.sin(SOAR.elapsedTime * 0.001);
			gl.uniform3f(this.skinShader.center, c.x, c.y, c.z);
			gl.uniform1f(this.skinShader.scale, 1);
			creature.skin.bind(0, this.skinShader.skin);
			creature.mesh.draw();
		}
		gl.disable(gl.CULL_FACE);
	}

};
