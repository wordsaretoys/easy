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

	/**
		initialize members
		
		@method init
	**/

	init: function() {
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.CANVAS_SIZE;
		this.canvas.height = this.CANVAS_SIZE;
		this.context = this.canvas.getContext("2d");
		
		var that = this;
		SOAR.schedule(function() {
			that.updateActiveList();
		}, 1000, true);
	},
	
	/**
		add object to master list
		
		@method add
		@param type string representing type of object
		@param o object to add
	**/
	
	add: function(type, o) {
		o.type = type;
		this.masterList.push(o);
	},
	
	/**
		update membership in the active collection
		
		do this periodically--NOT on every animation frame--
		to refresh which models are displayed and to release
		GL resources which aren't used anymore.
		
		@method updateActiveList
	**/
	
	updateActiveList: function() {
		var camera = EASY.player.camera;
		var dt = SOAR.interval * 0.001;
		var i, il, npc, d;
	
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

		EASY.debug(this.activeList.length + " / " + this.masterList.length);
	},
	
	/**
		update members OF the active collection
		
		@method update
	**/

	update: function() {
		var i, il;

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
