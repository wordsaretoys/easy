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
		fragments: {
			type: "image",
			path: "res/fragments.png"
		}
	},
	
	/*
	
		table of antagonist tribes
		
	*/
	
	tribe: [

		{
			text: "Boothrede",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		},
		
		{
			text: "Clanmorgan",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		},
		
		{
			text: "Cowlberth",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		},
		
		{
			text: "Monkshockey",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		},
		
		{
			text: "Throckton",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		},
		
		{
			text: "Treblerath",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		}
		
	],
	
	/*
		
		table of antagonist reasons
		
	*/
	
	reason: [
	
		{
			text: "an Afflicted",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		},
		
		{
			text: "a Disgraced",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		},
		
		{
			text: "a Disillusioned",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		},
		
		{
			text: "a Fanatical",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		},
		
		{
			text: "an Introverted",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			speed: 0,
			effect: 0,
			resolve: 0,
			recovery: 0
		}
	],
	
	/*
	
		list of antagonist titles
		
	*/
	
	title: [
		"Monk", "Dogsbody", "Illusionist", "Deacon", "Squire", "Conjurer",
		"Priest", "Knight", "Enchanter", "Bishop", "Clanlord", "Mage", "Scholar"
	],
	
	/*
	
		table of ghost catagories
		
	*/
	
	ghost: [

		{
			text: "Shade",
			speed: 2.5,
			effect: 5,
			resolve: 25,
			recovery: 0.1
		},
		
		{
			text: "Phantom",
			speed: 2.5,
			effect: 5,
			resolve: 25,
			recovery: 0.1
		},
		
		{
			text: "Spectre",
			speed: 2.5,
			effect: 5,
			resolve: 25,
			recovery: 0.1
		},
		
		{
			text: "Wraith",
			speed: 2.5,
			effect: 5,
			resolve: 25,
			recovery: 0.1
		},
		
		{
			text: "Revenant",
			speed: 2.5,
			effect: 5,
			resolve: 25,
			recovery: 0.1
		}

	],
	
	material: ["cloth", "oil", "wood" ],
	
	/*
	
		table of collectable trash
		
	*/
	
	trash: [
	
		{
			text: "Remains of a Shattered Treasure Chest",
			wood: 5,
			chance: 0.1
		},

		{
			text: "Pool of Discarded Torch Oil",
			oil: 3,
			image: "oil",
			chance: 0.1
		},

		{
			text: "Lump of Unidentified Flesh",
			flesh: 1,
			chance: 0.1
		},
		
		{
			text: "Tatters of an Unappreciated Tapestry",
			cloth: 3,
			chance: 0.1
		},
		
		{
			text: "Strips of an Unread Parchment",
			cloth: 2,
			chance: 0.1
		},
		
		{
			text: "Handful of Loose Change",
			change: 1,
			image: "change",
			chance: 0.1
		},
		
		{
			text: "Shreds of Torn Clothing",
			cloth: 2,
			chance: 0.1
		}
		
	],
	
	/**
		pick a random entry in a table
		
		@method select
		@param table string, the table to select from
		@param top number, the max entry in the table
		@return the randomly selected entry
	**/
	
	select: function(table, top) {
		var obj = this[table];
		var num = Math.floor( (top || obj.length) * Math.random() );
		return obj[num];
	}
	
};
