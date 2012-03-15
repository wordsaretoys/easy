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
			resolve: 0,
			cooldown: 0
		},
		
		{
			text: "Clanmorgan",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			resolve: 0,
			cooldown: 0
		},
		
		{
			text: "Cowlberth",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			resolve: 0,
			cooldown: 0
		},
		
		{
			text: "Monkshockey",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			resolve: 0,
			cooldown: 0
		},
		
		{
			text: "Throckton",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			resolve: 0,
			cooldown: 0
		},
		
		{
			text: "Treblerath",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			resolve: 0,
			cooldown: 0
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
			resolve: 0,
			cooldown: 0
		},
		
		{
			text: "a Disgraced",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			resolve: 0,
			cooldown: 0
		},
		
		{
			text: "a Disillusioned",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			resolve: 0,
			cooldown: 0
		},
		
		{
			text: "a Fanatical",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			resolve: 0,
			cooldown: 0
		},
		
		{
			text: "an Introverted",
			excuse: 0,
			appease: 0,
			flatter: 0,
			blame: 0,
			confuse: 0,
			resolve: 0,
			cooldown: 0
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
			cooldown: 20,
			resolve: 25,
			damage: 5
		},
		
		{
			text: "Phantom",
			cooldown: 20,
			resolve: 30,
			damage: 10
		},
		
		{
			text: "Spectre",
			cooldown: 10,
			resolve: 25,
			damage: 15
		},
		
		{
			text: "Wraith",
			cooldown: 10,
			resolve: 30,
			damage: 20
		},
		
		{
			text: "Revenant",
			cooldown: 5,
			resolve: 40,
			damage: 25
		}

	],
	
	/*
	
		list of trash types
		
	*/
	
	trashType: ["potion", "clothing", "armor", "weapon", "art"],
	material: ["cloth", "cord", "glass", "metal", "oil", "wood" ],
	
	/*
	
		table of collectable trash
		
	*/
	
	trash: [
	
		{
			text: "Dregs of a Healing Potion",
			glass: 1,
			oil: 1,
			type: "potion",
			chance: 0.8
		},
		
		{
			text: "Dregs of a Strength Potion",
			glass: 1,
			oil: 2,
			type: "potion",
			chance: 0.4
		},
		
		{
			text: "Dregs of a Bottle of Torch Oil",
			glass: 1,
			oil: 2,
			type: "potion",
			chance: 0.3
		},
		
		
		{
			text: "Exhausted Magical Amulet",
			wood: 1,
			metal: 1,
			cord: 1,
			type: "clothing",
			chance: 0.1
		},

		{
			text: "Exhausted Magical Ring",
			metal: 1,
			type: "clothing",
			chance: 0.2
		},
		
		{
			text: "Exhausted Magical Belt",
			metal: 1,
			cord: 2,
			type: "clothing",
			chance: 0.1
		},
		
		{
			text: "Exhausted Magical Shirt",
			cord: 2,
			cloth: 5,
			type: "clothing",
			chance: 0.2
		},
 		
		
		{
			text: "Shard of Armor",
			metal: 3,
			type: "armor",
			chance: 0.3
		},

		{
			text: "Splintered Shield",
			wood: 2,
			metal: 2,
			cord: 1,
			type: "armor",
			chance: 0.08
		},
		

		{
			text: "Hilt of a Broken Sword",
			metal: 2,
			wood: 1,
			cord: 1,
			type: "weapon",
			chance: 0.1
		},
		
		{
			text: "Blade of a Broken Sword",
			metal: 5,
			type: "weapon",
			chance: 0.08
		},
		
		
		{
			text: "Unappreciated Tapestry",
			cloth: 4,
			type: "art",
			chance: 0.1
		},
		
		{
			text: "Unread Parchment",
			cloth: 2,
			type: "art",
			chance: 0.2
		},
		
		{
			text: "Unused Bottle of Cologne",
			oil: 2,
			type: "art",
			glass: 1
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
