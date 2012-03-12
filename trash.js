/**
	generate and display trash
	
	@namespace EASY
	@class trash
**/

EASY.trash = {

	GRAB_DISTANCE: 1.5,

	pool: {},
	
	rotor: SOAR.freeRotor.create(),

	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var trash = EASY.lookup.trash;
		var type = EASY.lookup.trashType;
		var cntx = EASY.texture.context;
		var w = EASY.texture.canvas.width;
		var h = EASY.texture.canvas.height;
		var i, il, t;

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
		cntx.fillStyle = "rgba(255, 255, 255, 1)";
		
		for (i = 0, il = type.length; i < il; i++) {

			cntx.fillRect(0, 0, w, h);
			cntx.clearRect(5, 5, w - 10, h - 10);
			cntx.fillText(type[i], w / 2, h / 2);
		
			t = {
				mesh: SOAR.mesh.create(EASY.display),
				sign: SOAR.texture.create(EASY.display, cntx.getImageData(0, 0, w, h))
			};

			t.mesh.add(this.shader.position, 3);
			t.mesh.add(this.shader.texturec, 2);
			
			SOAR.subdivide(0, -0.5, -0.5, 0.5, 0.5, 
				function(x0, y0, x1, y1, x2, y2) {
					t.mesh.set(x0, y0, 0, x0 + 0.5, y0 + 0.5);
					t.mesh.set(x1, y1, 0, x1 + 0.5, y1 + 0.5);
					t.mesh.set(x2, y2, 0, x2 + 0.5, y2 + 0.5);
				}
			);
			
			t.mesh.build();
			
			this.pool[type[i]] = t;
		}
		
		// augment the trash table with positions and active flags
		
		for (i = 0, il = trash.length; i < il; i++) {
			trash[i].center = SOAR.vector.create();
			trash[i].active = false;
		}
	},
	
	/**
		(re)generate map of items in cave
		
		@method generate
	**/
	
	generate: function() {
		var trash = EASY.lookup.trash;
		var l = EASY.cave.LENGTH;
		var x, y, z;
		var i, il;

		for (i = 0, il = trash.length; i < il; i++) {
		
			if (this.rng.get() <= trash[i].chance) {

				do {
					x = this.rng.getn(l);
					z = this.rng.getn(l);
					y = EASY.cave.getFloorHeight(x, z);
				} while(y > -2.5)
			
				trash[i].center.set(x, y + 1, z);
				trash[i].active = true;
				
			} else {
			
				trash[i].active = false;

			}
		}
	},
	
	/**
		check for collection
		
		@method update
	**/
	
	update: function() {
		var trash = EASY.lookup.trash;
		var i, il, pp, d;
		
		this.rotor.turn(0, 0.05, 0);
		pp = EASY.player.footPosition;
		
		for (i = 0, il = trash.length; i < il; i++) {
			if (trash[i].active) {
				d = pp.distance(trash[i].center);
				if (d < this.GRAB_DISTANCE) {
					trash[i].active = false;
					EASY.player.collect(trash[i]);
				}
			}
		}
	},
	
	/**
		draw the items
		
		@method draw
	**/
	 
	draw: function() {
		var gl = EASY.display.gl;
		var shader = this.shader;
		var camera = EASY.player.camera;
		var trash = EASY.lookup.trash;
		var center;
		var i, il, pl;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		gl.uniformMatrix4fv(shader.rotations, false, this.rotor.matrix.transpose);

		for (i = 0, il = trash.length; i < il; i++) {
			if (trash[i].active) {

				center = trash[i].center;
				gl.uniform3f(shader.center, center.x, center.y, center.z);

				pl = this.pool[ trash[i].type ];
				pl.sign.bind(1, shader.sign);
				pl.mesh.draw();
			}
		}
		
		gl.disable(gl.BLEND);
		
	}

};

