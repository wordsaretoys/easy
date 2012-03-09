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

	MAX_ACTIVE: 3,

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
				mesh: SOAR.mesh.create(EASY.display),
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
		var l = EASY.cave.LENGTH;
		var pdlr;
		var x, y, z;
		var i, il;

		for (i = 0, il = this.MAX_ACTIVE; i < il; i++) {
			pdlr = this.list[i];
		
			do {
				x = this.rng.getn(l);
				z = this.rng.getn(l);
				y = EASY.cave.getFloorHeight(x, z);
			} while(y > 0)
			
			this.makeModel(pdlr.mesh);
			if (pdlr.skin) {
				pdlr.skin.release();
			}
			pdlr.skin = this.makeSkin();
			
			pdlr.center.set(x, -2, z);
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
		
		// draw mouth
		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(0, h - 10, w, 10);
		// draw eye spot (duplicated by mirroring)
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.beginPath();
		ctx.arc(20, h - 20, 5, 0, SOAR.PIMUL2, false);
		ctx.fill();
		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.beginPath();
		ctx.arc(20, h - 20, 4, 0, SOAR.PIMUL2, false);
		ctx.fill();
	
		this.faceTexture = SOAR.texture.create(
			EASY.display, 
			ctx.getImageData(0, 0, w, h)
		);
	},
	
	/**
		generate a paddler model mesh
		
		@method makeModel
		@param mesh the mesh object to use
	**/

	makeModel: function(mesh) {
	
		var that = this;
		var r;
	
		mesh.reset();
		
		for (i = 2; i < 8; i++) {
			r = this.rng.get();
			r = r < 0.1 ? 0.1 + r : r;
			this.shaper.map[i] = r;
		}
	
		SOAR.subdivide(5, -0.5, -0.5, 0.5, 0.5, 
			function(x0, z0, x1, z1, x2, z2) {
				var y0, y1, y2;
				var tz0, tz1, tz2;
				var r0, r1, r2;
			
				tz0 = z0 + 0.5;
				tz1 = z1 + 0.5;
				tz2 = z2 + 0.5;
				
				r0 = Math.sqrt(that.shaper.get(tz0));
				r1 = Math.sqrt(that.shaper.get(tz1));
				r2 = Math.sqrt(that.shaper.get(tz2));
				
				y0 = 0.25 * r0 * Math.pow(Math.cos(x0 * Math.PI), 4);
				y1 = 0.25 * r1 * Math.pow(Math.cos(x1 * Math.PI), 4);
				y2 = 0.25 * r2 * Math.pow(Math.cos(x2 * Math.PI), 4);
				
				x0 = 1.5 * x0 * r0;
				x1 = 1.5 * x1 * r1;
				x2 = 1.5 * x2 * r2;
				
				mesh.set(x0, y0, z0, Math.abs(x0), tz0);
				mesh.set(x1, y1, z1, Math.abs(x1), tz1);
				mesh.set(x2, y2, z2, Math.abs(x2), tz2);

				mesh.set(x0, -y0, z0, Math.abs(x0), tz0);
				mesh.set(x2, -y2, z2, Math.abs(x2), tz2);
				mesh.set(x1, -y1, z1, Math.abs(x1), tz1);
			}
		);
	
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
		var hw = w * 0.5;
		var hh = h * 0.5;
		var rng = this.rng;
		var r, g, b, base, coat;
		var i, x, y, s, hs;

		ctx.clearRect(0, 0, w, h);
		r = Math.floor(rng.getn(256));
		g = Math.floor(rng.getn(256));
		b = Math.floor(rng.getn(256));
		base = "rgba(" + r + ", " + g + ", " + b + ", 0.01)";
		coat = "rgba(" + (256 - r) + ", " + (256 - g) + ", " + (256 - b) + ", 0.01)";

		ctx.fillStyle = base;
		ctx.fillRect(0, 0, w, h);
		
		ctx.fillStyle = coat;
		for (i = 0; i < 150; i++) {
			s = rng.getn(8) + 8;
			x = rng.getn(hw);
			y = rng.getn(h);
			ctx.fillRect(x, y, s, s);
			ctx.strokeRect(x, y, s, s);
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
		var hf, hr, hl, hc;
		var pdlr, c, o;
		var i, il;

		if (EASY.world.stopModels)
			return;

		for (i = 0, il = this.list.length; i < il; i++) {
		
			pdlr = this.list[i];
		
			c = pdlr.center;
			o = pdlr.rotor.orientation;
			hf = EASY.cave.getFloorHeight(c.x + o.front.x, c.z + o.front.z);
			hr = EASY.cave.getFloorHeight(c.x + o.right.x, c.z + o.right.z);
			hl = EASY.cave.getFloorHeight(c.x - o.right.x, c.z - o.right.z);
			hc = EASY.cave.getCeilingHeight(c.x + o.front.x, c.z + o.front.z);

			pdlr.pathTimeout -= SOAR.interval;
			if (pdlr.pathTimeout <= 0) {
				pdlr.pathTimeout = 5000 + this.rng.getl() % 5000;
				pdlr.targetPitch = this.rng.get() - this.rng.get();
			}
	
			if (c.y + o.front.y >= hc) {
				pdlr.targetPitch -= 0.1;
			}
			if (c.y + o.front.y <= hf) {
				pdlr.targetPitch += 0.1;
			}
	
			pdlr.rotor.turn(0, (o.front.y - pdlr.targetPitch) * 0.01);
	
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

