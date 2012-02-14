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
		dirt: {
			type: "image",
			path: "res/dirt.jpg"
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
		}
	},
	
	boundary: {
		x: 300,
		z: 300
	},
	
	player: {
		position: {
			x: 75,
			y: 0,
			z: 242
		},
		rotation: Math.PI / 2
	}

};
