/**
	maintain initial game world data
	
	@namespace EASY
	@class world
**/

EASY.world = {

	resources: {
		panel: {
			type: "image",
			path: "res/panel.png"
		},
		noise1: {
			type: "image",
			path: "res/noise1.jpg"
		},
		noise2: {
			type: "image",
			path: "res/noise2.jpg"
		},
		leaf: {
			type: "image",
			path: "res/leaf.jpg"
		},
		stones: {
			type: "image",
			path: "res/stones.jpg"
		},
		dirt: {
			type: "image",
			path: "res/dirt.jpg"
		}
	},
	
	player: {
		position: {
			x: 12,
			y: 0,
			z: 12
		},
		rotation: 6 * Math.PI / 9
	}

};
