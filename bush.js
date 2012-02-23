/**
	generate and display a bush

	a bush is a static model with procedurally-generated
	coloration and structure, used to represent a plant-
	based ingredient.	
	
	@namespace EASY
	@class bush
**/

EASY.bush = {

	PALETTE_SIZE: 8,

	scratch: {
		pos: SOAR.vector.create()
	},

	/**
		init objects and resources required by all bushes
		and add them to the base object
		
		@method init
	**/

	init: function() {
		var pos = SOAR.vector.create();
	
		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-bush"), SOAR.textOf("fs-bush"),
			["position", "a_color"], 
			["projector", "modelview", "center", "alpha"],
			["palette"]
		);
		
		this.rng = SOAR.random.create();
		var o, rng = this.rng;
		var bound = EASY.world.boundary;
		
//		pos.set(76, 0, 243);
//		var o = EASY.bush.create(92223, pos);
//		EASY.models.add("bush", o);
		
		for (i = 0, il = 1000; i < il; i++) {
			do {
				pos.x = rng.getn(bound.x);
				pos.z = rng.getn(bound.z);
			} while(EASY.cave.getHeight(pos.x, pos.z) > 0.1)
			pos.y = 0;
			o = EASY.bush.create(rng.getl(), pos);
			EASY.models.add("bush", o);
		}
		
	},
	
	/**
		create a bush
		
		@method create
		@param seed number to seed generation algorithms
		@param center center position
		@return new bush object
	**/
	
	create: function(seed, center) {
		var o = Object.create(EASY.bush);

		o.seed = seed;
		o.center = SOAR.vector.create().copy(center);
	
		return o;		
	},
	
	/**
		generate a model/palette for a bush
		
		call when the bush must be visible to the player
		
		@method generate
	**/
	
	generate: function() {
		this.makeModel();
		this.makePalette();
	},
	
	/**
		release all GL resources for this bush

		call once the bush is out of range of the player
		
		@method release
	**/
	
	release: function() {
		this.mesh.release();
		this.palette.release();
		delete this.mesh;
		delete this.palette;
	},

	/**
		create a model mesh using a random walk
		
		@method makeModel
	**/
	
	makeModel: function() {
		var rng = this.rng;
		var angle, sina, cosa;
		var rx, rz;
		var x, y, z, c;
		var i, j, k;
		
		var fold = 11;
		var reps = 250;

		mesh = SOAR.mesh.create(EASY.display);
		mesh.add(this.shader.position, 3);
		mesh.add(this.shader.a_color, 1);

		for (i = 0; i < fold; i++) {
		
			angle = SOAR.PIMUL2 * i / fold;
			sina = Math.sin(angle);
			cosa = Math.cos(angle);
			rng.reseed(this.seed);
			x = y = z = 0;
			for (j = 0; j < reps; j++) {
				c = this.PALETTE_SIZE * rng.get();
				for (k = 0; k < 3; k++) {
					x += 0.05 * (rng.get() - 0.5);
					y += 0.05 * (rng.get() - 0.5);
					z += 0.05 * (rng.get() - 0.5);
					rx = x * cosa - z * sina;
					rz = x * sina + z * cosa;
					mesh.set(rx, y, rz, c);
					x = Math.min(1, Math.max(x, -1));
					y = Math.min(1, Math.max(y, 0));
					z = Math.min(1, Math.max(z, -1));
				}
			}
		}
		mesh.build();
		this.mesh = mesh;
	},
	
	/**
		generate random palette as texture
		
		@method makePalette
	**/
	
	makePalette: function() {
		var ctx = EASY.models.context;
		var rng = this.rng;
		var palette;
		var r, g, b;
		var i, il;

//		rng.reseed(this.seed);
		ctx.clearRect(0, 0, 1, this.PALETTE_SIZE);

		palette = ctx.createImageData(1, this.PALETTE_SIZE);
		for (i = 0, il = this.PALETTE_SIZE * 4; i < il; i += 4) {
			palette.data[i    ] = Math.floor(rng.getn(256));
			palette.data[i + 1] = Math.floor(rng.getn(256));
			palette.data[i + 2] = Math.floor(rng.getn(256));
			palette.data[i + 3] = 255;
		}
		this.palette = SOAR.texture.create(EASY.display, palette);
	},
	
	/**
		setup for drawing all bushes

		normally called from base object
		
		@method predraw
	**/
	
	predraw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;
		var shader = this.shader;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
	},
	
	/**
		draw the bush
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var center = this.center;
	
		gl.uniform3f(this.shader.center, center.x, center.y, center.z);
		this.palette.bind(0, this.shader.palette);
		this.mesh.draw();
	},

	/**
		teardown after drawing all bushes

		normally called from base object
		
		@method postdraw
	**/
	
	postdraw: function() {
		var gl = EASY.display.gl;
		gl.disable(gl.BLEND);
	}
	
};

