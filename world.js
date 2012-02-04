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
		cave: {
			type: "image",
			path: "res/cave.jpg"
		}
	},
	
	boundary: {
		x: 300,
		z: 300
	},
	
	player: {
		position: {
			x: 150,
			y: 0,
			z: 290
		}
	}

};
