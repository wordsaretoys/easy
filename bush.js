/**
	generate and display bushes

	a bush is a static model with procedurally-generated
	coloration and structure, used to represent a plant-
	based ingredient.	
	
	@namespace EASY
	@class bush
**/

EASY.bush = {

	MASTER_PALETTE: 256,
	MODEL_PALETTE: 3,

	scratch: {
		pos: SOAR.vector.create()
	},

	/**
		init objects and resources required by all bushes
		and add them to the base object
		
		@method init
	**/

	init: function() {
		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-bush"), SOAR.textOf("fs-bush"),
			["position", "a_color"], 
			["projector", "modelview"],
			["palette"]
		);
		
		this.rng = SOAR.random.create();

		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.a_color, 1);
		
		var i, il;
		EASY.models.context.clearRect(0, 0, 1, this.MASTER_PALETTE);
		palette = EASY.models.context.createImageData(1, this.MASTER_PALETTE);
		for (i = 0, il = this.MASTER_PALETTE * 4; i < il; i += 4) {
			palette.data[i    ] = Math.floor(this.rng.getn(256));
			palette.data[i + 1] = Math.floor(this.rng.getn(256));
			palette.data[i + 2] = Math.floor(this.rng.getn(256));
			palette.data[i + 3] = 255;
		}
		this.palette = SOAR.texture.create(EASY.display, palette);

		var pos = SOAR.vector.create();
/*		
		for (i = 0, il = 1; i < il; i++) {
			do {
				pos.x = this.rng.getn(EASY.chamber.RADIUS * 2);
				pos.z = this.rng.getn(EASY.chamber.RADIUS * 2);
			} while(EASY.chamber.getFloorHeight(pos.x, pos.z) > -3)
			pos.y = EASY.chamber.getFloorHeight(pos.x, pos.z);
			this.generate(this.rng.getl(), pos);
		}
*/		
//		this.generate(this.rng.getl(), {x: 33, y: -3.3, z: 12});

		this.mesh.build();
	},
	
	/**
		add a bush to the mesh
		
		@method generate
		@param seed random seed to init generator
		@param start position to start generator
	**/
	
	generate: function(seed, start) {
		var rng = this.rng;
		var mesh = this.mesh;
		var angle, sina, cosa;
		var rx, rz;
		var x, y, z, c;
		var i, j, k;
		
		var fold = 11;
		var reps = 250;
		
		var palette = [];
		for (i = 0; i < this.MODEL_PALETTE; i++) {
			palette[i] = rng.get();
		}

		for (i = 0; i < fold; i++) {
		
			angle = SOAR.PIMUL2 * i / fold;
			sina = Math.sin(angle);
			cosa = Math.cos(angle);
			x = y = z = 0;
			rng.reseed(seed);

			for (j = 0; j < reps; j++) {
				c = palette[Math.floor(rng.getn(this.MODEL_PALETTE))];
				for (k = 0; k < 3; k++) {
					x += 0.05 * (rng.get() - 0.5);
					y += 0.05 * (rng.get() - 0.5);
					z += 0.05 * (rng.get() - 0.5);
					rx = x * cosa - z * sina;
					rz = x * sina + z * cosa;
					mesh.set(rx + start.x, y + start.y, rz + start.z, c);
					x = Math.min(1, Math.max(x, 0));
					y = Math.min(1, Math.max(y, 0));
					z = Math.min(1, Math.max(z, 0));
				}
			}
		}
	},
	
	/**
		draw the bushes mesh
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var center = this.center;
		var shader = this.shader;
		var camera = EASY.player.camera;
	
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		this.palette.bind(0, shader.palette);
		this.mesh.draw();
		
		gl.disable(gl.BLEND);
	},

	/**
		release all GL resources for this bush

		@method release
	**/
	
	release: function() {
		this.mesh.release();
		this.palette.release();
		delete this.mesh;
		delete this.palette;
	}
	
};

