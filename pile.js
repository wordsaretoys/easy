/**
	generate and display a pile

	represents a generic pile of *something* determined
	by type and texture assignment.
	
	@namespace EASY
	@class pile
**/

EASY.pile = {

	MESH_STEP: 0.05,
	
	scratch: {
		pos: SOAR.vector.create()
	},

	/**
		init objects and resources required by all piles
		and add them to the base object
		
		@method init
	**/

	init: function() {
		var pos = this.scratch.pos;
	
		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-pile"), SOAR.textOf("fs-pile"),
			["position", "texturec"], 
			["projector", "modelview", "center", "alpha"],
			["skin"]
		);
		
		this.bumps = SOAR.noise1D.create(1029192, 3 * this.MESH_STEP, 4, 2);
		
		pos.set(76, 0, 243);
		var o = EASY.pile.create("dirt", pos);
		EASY.models.add("dirtpile", o);

	},

	/**
		create a pile
		
		@method create
		@param skin name of image resource to use as texture skin
		@param center center position
		@return new pile object
	**/
	
	create: function(skin, center) {
		var o = Object.create(EASY.pile);

		o.skinName = skin;
		o.center = SOAR.vector.create().copy(center);
	
		return o;		
	},
	
	/**
		generate a model/skin for a pile
		
		call when the pile must be visible to the player
		
		@method generate
	**/
	
	generate: function() {
		this.makeModel();
		this.skin = SOAR.texture.create(
			EASY.display, 
			EASY.world.resources[this.skinName].data
		);
	},
	
	/**
		release all GL resources for this pile

		call once the pile is out of range of the player
		
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
		var rxa, rxb, rz;

		mesh = SOAR.mesh.create(EASY.display, EASY.display.gl.TRIANGLE_STRIP);
		mesh.add(this.shader.position, 3);
		mesh.add(this.shader.texturec, 2);

		for (x = -0.5; x < 0.49; x += xstep) {
			xa = oddrow ? x + xstep : x;
			xb = oddrow ? x : x + xstep;
			txa = xa + 0.5;
			txb = xb + 0.5;
			zstep = oddrow ? this.MESH_STEP : -this.MESH_STEP;
			rxa = xa + this.bumps.get(xa);
			rxb = xb + this.bumps.get(xb);
			for (z = oddrow ? -0.5 : 0.5; oddrow ? z < 0.5 : z > -0.5; z += zstep) {
				tz = z + 0.5;
				ya = this.scratch.pos.set(xa, 1, z).norm().y - 0.9;
				yb = this.scratch.pos.set(xb, 1, z).norm().y - 0.9;
				rz = z + this.bumps.get(z);
				mesh.set(rxa, ya, rz, txa, tz);
				mesh.set(rxb, yb, rz, txb, tz);
			}
			oddrow = !oddrow;
		}

		mesh.build();
		this.mesh = mesh;
	},
	
	/**
		setup for drawing all piles

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
	},
	
	/**
		draw the pile
		
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
		teardown after drawing all piles

		normally called from base object
		
		@method postdraw
	**/
	
	postdraw: function() {
		var gl = EASY.display.gl;
		gl.disable(gl.BLEND);
		gl.disable(gl.CULL_FACE);
	}
	
};

