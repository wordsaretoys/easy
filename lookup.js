/**
	provide lookup objects for game data
	
	@namespace EASY
	@class lookup
**/

EASY.lookup = {

	/*
	
		table of binary resources
		
	*/

	resources: {
		noise1: {
			type: "image",
			path: "res/noise1.jpg"
		},
		noise2: {
			type: "image",
			path: "res/noise2.jpg"
		},
		oil: {
			type: "image",
			path: "res/oil.png"
		},
		change: {
			type: "image",
			path: "res/change.png"
		},
		wood: {
			type: "image",
			path: "res/chest.png"
		},
		flesh: {
			type: "image",
			path: "res/flesh.png"
		},
		cloth: {
			type: "image",
			path: "res/cloth.png"
		}
	},
	
	/* ghost generator tables */
	
	tribe: [ "Boothrede", "Clanmorgan", "Cowlberth", "Monkshockey", "Throckton", "Treblerath" ],
	reason: [ "an Afflicted", "a Disgraced",  "a Disillusioned", "a Fanatical",  "an Introverted" ],
	title: [
		"Monk", "Dogsbody", "Illusionist", "Deacon", "Squire", "Conjurer",
		"Priest", "Knight", "Enchanter", "Bishop", "Clanlord", "Mage", "Scholar"
	],
	style: [ "Shade", "Phantom", "Spectre", "Wraith", "Revenant" ],
	
	/*
	
		table of collectable trash
		
	*/
	
	trash: [
	
		{
			text: "the Remains of a Shattered Treasure Chest",
			type: "wood",
			chance: 0.1
		},

		{
			text: "a Pool of Discarded Torch Oil",
			type: "oil",
			chance: 0.1
		},

		{
			text: "a Lump of Unidentified Flesh",
			type: "flesh",
			chance: 0.1
		},
		
		{
			text: "the Tatters of an Unappreciated Tapestry",
			type: "cloth",
			chance: 0.1
		},
		
		{
			text: "a Handful of Loose Change",
			type: "change",
			chance: 0.1
		}
	],
	
	/**
		pick a random entry in a table
		
		@method select
		@param table string, the table to select from
		@return the randomly selected entry
	**/
	
	select: function(table) {
		var obj = this[table];
		var num = Math.floor(obj.length * Math.random());
		return obj[num];
	}
	
};
