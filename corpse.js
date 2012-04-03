/**
	generate and display a corpse of sorts
	
	@namespace EASY
	@class corpse
**/

EASY.corpse = {

	RADIUS: 0.5,
	USE_RADIUS: 2.5,
	BURN_TIME: 5,
	PYRE_MULTIPLE: 2,

	INTACT: 0,
	BURNING: 1,
	CREMATED: 2,
	
	TRIBE: [ 
		"Boothrede", "Clanmorgan", "Cowlberth", "Monkshockey", "Throckton", "Treblerath" 
	],

	TITLE: [
		"a Mutilated Monk",
		"a Butchered Bishop",
		"a Massacred Mage",
		"a Dismembered Dogsbody",
		"a Pummelled Priest",
		"a Shattered Squire",
		"a Neutered Knight",
		"a Carved-up Conjurer",
		"a Stabbed Scholar"
	],

	identity: "",
	
	texture: {},
	position: SOAR.vector.create(),
	mode: 0,
	
	phase: Math.PI,
	
	wood: 0,
	oil: 0,
	change: 0,
	
	scratch: {
		pos: SOAR.vector.create()
	},
	
	/**
		create and init required objects
		
		@method init
	**/

	init: function() {
		var that = this;
		var temp = SOAR.vector.create();
		var lump = SOAR.noise2D.create(0, 0.5, 16, 8);

		this.shader = SOAR.shader.create(
			EASY.display,
			SOAR.textOf("vs-corpse"), SOAR.textOf("fs-corpse"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center", "burn"],
			["body", "ash"]
		);
		
		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		
		SOAR.subdivide(4, -0.5, -1, 0.5, 1, 
			function(x0, z0, x1, z1, x2, z2) {

				var y0 = (0.25 - x0 * x0) * (1 - z0 * z0) - 0.025;
				var y1 = (0.25 - x1 * x1) * (1 - z1 * z1) - 0.025;
				var y2 = (0.25 - x2 * x2) * (1 - z2 * z2) - 0.025;

				that.mesh.set(x0, y0, z0, 0.5 + x0, 0.5 * (z0 + 1));
				that.mesh.set(x1, y1, z1, 0.5 + x1, 0.5 * (z1 + 1));
				that.mesh.set(x2, y2, z2, 0.5 + x2, 0.5 * (z2 + 1));
			}
		);
		
		this.mesh.build();
	},

	/**
		process loaded resources and perform any remaining initialization
		
		@method process
	**/
	
	process: function() {
		this.texture.body = 
			SOAR.texture.create(EASY.display, EASY.resources["corpse"].data);
		this.texture.ash = 
			SOAR.texture.create(EASY.display, EASY.resources["noise2"].data);
	},
	
	/**
		(re)generate corpse position and requirements for cremation
		
		@method generate
	**/
	
	generate: function() {
		var base, p;
	
		// grab position from cave flat list
		p = EASY.cave.flat.pop();
		if (!p) 
			return false;
		this.position.set(p.x, EASY.cave.ZERO_HEIGHT + 0.01, p.z);
		
		// requirements cycle quasi-periodically over time
		base = 1.5 + 0.5 * Math.cos(this.phase);
		
		// generate requirements for cremation
		this.wood = Math.ceil(this.PYRE_MULTIPLE * base * (1 + Math.random()));
		this.oil = Math.ceil(this.PYRE_MULTIPLE * base * (1 + Math.random()));
		
		// next random phase
		this.phase += Math.random();
		
		// generate an identity string
		this.identity = this.TITLE.pick() + " of " + this.TRIBE.pick();
		
		this.burn = 0;
		this.mode = this.INTACT;
		
		return true;
	},

	/**
		update the corpse status
		
		@method update
	**/
	
	update: function() {
		var pp = EASY.player.headPosition;
		var dp = pp.distance(this.position);
		var t = 0;
		
		switch(this.mode) {
		
		case this.INTACT:
		
			// if we're close to an unburned corpse
			if (dp <= this.USE_RADIUS) {
				// are we looking at it?
				this.scratch.pos.copy(this.position).sub(pp).norm();
				t = this.USE_RADIUS * 
					this.scratch.pos.dot(EASY.player.camera.orientation.front) / dp;
			}
			
			// let the HUD know if it doesn't already
			if (!EASY.hud.dom.prompts.shown && t > 1) {
				EASY.hud.showPrompt("E", 
					"Cremate " + this.identity,
					"Requires " + this.wood + " wood, " + this.oil + " oil ",
					"cremate");
			} else if (EASY.hud.dom.prompts.shown && t <= 1) {
				EASY.hud.hidePrompt();
			}
		
			break;
			
		case this.BURNING:
		
			this.burn = 0.001 * (SOAR.elapsedTime - this.timestamp) / this.BURN_TIME;
			if (this.burn >= 1) {
				this.burn = 1;
				this.mode = this.CREMATED;
			}
		
			break;
			
		case this.CREMATED:
		
			break;
		}
	},
	
	/**
		activate the cremation
		
		@method cremate
	**/
	
	cremate: function() {
		EASY.hud.hidePrompt();
		this.mode = this.BURNING;
		this.timestamp = SOAR.elapsedTime;
		EASY.ghost.cremate();
	},
	
	/**
		draw the corpse
		
		@method draw
	**/
	 
	draw: function() {
		var gl = EASY.display.gl;
		var shader = this.shader;
		var camera = EASY.player.camera;
		var pos = this.position;

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		gl.uniformMatrix4fv(shader.rotations, false, EASY.I);
		gl.uniform3f(shader.center, pos.x, pos.y, pos.z);
		gl.uniform1f(shader.burn, this.burn);
		this.texture.body.bind(0, shader.body);
		this.texture.ash.bind(1, shader.ash);
		this.mesh.draw();
	}

};
