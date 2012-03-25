/**
	generate and display a corpse of sorts
	
	@namespace EASY
	@class corpse
**/

EASY.corpse = {

	RADIUS: 0.5,
	USE_RADIUS: 2.5,

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
		"a Crippled Conjurer",
		"a Stabbed Scholar"
	],

	identity: "",
	
	texture: {},
	position: SOAR.vector.create(),
	state: 0,
	
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
			SOAR.textOf("vs-trash"), SOAR.textOf("fs-trash"),
			["position", "texturec"], 
			["projector", "modelview", "rotations", "center"],
			["sign"]
		);
		
		this.mesh = SOAR.mesh.create(EASY.display);
		this.mesh.add(this.shader.position, 3);
		this.mesh.add(this.shader.texturec, 2);
		
		SOAR.subdivide(6, -0.5, -1, 0.5, 1, 
			function(x0, z0, x1, z1, x2, z2) {

				var y0 = Math.min(0.25 - x0 * x0, 1 - z0 * z0) - 0.1;
				var y1 = Math.min(0.25 - x1 * x1, 1 - z1 * z1) - 0.1;
				var y2 = Math.min(0.25 - x2 * x2, 1 - z2 * z2) - 0.1;

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
	},
	
	/**
		(re)generate corpse position and requirements for cremation
		
		@method generate
	**/
	
	generate: function() {
		// grab position from cave flat list
		var p = EASY.cave.flat.pop();
		this.position.set(p.x, EASY.cave.ZERO_HEIGHT + 0.01, p.z);
		
		// generate requirements for cremation
		this.wood = Math.ceil(5 * Math.random());
		this.oil = Math.ceil(5 * Math.random());
		this.coin = Math.ceil(5 * Math.random());
		
		// generate an identity string
		this.identity = this.TITLE.pick() + " of " + this.TRIBE.pick();
	},

	/**
		update the corpse status
		
		@method update
	**/
	
	update: function() {
		var pp = EASY.player.headPosition;
		var dp = pp.distance(this.position);
		var t = 0;
		
		// if we're close enough to an unburned corpse
		if (dp <= this.USE_RADIUS && this.state === this.INTACT) {
			// are we looking at it?
			this.scratch.pos.copy(this.position).sub(pp).norm();
			t = this.USE_RADIUS * 
				this.scratch.pos.dot(EASY.player.camera.orientation.front) / dp;
		}
		// let the HUD know
		if (t > 1) {
			this.prompted = true;
			EASY.hud.showPrompt("E", 
				"Cremate " + this.identity,
				"Requires " + this.wood + " wood, " + this.oil + " oil, " + this.coin + " coin",
				EASY.player.cremate);
		} else {
			this.prompted = false;
			EASY.hud.hidePrompt();
		}
	},
	
	/**
		activate the cremation
		
		@method cremate
	**/
	
	cremate: function() {
		this.state = this.BURNING;
		EASY.ghost.mode = EASY.ghost.RESTING;
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

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		shader.activate();
		gl.uniformMatrix4fv(shader.projector, false, camera.projector());
		gl.uniformMatrix4fv(shader.modelview, false, camera.modelview());
		gl.uniformMatrix4fv(shader.rotations, false, EASY.I);
		gl.uniform3f(shader.center, pos.x, pos.y, pos.z);
		this.texture.body.bind(0, shader.sign);
		this.mesh.draw();

		gl.disable(gl.BLEND);
	}

};
