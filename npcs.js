/**
	manage npc creation, display, update, and destruction
	
	@namespace EASY
	@class npcs
**/

EASY.npcs = {

	CANVAS_SIZE: 256,
	
	CREATE_RADIUS: 30,
	DELETE_RADIUS: 35,

	masterList: [],
	activeList: [],

	phase: 0,

	/**
		initialize members
		
		@method init
	**/

	init: function() {
		var display = EASY.display;
		var masterSeed = SOAR.random.create();
	
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.CANVAS_SIZE;
		this.canvas.height = this.CANVAS_SIZE;
		this.context = this.canvas.getContext("2d");

		var i;
		var rng = SOAR.random.create();
		var pos = SOAR.vector.create();
		var bound = EASY.world.boundary;

		for (i = 0; i < 1000; i++) {
			do {
				pos.x = rng.getn(bound.x);
				pos.z = rng.getn(bound.z);
			} while(EASY.cave.getLowerHeight(pos.x, pos.z) > 1)
			pos.y = rng.getn(5) + 1;
//			pos.y = 1;
			this.masterList.push(
				EASY.paddler.create(masterSeed.getl(), pos)
			);
		}

	},
	
	/**
		handle updates to the npc collection
		
		@method update
	**/

	update: function() {
		var scr = this.scratch;
		var camera = EASY.player.camera;
		var dt = SOAR.interval * 0.001;
		var i, il, npc, d;

		// periodically regenerate the active list,
		// generating and the releasing GL objects
		// as needed
		if ( (this.phase++) % 100 === 0) {
		
			this.activeList.length = 0;
			for (i = 0, il = this.masterList.length; i < il; i++) {
				npc = this.masterList[i];
				d = camera.position.distance(npc.center);
				if (d > this.DELETE_RADIUS) {
					if (npc.mesh) {
						npc.release();
					}
				}
				if (d <= this.CREATE_RADIUS) {
					if (!npc.mesh) {
						npc.generate();
					}
					this.activeList.push(npc);
				}
			}
			
			// sort the regenerated list by npc type
			this.activeList.sort(function(a, b) {
				return a.type > b.type;
			});
		}
		
		EASY.debug(this.activeList.length + " / " + this.masterList.length);

		// allow all active npcs to update themselves
		if (!EASY.world.stopNpcs) {

			for (i = 0, il = this.activeList.length; i < il; i++) {
				this.activeList[i].update();
			}
		}
	},
	
	/**
		draw all npcs visible to player
		
		@method draw
	**/
	
	draw: function() {
		var i, npc, last;
		var il = this.activeList.length;

		if (il > 0) {
			last = this.activeList[0];
			last.predraw();
		}

		for (i = 0; i < il; i++) {
			npc = this.activeList[i];

			if (last.type !== npc.type) {
				last.postdraw();
				last = npc;
				last.predraw();
			}

			npc.draw();
			
		}
		
		if (last) {
			last.postdraw();
		}
	}

};
