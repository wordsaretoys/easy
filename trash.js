/**
	generate and display trash
	
	@namespace EASY
	@class trash
**/

EASY.trash = {

	MIN_ITEMS: 5,
	MAX_ITEMS: 15,

	pool: {},
	list: [],

	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
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
				rotor: SOAR.freeRotor.create(),
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
		
		for (i = 0, il = this.MAX_ITEMS; i < il; i++) {
		
			this.list.push( {
				object: null,
				center: SOAR.vector.create(),
				active: false
			} );

		}
	},
	
	/**
		(re)generate map of items in cave
		
		@method generate
	**/
	
	generate: function() {
		var trtab = EASY.lookup.trash;
		var l = EASY.cave.LENGTH;
		var x, y, z;
		var i, il, n, t;

		n = this.MIN_ITEMS + Math.floor(this.rng.getn(this.MAX_ITEMS - this.MIN_ITEMS));
		
		for (i = 0, il = this.MAX_ITEMS; i < il; i++) {
			t = this.list[i];
			if (i < n) {
			
				do {
					x = this.rng.getn(l);
					z = this.rng.getn(l);
					y = EASY.cave.getFloorHeight(x, z);
				} while(y > -2)
			
				t.center.set(x, y + 1, z);
				t.object = trtab[ Math.floor(this.rng.getn(trtab.length)) ];
				t.active = true;
				
			} else {
			
				t.active = false;

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
		var center;
		var i, il, tr, pl;

//		gl.enable(gl.CULL_FACE);
//		gl.cullFace(gl.BACK);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		
		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());

		for (i = 0, il = this.list.length; i < il; i++) {
			tr = this.list[i];
			if (tr.active) {
				center = tr.center;
				pl = this.pool[ tr.object.type ];
				pl.rotor.turn(0, 0.01, 0);
				gl.uniformMatrix4fv(shader.rotations, false, pl.rotor.matrix.transpose);
				gl.uniform3f(shader.center, center.x, center.y, center.z);
				pl.sign.bind(1, shader.sign);
				pl.mesh.draw();
			}
		}
		
//		gl.disable(gl.CULL_FACE);
		gl.disable(gl.BLEND);
		
	}

};

