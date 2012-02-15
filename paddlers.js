/**
	generate, animate, and display cave paddlers
	
	paddlers are procedurally-generated creatures with
	bilateral symmetry. flaps of tissue that look like
	tentacles or wings extend from cylindrical bodies.
	continuous paddling motions of these flaps permits
	them to fly.
	
	@namespace EASY
	@class paddlers
**/

EASY.paddlers = {

	CANVAS_SIZE: 256,
	EXTRUDE_STEPS: 24,
	TEXTURE_WIDTH: 256,
	TEXTURE_HEIGHT: 32,

	list: [],
	
	scratch: {
		vel: SOAR.vector.create()
	},
	
	/**
		initialize texture canvas and shader
		
		@method init
	**/

	init: function() {
		var display = EASY.display;
	
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.CANVAS_SIZE;
		this.canvas.height = this.CANVAS_SIZE;
		this.context = this.canvas.getContext("2d");
		
		this.skinShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-paddler"), SOAR.textOf("fs-paddler"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center", "time"],
			["face", "skin"]
		);

		this.masterSeed = SOAR.random.create();
		
		this.faceTexture = SOAR.texture.create(display, this.makeFace());
		
		// TEST TEST TEST
		this.add({x: 78, y: 1, z: 243});
	},
	
	/**
		generate a face texture for all models
		
		@method makeFace
		@return pixel array representing texture
	**/
	
	makeFace: function() {
		var ctx = this.context;
		var w = this.CANVAS_SIZE;
		var h = this.CANVAS_SIZE;
		
		ctx.clearRect(0, 0, w, h);

		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fillRect(0, 0, w, h);
		
		// create a mouth and eye spots
		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(0, 0, 5, h);
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.beginPath();
		ctx.arc(12, h - 24, 5, 0, SOAR.PIMUL2, false);
		ctx.fill();
		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.beginPath();
		ctx.arc(12, h - 24, 4, 0, SOAR.PIMUL2, false);
		ctx.fill();
	
		return ctx.getImageData(0, 0, w, h);
	},
	
	/**
		add a new paddler to the collection
		
		@method add
		@param start starting position for paddler
	**/
	
	add: function(start) {
		var display = EASY.display;
		var mesh, shaper, skin;
		
		// create new mesh
		mesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		mesh.add(this.skinShader.position, 3);
		mesh.add(this.skinShader.texturec, 2);

		// create a noise function to shape the mesh
		shaper = SOAR.noise1D.create(this.masterSeed.getl(), 0.5, 8, 8);
		shaper.interpolate = SOAR.interpolator.linear;
		shaper.map[0] = 0;
		shaper.map[1] = 0.25;
		
		// generate the mesh data
		this.extrude(mesh, shaper);
		
		// generate a skin
		skin = SOAR.texture.create(display, this.makeSkin());
		
		// add to collection
		this.list.push({
			mesh: mesh,
			skin: skin,
			center: SOAR.vector.create().copy(start),
			rotor: SOAR.boundRotor.create(),
			speed: 1
		});
	},

	/**
		generate a unit model using a cylindrical base
		
		@method extrude
		@param m the mesh to append vertexes to
		@param f the noise function to use as a silhouete model
	**/
	
	extrude: function(m, f) {
		var stepZ = 1 / this.EXTRUDE_STEPS;
		var stepAngle = SOAR.PIMUL2 / this.EXTRUDE_STEPS;
		var offset = 1 / this.TEXTURE_HEIGHT;
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
			for (angle = SOAR.PIMUL2; angle >= 0; angle -= stepAngle) {
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
				// effect of "squeezing" many vertexes into small areas;
				// multiply by 8 to account for dimensions of our canvas
				// apply 1-pixel offset to prevent an artifact when the
				// texture is mirrored across the model
				tya = Math.abs(8 * ra * c) + offset;
				tyb = Math.abs(8 * rb * c) + offset;
				m.set(xa, ya, za, txa, tya);
				m.set(xb, yb, zb, txb, tyb);
			}
		}
		m.build();
	},
	
	/**
		generate random skin texture
		
		@method makeSkin
		@return pixel array representing texture
	**/
	
	makeSkin: function() {
		var ctx = this.context;
		var w = this.TEXTURE_WIDTH;
		var h = this.TEXTURE_HEIGHT;
		var hh = h / 2;
		var rng = SOAR.random.create(this.masterSeed.getl());
		var r, g, b, base, coat;
		var i, x, y, s;

		ctx.clearRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
		r = Math.floor(rng.getn(256));
		g = Math.floor(rng.getn(256));
		b = Math.floor(rng.getn(256));
		base = "rgba(" + r + ", " + g + ", " + b + ", 0.01)";
		coat = "rgba(" + (256 - r) + ", " + (256 - g) + ", " + (256 - b) + ", 0.01)";

		ctx.fillStyle = base;
		ctx.fillRect(0, 0, w, h);
		
		ctx.fillStyle = coat;
		for (i = 0; i < 500; i++) {
			x = rng.getn(w);
			y = rng.getm(h) + hh;
			s = rng.getm(4) + 4;
			ctx.fillRect(x, y, s, s);
			ctx.strokeRect(x, y, s, s);
		}

		return ctx.getImageData(0, 0, w, h);
	},
	
	/**
		update all paddlers with new positions
		
		@method update
	**/

	update: function() {
		var scr = this.scratch;
		var dt = SOAR.interval * 0.001;
		var i, o, c, paddler;
		var d;
		var hf, hr, hl;
		
		for (i = 0, il = this.list.length; i < il; i++) {
			paddler = this.list[i];
			o = paddler.rotor.orientation;
			c = paddler.center;
			hf = EASY.cave.getLowerHeight(c.x + o.front.x, c.z + o.front.z);
			hr = EASY.cave.getLowerHeight(c.x + o.right.x, c.z + o.right.z);
			hl = EASY.cave.getLowerHeight(c.x - o.right.x, c.z - o.right.z);
			if (hr < hf) {
				paddler.rotor.turn(hf - hr, 0);
			}
			if (hl < hf) {
				paddler.rotor.turn(hl - hf, 0);
			}
			scr.vel.copy(o.front).mul(paddler.speed * dt);
			c.add(scr.vel);
		}
	},
	
	/**
		draw all paddlers visible to player
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;
		var i, il, paddler, time;
	
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		this.skinShader.activate();
		gl.uniformMatrix4fv(this.skinShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.skinShader.modelview, false, camera.modelview());
		this.faceTexture.bind(0, this.skinShader.skin);
		for (i = 0, il = this.list.length; i < il; i++) {
			paddler = this.list[i];
			c = paddler.center;
			time = SOAR.elapsedTime * 0.01;
			gl.uniformMatrix4fv(this.skinShader.rotations, false, 
				paddler.rotor.matrix.transpose);
			gl.uniform3f(this.skinShader.center, c.x, c.y, c.z);
			gl.uniform1f(this.skinShader.time, time);
			paddler.skin.bind(1, this.skinShader.skin);
			paddler.mesh.draw();
		}
		gl.disable(gl.CULL_FACE);
	}

};
