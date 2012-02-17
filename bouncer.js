/**
	generate, animate, and display a bouncer
	
	paddlers are procedurally-generated creatures with
	spherical bodies. tissue rolls around their center
	allow them to bounce across the ground.
	
	@namespace EASY
	@class bouncer
**/

EASY.bouncer = {

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
		var display = EASY.display;
		
		this.skinShader = SOAR.shader.create(
			display,
			SOAR.textOf("vs-paddler"), SOAR.textOf("fs-paddler"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", 
				"center", "time", "light", "alpha"],
			["face", "skin"]
		);
		
		this.faceTexture = SOAR.texture.create(display, this.makeFace());
	},
	
	/**
		generate a face texture
		
		@method makeFace
		@return pixel array representing texture
	**/
	
	makeFace: function() {
		var ctx = EASY.npcs.context;
		var w = EASY.npcs.canvas.width;
		var h = EASY.npcs.canvas.height;
		
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
		create a paddler
		
		@method create
		@param seed number to seed generation algorithms
		@param start starting position for paddler
		@return new paddler object
	**/
	
	create: function(seed, start) {
		var o = Object.create(EASY.paddler);

		o.type = "paddler";	
		o.seed = seed;
		o.center = SOAR.vector.create().copy(start);
	
		o.shaper = SOAR.noise1D.create(seed, 0.5, 8, 8);
		o.shaper.interpolate = SOAR.interpolator.linear;
		o.shaper.map[0] = 0;
		o.shaper.map[1] = 0.25;

		o.rotor = SOAR.boundRotor.create();
		
		o.speed = 1;
		
		return o;		
	},
	
	/**
		generate a model/skin for a paddler
		
		call when the paddler must be visible to the player
		
		@method generate
	**/
	
	generate: function() {
		var display = EASY.display;
		
		// create new mesh
		this.mesh = SOAR.mesh.create(display, display.gl.TRIANGLE_STRIP);
		this.mesh.add(this.skinShader.position, 3);
		this.mesh.add(this.skinShader.texturec, 2);

		// generate the mesh data
		this.makeModel(this.mesh, this.shaper);
		
		// generate a skin
		this.skin = SOAR.texture.create(display, this.makeSkin(this.seed));
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
		@param m the mesh to append vertexes to
		@param f the noise function to use as a silhouete model
	**/
	
	makeModel: function(m, f) {
		var stepZ = 1 / this.EXTRUDE_STEPS;
		var stepAngle = SOAR.PIMUL2 / this.EXTRUDE_STEPS;
		var offset = 1 / EASY.npcs.canvas.height;
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
				// apply 1-pixel offset to prevent an artifact when the
				// texture is mirrored across the model
				tya = Math.abs(ra * c) + offset;
				tyb = Math.abs(rb * c) + offset;
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
		var ctx = EASY.npcs.context;
		var w = EASY.npcs.canvas.width;
		var h = EASY.npcs.canvas.height;
		var hh = h / 2;
		var rng = SOAR.random.create(seed);
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
		for (i = 0; i < 250; i++) {
			x = rng.getn(w);
			y = rng.getm(hh) + hh;
			s = rng.getn(8) + 8;
			ctx.fillRect(x, y, s, s);
			ctx.strokeRect(x, y, s, s);
		}

		return ctx.getImageData(0, 0, w, h);
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
		var hf = EASY.cave.getLowerHeight(c.x + o.front.x, c.z + o.front.z);
		var hr = EASY.cave.getLowerHeight(c.x + o.right.x, c.z + o.right.z);
		var hl = EASY.cave.getLowerHeight(c.x - o.right.x, c.z - o.right.z);

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

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		this.skinShader.activate();
		gl.uniformMatrix4fv(this.skinShader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.skinShader.modelview, false, camera.modelview());
		this.faceTexture.bind(0, this.skinShader.face);
	},
	
	/**
		draw the paddler
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var dist, light, time;
	
		c = this.center;
		time = SOAR.elapsedTime * 0.01;
		light = EASY.cave.lights.get(c.x, c.z);
		gl.uniformMatrix4fv(this.skinShader.rotations, false, this.rotor.matrix.transpose);
		gl.uniform3f(this.skinShader.center, c.x, c.y, c.z);
		gl.uniform1f(this.skinShader.time, time);
		gl.uniform1f(this.skinShader.alpha, 1);
		gl.uniform1f(this.skinShader.light, light);
		this.skin.bind(1, this.skinShader.skin);
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

