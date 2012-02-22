/**
	generate, animate, and display a paddler
	
	paddlers are procedurally-generated creatures with
	bilateral symmetry. flaps of tissue that look like
	tentacles or wings extend from cylindrical bodies.
	continuous paddling motions of these flaps permits
	them to swim.
	
	@namespace EASY
	@class paddler
**/

EASY.paddler = {

	TOTAL_COUNT: 100,
	EXTRUDE_STEPS: 24,

	scratch: {
		vel: SOAR.vector.create()
	},
	
	/**
		init objects and resources required by all paddlers
		and add them to the base object
		
		@method init
	**/

	init: function() {
		var rng = SOAR.random.create(302921);
		var pos = SOAR.vector.create();
		var bound = EASY.world.boundary;
		var i, il, o;
	
		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-paddler"), SOAR.textOf("fs-paddler"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", 
				"center", "time", "light", "alpha"],
			["face", "skin"]
		);
		
		this.rng = SOAR.random.create();
		
		this.makeFace();

		for (i = 0, il = this.TOTAL_COUNT; i < il; i++) {
			do {
				pos.x = rng.getn(bound.x);
				pos.z = rng.getn(bound.z);
			} while(EASY.cave.getHeight(pos.x, pos.z) > 1)
			pos.y = rng.getn(5) + 1;
//			pos.y = 1;
			o = EASY.paddler.create(rng.getl(), pos);
			EASY.models.add("paddler", o);
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
		var ctx = EASY.models.context;
		var w = EASY.models.canvas.width;
		var h = EASY.models.canvas.height;
		
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
		create a paddler
		
		@method create
		@param seed number to seed generation algorithms
		@param start starting position for paddler
		@return new paddler object
	**/
	
	create: function(seed, start) {
		var o = Object.create(EASY.paddler);

		o.seed = seed;
		o.center = SOAR.vector.create().copy(start);
	
		o.shaper = SOAR.noise1D.create(seed, 0.5, 8, 8);
		o.shaper.interpolate = SOAR.interpolator.linear;
		o.shaper.map[0] = 0;
		o.shaper.map[1] = 0.25;

		o.rotor = SOAR.boundRotor.create();
		
		o.speed = 1;
		o.pathTimeout = 0;
		o.targetPitch = -0.5;
		
		return o;		
	},
	
	/**
		generate a model/skin for a paddler
		
		call when the paddler must be visible to the player
		
		@method generate
	**/
	
	generate: function() {
		this.makeModel();
		this.makeSkin();
	},
	
	/**
		release all GL resources for this paddler

		call once the paddler is out of range of the player
		
		@method release
	**/
	
	release: function() {
		this.mesh.release();
		this.skin.release();
		delete this.mesh;
		delete this.skin;
	},

	/**
		create a model mesh using a cylindrical base
		
		@method makeModel
	**/
	
	makeModel: function() {
		var stepZ = 1 / this.EXTRUDE_STEPS;
		var stepAngle = SOAR.PIMUL2 / this.EXTRUDE_STEPS;
		var offset = 1 / EASY.models.canvas.height;
		var mesh;
		var xa, xb, ya, yb, za, zb;
		var txa, txb, tya, tyb;
		var angle, s, c;
		var ra, rb, e;

		mesh = SOAR.mesh.create(EASY.display, EASY.display.gl.TRIANGLE_STRIP);
		mesh.add(this.shader.position, 3);
		mesh.add(this.shader.texturec, 2);

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
		mesh.build();
		this.mesh = mesh;
	},
	
	/**
		generate random skin texture
		
		@method makeSkin
	**/
	
	makeSkin: function() {
		var ctx = EASY.models.context;
		var w = EASY.models.canvas.width;
		var h = EASY.models.canvas.height;
		var ww = w / 2;
		var hh = h / 2;
		var rng = this.rng;
		var r, g, b, base, coat;
		var i, x, y, s;

		rng.reseed(this.seed);

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

		this.skin = SOAR.texture.create(
			EASY.display, 
			ctx.getImageData(0, 0, w, h)
		);
	},
	
	/**
		update orientation and position
		
		@method update
	**/

	update: function() {
		var scr = this.scratch;
		var dt = SOAR.interval * 0.001;
		var c = this.center;
		var o = this.rotor.orientation;
		var hf = EASY.cave.getHeight(c.x + o.front.x, c.z + o.front.z);
		var hr = EASY.cave.getHeight(c.x + o.right.x, c.z + o.right.z);
		var hl = EASY.cave.getHeight(c.x - o.right.x, c.z - o.right.z);

		this.pathTimeout -= SOAR.interval;
		if (this.pathTimeout <= 0) {
			this.pathTimeout = 5000 + this.rng.getl() % 5000;
			this.targetPitch = this.rng.get() - this.rng.get();
		}
/*
		if (c.y - hf < 0.5) {
			this.targetPitch = 0.5;
		}
		if (EASY.cave.SEPARATION - hf - c.y < 0.5) {
			this.targetPitch = -0.5;
		}
*/	
		var h = EASY.cave.getHeight(c.x, c.z);
		var fy = -Math.pow((c.y - EASY.cave.MAX_HEIGHT) / (EASY.cave.MAX_HEIGHT - h), 3);

		this.rotor.turn(0, (o.front.y - fy - this.targetPitch) * 0.01);

		if (hr < hf) {
			this.rotor.turn(hf - hr, 0);
		}
		if (hl < hf) {
			this.rotor.turn(hl - hf, 0);
		}

		scr.vel.copy(o.front).mul(this.speed * dt);
		c.add(scr.vel);
	},
	
	/**
		setup for drawing all paddlers

		normally called from base object
		
		@method predraw
	**/
	
	predraw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;
		var shader = this.shader;

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		this.faceTexture.bind(0, shader.face);
	},
	
	/**
		draw the paddler
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var shader = this.shader;
		var center, light, time;
	
		center = this.center;
		time = SOAR.elapsedTime * 0.01;
		light = EASY.cave.lights.get(center.x, center.z);
		gl.uniformMatrix4fv(shader.rotations, false, this.rotor.matrix.transpose);
		gl.uniform3f(shader.center, center.x, center.y, center.z);
		gl.uniform1f(shader.time, time);
		gl.uniform1f(shader.light, light);
		this.skin.bind(1, shader.skin);
		this.mesh.draw();
	},

	/**
		teardown after drawing all paddlers

		normally called from base object
		
		@method postdraw
	**/
	
	postdraw: function() {
		var gl = EASY.display.gl;
		gl.disable(gl.BLEND);
		gl.disable(gl.CULL_FACE);
	}
	
};

