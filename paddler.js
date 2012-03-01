/**
	generate, animate, and display paddlers
	
	paddlers are procedurally-generated creatures with
	bilateral symmetry. flaps of tissue that look like
	tentacles or wings extend from cylindrical bodies.
	continuous paddling motions of these flaps permits
	them to swim.
	
	@namespace EASY
	@class paddler
**/

EASY.paddler = {

	MAX_ACTIVE: 20,
	EXTRUDE_STEPS: 24,

	list: [],

	scratch: {
		vel: SOAR.vector.create()
	},
	
	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var i, il;

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-paddler"), SOAR.textOf("fs-paddler"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center", "time"],
			["face", "skin"]
		);
		
		this.rng = SOAR.random.create();
		
		this.shaper = SOAR.noise1D.create(0, 0.5, 8, 8);
		this.shaper.interpolate = SOAR.interpolator.linear;
		this.shaper.map[0] = 0;
		this.shaper.map[1] = 0.25;

		this.makeFace();

		for (i = 0, il = this.MAX_ACTIVE; i < il; i++) {
			this.list[i] = {
				mesh: SOAR.mesh.create(EASY.display, EASY.display.gl.TRIANGLE_STRIP),
				center: SOAR.vector.create(),
				rotor: SOAR.boundRotor.create(),
				speed: 1,
				pathTimeout: 0,
				targetPitch: -0.5,
				active: false
			};
			this.list[i].mesh.add(this.shader.position, 3);
			this.list[i].mesh.add(this.shader.texturec, 2);
		}

	},
	
	/**
		(re)generate new paddler shapes, textures, and positions
		
		@method generate
	**/
	
	generate: function() {
		var l = EASY.chamber.LENGTH;
		var pdlr;
		var x, y, z;
		var i, il;

		for (i = 0, il = this.MAX_ACTIVE; i < il; i++) {
			pdlr = this.list[i];
		
			do {
				x = this.rng.getn(l);
				z = this.rng.getn(l);
				y = EASY.chamber.getFloorHeight(x, z);
			} while(y > -0.5)
			
			this.makeModel(pdlr.mesh);
			if (pdlr.skin) {
				pdlr.skin.release();
			}
			pdlr.skin = this.makeSkin();
			
			pdlr.center.set(x, y, z);
			pdlr.speed = 1;
			pdlr.active = true;
		}
	},
	
	/**
		generate a face texture
		
		the face texture allows us to have one single resource
		rather than creating an additional texture for each of
		the paddlers. it's blended into the skin texture right
		inside the fragment shader.
		
		@method makeFace
	**/
	
	makeFace: function() {
		var ctx = EASY.texture.context;
		var w = EASY.texture.canvas.width;
		var h = EASY.texture.canvas.height;
		
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
	
		this.faceTexture = SOAR.texture.create(
			EASY.display, 
			ctx.getImageData(0, 0, w, h)
		);
	},
	
	/**
		generate a model mesh using a cylindrical base
		
		@method makeModel
		@param mesh the mesh object to use
	**/
	
	makeModel: function(mesh) {
		var stepZ = 1 / this.EXTRUDE_STEPS;
		var stepAngle = SOAR.PIMUL2 / this.EXTRUDE_STEPS;
		var offset = 1 / EASY.texture.canvas.height;
		var mesh;
		var xa, xb, ya, yb, za, zb;
		var txa, txb, tya, tyb;
		var angle, s, c;
		var ra, rb, e;
		var i;

		mesh.reset();
		
		for (i = 2; i < 8; i++) {
			this.shaper.map[i] = this.rng.get();
		}

		for (za = -0.5; za <= 0.5; za += stepZ) {
			zb = za + stepZ;
			txa = za + 0.5;
			txb = zb + 0.5;
			// ra and rb modulate the radius of the cylinder
			// square root provides a nice rounding effect
			// without sanding off all of the straight edges
			ra = Math.sqrt(this.shaper.get(txa));
			rb = Math.sqrt(this.shaper.get(txb));
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
				// across y, and we multiply by the radius to avoid the
				// effect of "squeezing" many vertexes into small areas;
				// apply 1-pixel offset to prevent an artifact when the
				// texture is mirrored across the model
				tya = Math.abs(ra * c) + offset;
				tyb = Math.abs(rb * c) + offset;
				mesh.set(xa, ya, za, txa, tya);
				mesh.set(xb, yb, zb, txb, tyb);
			}
		}
		mesh.build(true);
	},
	
	/**
		generate random skin texture
		
		@method makeSkin
		@return the texture object
	**/
	
	makeSkin: function() {
		var ctx = EASY.texture.context;
		var w = EASY.texture.canvas.width;
		var h = EASY.texture.canvas.height;
		var ww = w / 2;
		var hh = h / 2;
		var rng = this.rng;
		var r, g, b, base, coat;
		var i, x, y, s;

		ctx.clearRect(0, 0, w, h);
		r = Math.floor(rng.getn(256));
		g = Math.floor(rng.getn(256));
		b = Math.floor(rng.getn(256));
		base = "rgba(" + r + ", " + g + ", " + b + ", 0.01)";
		coat = "rgba(" + (256 - r) + ", " + (256 - g) + ", " + (256 - b) + ", 0.01)";

		ctx.fillStyle = base;
		ctx.fillRect(0, 0, w, h);
		
		ctx.fillStyle = coat;
		for (i = 0; i < 100; i++) {
			x = rng.getn(ww);
			y = rng.getn(h);
			s = rng.getn(8) + 8;
			ctx.beginPath();
			ctx.fillRect(x, y, s, s);
			ctx.strokeRect(x, y, s, s);
			x = w - x;
			ctx.fillRect(x - s, y, s, s);
			ctx.strokeRect(x - s, y, s, s);
		}

		return SOAR.texture.create(
			EASY.display, 
			ctx.getImageData(0, 0, w, h)
		);
	},
	
	/**
		update orientations and positions
		
		@method update
	**/

	update: function() {
		var scr = this.scratch;
		var dt = SOAR.interval * 0.001;
		var hf, hr, hl;
		var pdlr, c, o;
		var h, fy;
		var i, il;
		
		for (i = 0, il = this.list.length; i < il; i++) {
		
			pdlr = this.list[i];
		
			c = pdlr.center;
			o = pdlr.rotor.orientation;
			hf = EASY.chamber.getFloorHeight(c.x + o.front.x, c.z + o.front.z);
			hr = EASY.chamber.getFloorHeight(c.x + o.right.x, c.z + o.right.z);
			hl = EASY.chamber.getFloorHeight(c.x - o.right.x, c.z - o.right.z);

			pdlr.pathTimeout -= SOAR.interval;
			if (pdlr.pathTimeout <= 0) {
				pdlr.pathTimeout = 5000 + this.rng.getl() % 5000;
				pdlr.targetPitch = this.rng.get() - this.rng.get();
			}
	/*
			if (c.y - hf < 0.5) {
				pdlr.targetPitch = 0.5;
			}
			if (EASY.chamber.SEPARATION - hf - c.y < 0.5) {
				pdlr.targetPitch = -0.5;
			}
	*/	
	
	/*
			h = EASY.chamber.getFloorHeight(c.x, c.z);
			fy = -Math.pow((c.y - EASY.chamber.MAX_HEIGHT) / (EASY.chamber.MAX_HEIGHT - h), 3);

			this.rotor.turn(0, (o.front.y - fy - pdlr.targetPitch) * 0.01);
	*/
			if (hr < hf) {
				pdlr.rotor.turn(hf - hr, 0);
			}
			if (hl < hf) {
				pdlr.rotor.turn(hl - hf, 0);
			}

			scr.vel.copy(o.front).mul(pdlr.speed * dt);
			c.add(scr.vel);
		}
	},
	
	/**
		draw the paddlers
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var shader = this.shader;
		var camera = EASY.player.camera;
		var shader = this.shader;
		var pdlr, center, light, time;
		var i, il;

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		this.faceTexture.bind(0, shader.face);

		for (i = 0, il = this.list.length; i < il; i++) {
			pdlr = this.list[i];
			if (pdlr.active) {
				center = pdlr.center;
				time = SOAR.elapsedTime * 0.01;
				gl.uniformMatrix4fv(shader.rotations, false, pdlr.rotor.matrix.transpose);
				gl.uniform3f(shader.center, center.x, center.y, center.z);
				gl.uniform1f(shader.time, time);
				pdlr.skin.bind(1, shader.skin);
				pdlr.mesh.draw();
			}
		}
		
		gl.disable(gl.CULL_FACE);
		
	}

};

