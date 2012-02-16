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
	
	CREATE_RADIUS: 30,
	DELETE_RADIUS: 35,

	VIEW_RADIUS: 25,
	FADE_RADIUS: 5,

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
			["projector", "modelview", "rotations", 
				"center", "time", "light", "alpha"],
			["face", "skin"]
		);

		this.masterSeed = SOAR.random.create();
		
		this.faceTexture = SOAR.texture.create(display, this.makeFace());
		
		// TEST TEST TEST
		var i;
		var rng = SOAR.random.create();
		var pos = SOAR.vector.create();
		var bound = EASY.world.boundary;
		for (i = 0; i < 250; i++) {
			do {
				pos.x = rng.getn(bound.x);
				pos.z = rng.getn(bound.z);
			} while(EASY.cave.getLowerHeight(pos.x, pos.z) > 1)
//			pos.y = rng.getn(10) + 1;
			pos.y = 1;
			this.add(pos);
		}
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
		add a new paddler record to the main list
		
		generate random seeds for model and skin.
		
		@method add
		@param start starting position for paddler
	**/
	
	add: function(start) {
		shaper = SOAR.noise1D.create(this.masterSeed.getl(), 0.5, 8, 8);
		shaper.interpolate = SOAR.interpolator.linear;
		shaper.map[0] = 0;
		shaper.map[1] = 0.25;
		
		this.list.push({
			shaper: shaper,
			skinSeed: this.masterSeed.getl(),
			center: SOAR.vector.create().copy(start),
			rotor: SOAR.boundRotor.create(),
			speed: 1
		});
	},
	
	/**
		generate a model/skin for a paddler
		
		call when the paddler must be visible to the player
		
		@method generate
		@param record the paddler record from the main list
	**/
	
	generate: function(record) {
		var display = EASY.display;
		
		// create new mesh
		record.mesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		record.mesh.add(this.skinShader.position, 3);
		record.mesh.add(this.skinShader.texturec, 2);

		// generate the mesh data
		this.makeModel(record.mesh, record.shaper);
		
		// generate a skin
		record.skin = SOAR.texture.create(display, 
			this.makeSkin(record.skinSeed));
	},
	
	/**
		release all GL resources for a paddler

		call once the paddler is out of range of the player
		
		@method release
		@param record the paddler record from the main list
	**/
	
	release: function(record) {
		record.mesh.release();
		record.skin.release();
		delete record.mesh;
		delete record.skin;
	},

	/**
		create a model mesh using a cylindrical base
		
		@method makeModel
		@param m the mesh to append vertexes to
		@param f the noise function to use as a silhouete model
	**/
	
	makeModel: function(m, f) {
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
	
	makeSkin: function(seed) {
		var ctx = this.context;
		var w = this.TEXTURE_WIDTH;
		var h = this.TEXTURE_HEIGHT;
		var hh = h / 2;
		var rng = SOAR.random.create(seed);
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
		for (i = 0; i < 100; i++) {
			x = rng.getn(w);
			y = rng.getm(hh) + hh;
			s = rng.getn(8) + 4;
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
		var camera = EASY.player.camera;
		var dt = SOAR.interval * 0.001;
		var i, paddler, o, c, d;
		var d;
		var hf, hr, hl;
		
		for (i = 0, il = this.list.length; i < il; i++) {
			paddler = this.list[i];
			c = paddler.center;
			d = c.distance(camera.position);
			if (d <= this.VIEW_RADIUS) {
				o = paddler.rotor.orientation;
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
		}
	},
	
	/**
		draw all paddlers visible to player
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;
		var i, il, paddler, c, d;
		var alpha, light, time;
		var active;
	
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		this.skinShader.activate();
		gl.uniformMatrix4fv(this.skinShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.skinShader.modelview, false, camera.modelview());
		this.faceTexture.bind(0, this.skinShader.skin);
		active = 0;
		for (i = 0, il = this.list.length; i < il; i++) {
			paddler = this.list[i];
			c = paddler.center;
			d = c.distance(camera.position);
			if (d <= this.CREATE_RADIUS && !paddler.mesh) {
				this.generate(paddler);
			}
			if (d > this.DELETE_RADIUS && paddler.mesh) {
				this.release(paddler);
			}
			if (d < this.VIEW_RADIUS) {
				active++;
				time = SOAR.elapsedTime * 0.01;
				alpha = SOAR.clamp((this.VIEW_RADIUS - d) / this.FADE_RADIUS, 0, 1);
				light = EASY.cave.lights.get(c.x, c.z);
				gl.uniformMatrix4fv(this.skinShader.rotations, false, 
					paddler.rotor.matrix.transpose);
				gl.uniform3f(this.skinShader.center, c.x, c.y, c.z);
				gl.uniform1f(this.skinShader.time, time);
				gl.uniform1f(this.skinShader.alpha, alpha);
				gl.uniform1f(this.skinShader.light, light);
				paddler.skin.bind(1, this.skinShader.skin);
				paddler.mesh.draw();
			}
		}
		EASY.debug("active: " + active + "/" + il);
		gl.disable(gl.BLEND);
		gl.disable(gl.CULL_FACE);
	}

};
