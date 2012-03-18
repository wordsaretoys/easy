/**
	generate and display trash
	
	@namespace EASY
	@class trash
**/

EASY.trash = {

	GRAB_DISTANCE: 1.5,
	ITEM_CHANCE: 0.1,
	
	list: [],
	texture: {},

	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var trash = EASY.lookup.trash;
		var that = this;
		var i, il, t;

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-trash"), SOAR.textOf("fs-trash"),
			["position", "texturec"], 
			["projector", "modelview", "center"],
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

		// sort the trash table in order of increasing probability of discovery
		trash.sort(function(a, b) {
			return a.chance - b.chance;
		});
	},
	
	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		var display = EASY.display;
		var resources = EASY.lookup.resources;
		
		this.texture["cloth"] = 
			SOAR.texture.create(display, resources["cloth"].data);
		this.texture["oil"] = 
			SOAR.texture.create(display, resources["oil"].data);
		this.texture["change"] = 
			SOAR.texture.create(display, resources["change"].data);
		this.texture["chest"] = 
			SOAR.texture.create(display, resources["chest"].data);
		this.texture["flesh"] = 
			SOAR.texture.create(display, resources["flesh"].data);
	},
	
	/**
		(re)generate map of items in cave
		
		@method generate
	**/
	
	generate: function() {
		var trash = EASY.lookup.trash;
		var il = trash.length;
		var l = EASY.cave.LENGTH;
		var i, x, z;

		this.list.length = 0;
		
		// for each square of the map
		for (x = 0; x < l; x++) {
			for (z = 0; z < l; z++) {
			
				// if there's a nice flat 1m square area
				// and we make the roll for an item in it
				if (EASY.cave.isFlat(x, z, 1) && Math.random() <= this.ITEM_CHANCE) {
				
					// run through all possible trash items
					for (i = 0; i < il; i++) {
					
						// if we make the roll for a particular item
						if (Math.random() <= trash[i].chance) {
							
							// add the item to the list
							this.list.push( {
								center: SOAR.vector.create(x, 0.01, z),
								active: true,
								object: trash[i]
							} );
							
							// that's all for this square
							break;
						}
					}
				}
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
					EASY.player.collect(item.object);
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

		for (i = 0, il = this.list.length; i < il; i++) {
			item = this.list[i];
			if (item.active) {

				center = item.center;
				gl.uniform3f(shader.center, center.x, center.y, center.z);
				this.texture[item.object.type].bind(0, shader.sign);
				this.mesh.draw();
			}
		}
		
		gl.disable(gl.BLEND);
		
	}

};

