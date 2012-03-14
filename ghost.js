/**
	generate and display a ghost
	
	@namespace EASY
	@class ghost
**/

EASY.ghost = {

	NOMINAL_SPEED: 2,

	rotor: SOAR.freeRotor.create(),
	center: SOAR.vector.create(),
	seeking: SOAR.vector.create(),
	down: SOAR.vector.create(),

	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var cntx = EASY.texture.context;
		var w = EASY.texture.canvas.width;
		var h = EASY.texture.canvas.height;
		var that = this;

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-trash"), SOAR.textOf("fs-trash"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center"],
			["sign"]
		);
		
		this.rng = SOAR.random.create();

		cntx.font = "48pt Arial";
		cntx.textAlign = "center";
		cntx.textBaseline = "middle";
		cntx.strokeStyle = "rgba(255, 255, 255, 1)";
		cntx.fillStyle = "rgba(255, 255, 255, 1)";
		cntx.lineWidth = 3;

		cntx.clearRect(0, 0, w, h);
		cntx.beginPath();
		cntx.arc(w / 2, h / 2, 127, 0, SOAR.PIMUL2, false);
		cntx.stroke();
		cntx.fillText("ghost", w / 2, h / 2);

		this.mesh = SOAR.mesh.create(EASY.display);
		this.sign = SOAR.texture.create(EASY.display, cntx.getImageData(0, 0, w, h));
			
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		
		SOAR.subdivide(0, -0.5, -0.5, 0.5, 0.5, 
			function(x0, y0, x1, y1, x2, y2) {
				that.mesh.set(x0, y0, 0, x0 + 0.5, y0 + 0.5);
				that.mesh.set(x1, y1, 0, x1 + 0.5, y1 + 0.5);
				that.mesh.set(x2, y2, 0, x2 + 0.5, y2 + 0.5);
			}
		);
		
		this.mesh.build();
			
	},
	
	/**
		(re)generate ghost position and identity
		
		@method generate
	**/
	
	generate: function() {
		var l = EASY.cave.LENGTH;
		var x, y, z;

		do {
			x = this.rng.getn(l);
			z = this.rng.getn(l);
		} while(!EASY.cave.isFlat(x, z, 0.5));
	
		this.center.set(x, EASY.cave.getFloorHeight(x, z) + 1, z);
		this.seeking.copy(this.center);
	},
	
	/**
		implement ghost AI, detection, and motion
		
		@method update
	**/
	
	update: function() {
		var pp = EASY.player.footPosition;
		var dt = SOAR.interval * 0.001;
		var hit = false;
		var x, z, dx, dz, d;
		
		this.rotor.turn(0, 0.05, 0);
		
		x = this.center.x;
		z = this.center.z;
		
		while (!hit && (Math.abs(x - pp.x) > 1 || Math.abs(z - pp.z) > 1) ) {
		
			dx = pp.x - x;
			dz = pp.z - z;
			d = Math.sqrt(dx * dx + dz * dz);
			x += 0.1 * dx / d;
			z += 0.1 * dz / d;
			
			if (!EASY.cave.isOpen(x, z, 0.5)) {
				hit = true;
			}
		}
		
		if (!hit) {
			this.seeking.set(x, 0, z);
//			EASY.debug("i see you");
		} else {
//			EASY.debug("");
		}
		
		dx = this.seeking.x - this.center.x;
		dz = this.seeking.z - this.center.z;
		d = Math.sqrt(dx * dx + dz * dz);
		if (d > 0) {
			this.center.x += this.NOMINAL_SPEED * dt * dx / d;
			this.center.z += this.NOMINAL_SPEED * dt * dz / d;
			this.center.y = EASY.cave.getFloorHeight(this.center.x, this.center.z) + 1;
		}
		
		// generate a vector that points to "down"
		this.down.set(
			EASY.cave.getFloorHeight(this.center.x - 1, this.center.z) - EASY.cave.getFloorHeight(this.center.x + 1, this.center.z),
			0, 
			EASY.cave.getFloorHeight(this.center.x, this.center.z - 1) - EASY.cave.getFloorHeight(this.center.x, this.center.z + 1)
		).mul(dt);
		this.center.add(this.down);
		
	},
	
	/**
		draw the ghost
		
		@method draw
	**/
	 
	draw: function() {
		var gl = EASY.display.gl;
		var shader = this.shader;
		var camera = EASY.player.camera;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		gl.uniformMatrix4fv(shader.rotations, false, this.rotor.matrix.transpose);

		gl.uniform3f(shader.center, this.center.x, this.center.y, this.center.z);

		this.sign.bind(0, shader.sign);
		this.mesh.draw();
		
		gl.disable(gl.BLEND);
		
	}

};

