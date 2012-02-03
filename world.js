/**
	maintain initial game world data
	
	@namespace FOUR
	@class world
**/

FOUR.world = {

	resources: {
		panel: {
			type: "image",
			path: "res/panel.png"
		},
		ground: {
			type: "image",
			path: "res/ground.jpg"
		},
		branches: {
			type: "image",
			path: "res/branches.jpg"
		}
	},
	
	boundary: {
		x0: 0,
		y0: 0,
		z0: 0,
		x1: 300,
		y1: 0,
		z1: 300
	},
	
	player: {
		position: {
			x: 150,
			y: 0,
			z: 150
		}
	}

};
