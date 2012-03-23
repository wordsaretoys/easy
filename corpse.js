/**
	generate and display a corpse of sorts
	
	@namespace EASY
	@class corpse
**/

EASY.corpse = {

	RADIUS: 0.5,

	texture: {},
	position: SOAR.vector.create(),
	
	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var that = this;
		var temp = SOAR.vector.create();

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-trash"), SOAR.textOf("fs-trash"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center"],
			["sign"]
		);
		
		
		
		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		
		SOAR.subdivide(4, -1, -1, 1, 1, 
			function(x0, z0, x1, z1, x2, z2) {

				var y0 = temp.set(x0, 0.5, z0).norm().y - 0.5;
				var y1 = temp.set(x1, 0.5, z1).norm().y - 0.5;
				var y2 = temp.set(x2, 0.5, z2).norm().y - 0.5;
				
				that.mesh.set(x0, y0, z0, 0.5 * (x0 + 1), 0.5 * (z0 + 1));
				that.mesh.set(x1, y1, z1, 0.5 * (x1 + 1), 0.5 * (z1 + 1));
				that.mesh.set(x2, y2, z2, 0.5 * (x2 + 1), 0.5 * (z2 + 1));
			}
		);
		
		this.mesh.build();
	},

	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		this.texture.body = 
			SOAR.texture.create(EASY.display, EASY.resources["flesh"].data);
	},
	
	/**
		(re)generate corpse position
		
		@method generate
	**/
	
	generate: function() {
		p = EASY.cave.flat.pop();
		this.position.set(p.x, 0.01, p.z);
	},
	
	
	/**
		draw the corpse
		
		@method draw
	**/
	 
	draw: function() {
		var gl = EASY.display.gl;
		var shader = this.shader;
		var camera = EASY.player.camera;
		var pos = this.position;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		gl.uniformMatrix4fv(shader.rotations, false, EASY.I);
		gl.uniform3f(shader.center, pos.x, pos.y, pos.z);
		this.texture.body.bind(0, shader.sign);
		this.mesh.draw();

		gl.disable(gl.BLEND);
	}

};
