/**
	generate and display a bush

	a bush is a static model with procedurally-generated
	coloration and structure, used to represent a plant-
	based ingredient.	
	
	@namespace EASY
	@class bush
**/

EASY.bush = {

	MESH_STEP: 0.05,
	
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
			["position", "texturec"], 
			["projector", "modelview", "center", "alpha"],
			["skin"]
		);
		
		this.rng = SOAR.random.create();
		
		pos.set(76, 0, 243);
		var o = EASY.bush.create(123212, pos);
		EASY.models.add("bush", o);
	},
	
	/**
		create a bush
		
		@method create
		@param seed number to seed generation algorithms
		@param center center position
		@return new paddler object
	**/
	
	create: function(seed, center) {
		var o = Object.create(EASY.bush);

		o.seed = seed;
		o.center = SOAR.vector.create().copy(center);
	
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
		create a model mesh using a flat sheet base
		
		@method makeModel
	**/
	
	makeModel: function() {
		var oddrow = false;
		var xstep = this.MESH_STEP;
		var zstep;
		var xa, xb, ya, yb;
		var txa, txb, tz;
		var x, y, z;

		mesh = SOAR.mesh.create(EASY.display, EASY.display.gl.TRIANGLE_STRIP);
		mesh.add(this.shader.position, 3);
		mesh.add(this.shader.texturec, 2);

		for (x = -0.5; x < 0.49; x += xstep) {
			xa = oddrow ? x + xstep : x;
			xb = oddrow ? x : x + xstep;
			txa = xa + 0.5;
			txb = xb + 0.5;
			zstep = oddrow ? this.MESH_STEP : -this.MESH_STEP;
			for (z = oddrow ? -0.5 : 0.5; oddrow ? z < 0.5 : z > -0.5; z += zstep) {
				ya = this.scratch.pos.set(xa, 1, z).norm().y - 0.9;
				yb = this.scratch.pos.set(xb, 1, z).norm().y - 0.9;
				tz = z + 0.5;
				mesh.set(xa, ya, z, txa, tz);
				mesh.set(xb, yb, z, txb, tz);
			}
			oddrow = !oddrow;
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
		var palette = [];
		var r, g, b;
		var i, j;

//		rng.reseed(this.seed);
		ctx.clearRect(0, 0, w, h);
/*
		ctx.strokeStyle = "rgb(0, 0, 0)";
		ctx.lineWidth = 1;
		for (i = 0; i < 100; i++) {
			ctx.beginPath();
			ctx.moveTo(ww, hh);
			ctx.lineTo(rng.getn(w), rng.getn(h));
			ctx.stroke();
		}
*/
//		for (i = 0; i < 10; i++) {	
			r = Math.floor(rng.getn(256));
			g = Math.floor(rng.getn(256));
			b = Math.floor(rng.getn(256));
			ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", 0.05)";
			for (j = 0; j < 10000; j++) {
				ctx.fillRect(rng.getn(w), rng.getn(h), 16, 16);
			}
//		}
		
		this.skin = SOAR.texture.create(
			EASY.display, 
			ctx.getImageData(0, 0, w, h)
		);
	},
	
	/**
		static model, update is placeholder function
		
		@method update
	**/

	update: function() {
	},
	
	/**
		setup for drawing all bushes

		normally called from base object
		
		@method predraw
	**/
	
	predraw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;
		var shader = this.shader

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

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
		this.skin.bind(1, this.shader.skin);
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
		gl.disable(gl.CULL_FACE);
	}
	
};

