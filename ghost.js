/**
	generate and display a ghost
	
	@namespace EASY
	@class ghost
**/

EASY.ghost = {

	NOMINAL_SPEED: 2.5,

	position: SOAR.vector.create(),
	velocity: SOAR.vector.create(),

	rotor: SOAR.freeRotor.create(),
	target: SOAR.vector.create(),

	scratch: {
		pos: SOAR.vector.create(),
		dir: SOAR.vector.create()
	},
	
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
	
		this.position.set(x, EASY.cave.getFloorHeight(x, z) + 1, z);
		this.target.copy(this.position);
	},
	
	/**
		determine if player in ghost's line of sight
		if so, set target to player's last position
		
		@method lookForPlayer
	**/
	
	lookForPlayer: function() {
		var pos = this.scratch.pos;
		var dir = this.scratch.dir;
		var pp = EASY.player.footPosition;
		var blocked = false;

		pos.copy(this.position);
		dir.copy(pp).sub(pos).norm().mul(0.5);
		while (!blocked && (Math.abs(pos.x - pp.x) > 0.5 || Math.abs(pos.z - pp.z) > 0.5) ) {
			pos.add(dir);
			blocked = !EASY.cave.isOpen(pos.x, pos.z, 0.5);
		}
		
		if (!blocked) {
			this.target.copy(pos);
			EASY.debug("i see you");
		} else {
			EASY.debug("");
		}
	},
	
	/**
		implement ghost AI, detection, and motion
		
		@method update
	**/
	
	update: function() {
		var dir = this.scratch.dir;
		var dt = SOAR.interval * 0.001;

		this.rotor.turn(0, 0.05, 0);
		this.lookForPlayer();
		
		dir.copy(this.target).sub(this.position);
		if (dir.length() > 0) {
			dir.norm();
			this.velocity.x = this.NOMINAL_SPEED * dir.x;
			this.velocity.z = this.NOMINAL_SPEED * dir.z;
		} else {
			this.velocity.set();
		}
		
		// generate a vector that points away from the walls
		dir.set(
			EASY.cave.getFloorHeight(this.position.x - 1, this.position.z) - EASY.cave.getFloorHeight(this.position.x + 1, this.position.z),
			0, 
			EASY.cave.getFloorHeight(this.position.x, this.position.z - 1) - EASY.cave.getFloorHeight(this.position.x, this.position.z + 1)
		);
		this.velocity.add(dir);

		// update the position, maintaining distance from cave floor
		this.position.add(this.velocity.mul(dt));
		this.position.y = EASY.cave.getFloorHeight(this.position.x, this.position.z) + 1;
		
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

		gl.uniform3f(shader.center, this.position.x, this.position.y, this.position.z);

		this.sign.bind(0, shader.sign);
		this.mesh.draw();
		
		gl.disable(gl.BLEND);
		
	}

};

