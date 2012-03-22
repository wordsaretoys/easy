/**
	generate and display trash
	
	@namespace EASY
	@class trash
**/

EASY.trash = {

	GRAB_DISTANCE: 1.5,
	
	ITEM: [ 
		{ 
			type: "wood",
			pc: 0.05
		},
		{
			type: "oil",
			pc: 0.03
		},
		{
			type: "flesh",
			pc: 0.1
		},
		{
			type: "cloth",
			pc: 0.05
		},
		{
			type: "change",
			pc: 0.05
		}
	],

	list: [],
	texture: {},
	dummymt: new Float32Array(16),

	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var that = this;

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-trash"), SOAR.textOf("fs-trash"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center"],
			["sign"]
		);
		
		this.rng = SOAR.random.create();
		
		this.mesh = SOAR.mesh.create(EASY.display);

		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		
		SOAR.subdivide(0, -0.5, -0.5, 0.5, 0.5, 
			function(x0, y0, x1, y1, x2, y2) {
				that.mesh.set(x0, 0, y0, x0 + 0.5, y0 + 0.5);
				that.mesh.set(x1, 0, y1, x1 + 0.5, y1 + 0.5);
				that.mesh.set(x2, 0, y2, x2 + 0.5, y2 + 0.5);
			}
		);
		
		this.mesh.build();
		
		// build a pointer image for the player
		(function() {
			var cntx = EASY.texture.context;
			var w = EASY.texture.canvas.width;
			var h = EASY.texture.canvas.height;
			cntx.clearRect(0, 0, w, h);
			cntx.fillStyle = "rgb(255, 255, 255)"
			cntx.strokeStyle = "rgb(0, 0, 0)";
			cntx.lineWidth = 3;
			cntx.beginPath();
			cntx.moveTo(w / 2, h);
			cntx.lineTo(0, 0);
			cntx.lineTo(w / 2, h / 4);
			cntx.lineTo(w, 0);
			cntx.lineTo(w / 2, h);
			cntx.fill();
			cntx.stroke();
			that.texture.player = 
				SOAR.texture.create(EASY.display, cntx.getImageData(0, 0, w, h));
		})();
	},
	
	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		var i, il, type;
		for (i = 0, il = this.ITEM.length; i < il; i++) {
			type = this.ITEM[i].type;
			this.texture[type] = 
				SOAR.texture.create(EASY.display, EASY.resources[type].data);
		}
	},
	
	/**
		(re)generate map of items in cave
		
		@method generate
	**/
	
	generate: function() {
		var l = EASY.cave.LENGTH;
		var flat = [];
		var i, il, j, fl;
		var x, z, c, p;

		this.list.length = 0;
		
		// find all flat 1m square areas of the map
		// that aren't touching each other directly
		for (x = 0.5; x < l; x += 2) {
			for (z = 0.5; z < l; z += 2) {
				if (EASY.cave.isFlat(x, z, 0.5)) {
					flat.push( {
						x: x, 
						z: z
					} );
				}
			}
		}
		
		// shuffle the flats array into random order
		flat.sort(function(a, b) {
			return Math.floor(3 * Math.random()) - 1;
		});
		fl = flat.length;
		console.log(fl);
		
		// for each item type
		for (i = 0, il = this.ITEM.length; i < il; i++) {
		
			// determine count and allocate that number of items
			c = Math.ceil(fl * this.ITEM[i].pc);
			console.log(this.ITEM[i].type + ", " + c);
			for (j = 0; j < c && flat.length > 0; j++) {
				p = flat.pop();
				this.list.push( {
					center: SOAR.vector.create(p.x, 0.01, p.z),
					active: true,
					object: this.ITEM[i].type,
					number: 1 + Math.floor(5 * Math.random())
				} );
			}
		}
	},
	
	/**
		check for collection
		
		@method update
	**/
	
	update: function() {
		var pp = EASY.player.footPosition;
		var i, il, item, d;
		
		for (i = 0, il = this.list.length; i < il; i++) {
			item = this.list[i];
			if (item.active) {
				d = pp.distance(item.center);
				if (d < this.GRAB_DISTANCE) {
					item.active = false;
					EASY.player.collect(item);
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
		var center;
		var i, il, item;

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		this.dummymt.set(EASY.idmat);
		gl.uniformMatrix4fv(shader.rotations, false, this.dummymt);

		for (i = 0, il = this.list.length; i < il; i++) {
			item = this.list[i];
			if (item.active) {
				center = item.center;
				gl.uniform3f(shader.center, center.x, center.y, center.z);
				this.texture[item.object].bind(0, shader.sign);
				this.mesh.draw();
			}
		}
		
		// a bit of a hack: display the player location in mapview
		// this would have gone in the player object but that meant
		// adding another shader and mesh and so on; this is simpler
		// the yaw.w negation implements a cheeky matrix transpose!
		if (camera.mapView) {
			camera = EASY.player.eyeview;
			camera.yaw.w = -camera.yaw.w;
			camera.yaw.toMatrix(this.dummymt);
			camera.yaw.w = -camera.yaw.w;
			gl.uniformMatrix4fv(shader.rotations, false, this.dummymt);
			center = EASY.player.headPosition;
			gl.uniform3f(shader.center, center.x, center.y, center.z);
			this.texture.player.bind(0, shader.sign);
			this.mesh.draw();
		}
		
		gl.disable(gl.BLEND);
		
	}

};

