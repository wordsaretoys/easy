/**
	generate and display trash
	
	@namespace EASY
	@class trash
**/

EASY.trash = {

	GRAB_DISTANCE: 1.5,
	QUANT_MULTIPLE: 3,
	
	ITEM: [ "wood", "oil", "coin" ],

	list: [],
	texture: {},
	phase: 0,
	
	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var that = this;

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-item"), SOAR.textOf("fs-item"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center"],
			["sign"]
		);
		
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
	},
	
	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		var i, il, type;
		for (i = 0, il = this.ITEM.length; i < il; i++) {
			type = this.ITEM[i];
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
		var flat = EASY.cave.flat;
		var base, quant, drop, pos;
		var i, il;
		
		this.list.length = 0;

		// quantities cycle quasi-periodically over time
		base = 1.5 + 0.5 * Math.cos(this.phase);
		//console.log("base: ", base);
		
		// for each item type
		for (i = 0, il = this.ITEM.length; i < il; i++) {
			// determine total quantity of item
			quant = Math.ceil(this.QUANT_MULTIPLE * base * (1 + Math.random()));
			// break into random set of drops
			do {
				drop = Math.ceil(quant * Math.random());
				pos = flat.pop();
				if (!pos) 
					return false;
				this.list.push( {
					center: SOAR.vector.create(pos.x, EASY.cave.ZERO_HEIGHT + 0.01, pos.z),
					active: true,
					object: this.ITEM[i],
					number: drop
				} );
				quant = quant - drop;
			} while(quant > 0);

		}
		
		// add random phase
		this.phase += Math.random();
/*
		var item, t = {};
		for (i = 0, il = this.list.length; i < il; i++) {
			item = this.list[i];
			t[item.object] = (t[item.object] || 0) + item.number;
		}
		console.log("wood: ", t.wood, " oil: ", t.oil, " coin: ", t.coin);
		console.log("flats left: ", flat.length);
*/

		return true;
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
		gl.uniformMatrix4fv(shader.rotations, false, EASY.I);

		for (i = 0, il = this.list.length; i < il; i++) {
			item = this.list[i];
			if (item.active) {
				center = item.center;
				gl.uniform3f(shader.center, center.x, center.y, center.z);
				this.texture[item.object].bind(0, shader.sign);
				this.mesh.draw();
			}
		}

		gl.disable(gl.BLEND);
		
	}

};

