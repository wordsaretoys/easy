/**

	Caves are Easy: WebGL-based Game
	
	@module easy
	@author cpgauthier

**/

var EASY = {
	
	/**
		create GL context, set up game objects, load resources, run main loop

		@method start
	**/

	start: function() {

		var gl, tracker, resources;

		// create the GL display
		try {
			EASY.display = SOAR.display.create("gl");
		} catch (e) {
			jQuery("#glerror").show();
			return;
		}

		// set initial display dimensions
		EASY.display.setSize(
			document.body.clientWidth, 
			document.body.clientHeight
		);

		// set up any webgl stuff that's not likely to change
		gl = EASY.display.gl;
		gl.clearDepth(1.0);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.DEPTH_TEST);
		
		// while waiting for resource load, initialize game objects
		EASY.cave.init();
		EASY.player.init();
		EASY.gliders.init();

		// begin async loading of resources from the server
		SOAR.loadResources(EASY.world.resources, function() {
		
			// allow game objects to process loaded resources
			EASY.cave.process();
		
			SOAR.schedule(EASY.update, 0, true);
			SOAR.schedule(EASY.draw, 0, true);

			window.addEventListener("resize", function() {
				EASY.display.setSize(
					document.body.clientWidth, 
					document.body.clientHeight
				);
				// always draw if the canvas dimensions are changed
				EASY.draw();
			}, false);
			
			SOAR.run();
		});
		
		// while waiting for resource load, initialize game objects
//		EASY.cave.init();
//		EASY.player.init();
	},
	
	/**
		update all game objects that require it
		
		@method update
	**/
	
	update: function() {
		EASY.player.update();
	},
	
	/**
		draw all game objects that require it
		
		draw and update are separated so that the
		game can redraw the display when the game
		is paused (i.e., not updating) and resize
		events are being generated
		
		@method draw
	**/
	
	draw: function() {
		var gl = EASY.display.gl;
	
		gl.clearColor(0.5, 0.5, 0.5, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		EASY.cave.draw();
		EASY.gliders.draw();
	}
};

