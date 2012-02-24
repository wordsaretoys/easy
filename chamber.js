/**
	generates and displays a cave chamber 
	
	@namespace EASY
	@class chamber
**/

EASY.chamber = {

	CANVAS_SIZE: 64,

	RADIUS: 32,
	MAX_HEIGHT: 4,
	SEPARATION: 3,

	/**
		create data objects, meshes, and shader programs
		
		@method init
	**/
	
	init: function() {

		this.canvas = document.createElement("canvas");
		this.canvas.width = this.CANVAS_SIZE;
		this.canvas.height = this.CANVAS_SIZE;
		this.context = this.canvas.getContext("2d");
	
		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-cave"), 
			SOAR.textOf("fs-cave-texture") + SOAR.textOf("fs-cave"),
			["position", "texturec", "a_light"], 
			["projector", "modelview"],
			["noise", "leaf"]
		);

		var s = this.CANVAS_SIZE;
		this.context.fillStyle = "rgb(0, 0, 0)";
		this.context.fillRect(0, 0, s, s);
		this.context.fillStyle = "rgb(255, 2, 0)";
		this.context.beginPath();
		this.context.arc(32, 32, 8, 0, SOAR.PIMUL2, false);
		this.context.fill();
		this.context.strokeStyle = "rgb(255, 8, 0)";
		this.context.lineWidth = 4;
		this.context.beginPath();
		this.context.moveTo(32, 32);
		this.context.lineTo(0, 0);
		this.context.moveTo(32, 32);
		this.context.lineTo(0, s);
		this.context.moveTo(18, 18);
		this.context.lineTo(6, s - 6);
		this.context.stroke();
		this.context.fillStyle = "rgb(0, 0, 0)";
		this.context.fillRect(31, 31, 3, 3);
		
		var lights = SOAR.noise2D.create(1294934, 1, 8, 0.2);
		var height = SOAR.noise2D.create(82644, this.MAX_HEIGHT, s, s / (this.RADIUS * 2));

		height.import(this.context.getImageData(0, 0, s, s));

		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		this.mesh.add(this.shader.a_light, 1);

		var that = this;
		this.getHeight = function(x, z) {
			return -height.get(x, z);
		};

		this.generateDisc(7, function(x0, z0, x1, z1, x2, z2) {
			var mx0, my0, mz0;
			var mx1, my1, mz1;
			var mx2, my2, mz2;
			
			mx0 = that.RADIUS * (x0 + 1);
			mz0 = that.RADIUS * (z0 + 1);
			my0 = height.get(mx0, mz0);
			mx1 = that.RADIUS * (x1 + 1);
			mz1 = that.RADIUS * (z1 + 1);
			my1 = height.get(mx1, mz1);
			mx2 = that.RADIUS * (x2 + 1);
			mz2 = that.RADIUS * (z2 + 1);
			my2 = height.get(mx2, mz2);
			
			if (!(my0 === 0 && my1 === 0 && my2 === 0)) {

				that.mesh.set(mx0, -my0, mz0, mx0, mz0, lights.get(mx0, mz0));
				that.mesh.set(mx2, -my2, mz2, mx2, mz2, lights.get(mx2, mz2));
				that.mesh.set(mx1, -my1, mz1, mx1, mz1, lights.get(mx1, mz1));

				that.mesh.set(mx0, my0 - that.SEPARATION, mz0, mx0, mz0, lights.get(mx0, mz0));
				that.mesh.set(mx1, my1 - that.SEPARATION, mz1, mx1, mz1, lights.get(mx1, mz1));
				that.mesh.set(mx2, my2 - that.SEPARATION, mz2, mx2, mz2, lights.get(mx2, mz2));
			}
		});
		
		this.mesh.build();
		this.lights = lights;
	},
	
	/**
		generates a mesh of triangles within a 2D unit circle.
		
		useful for generating heightmaps.
		
		@method generateDisc
		@param detail number of triangle subdivisions to generate
		@param callback function to call for each vertex
	**/
	
	generateDisc: function(detail, callback) {
		
		function recurse(level, x0, y0, x1, y1, x2, y2) {
		
			var x3, y3;
			var x4, y4;
			var x5, y5;
			var xc, yc;
			
			if (0 === level) {
				xc = (x0 + x1 + x2) / 3;
				yc = (y0 + y1 + y2) / 3;
				if (xc * xc + yc * yc <= 1) {
					callback(x0, y0, x1, y1, x2, y2);
				}
			} else {
				x3 = (x0 + x1) * 0.5;
				y3 = (y0 + y1) * 0.5;
				x4 = (x2 + x1) * 0.5;
				y4 = (y2 + y1) * 0.5;
				x5 = (x0 + x2) * 0.5;
				y5 = (y0 + y2) * 0.5;
				level--;
				recurse(level, x0, y0, x3, y3, x5, y5);
				recurse(level, x3, y3, x1, y1, x4, y4);
				recurse(level, x5, y5, x4, y4, x2, y2);
				recurse(level, x4, y4, x5, y5, x3, y3);
			}
		}
		
		recurse(detail, 2, 0, -1, 1.732, -1, -1.732);
	},
	
	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		var display = EASY.display;
		var resources = EASY.world.resources;
		var bound = EASY.world.boundary;
		
		this.noise1Texture = 
			SOAR.texture.create(display, resources["noise1"].data);
		this.noise2Texture = 
			SOAR.texture.create(display, resources["noise2"].data);
		this.leafTexture = 
			SOAR.texture.create(display, resources["leaf"].data);
	},
	
	/**
		draw cave environment
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
		var camera = EASY.player.camera;

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		this.shader.activate();
		gl.uniformMatrix4fv(this.shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(this.shader.modelview, false, camera.modelview());
		this.noise1Texture.bind(0, this.shader.noise);
		this.leafTexture.bind(1, this.shader.leaf);
		this.mesh.draw();

		gl.disable(gl.CULL_FACE);
	},
	
	/**
		release all GL resources
		
		@method release
	**/
	
	release: function() {
		this.mesh.release();
		this.noise1Texture.release();
		this.noise2Texture.release();
		this.leafTexture.release();
	}

};
