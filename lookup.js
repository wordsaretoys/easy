/**
	provide lookup objects for game data
	
	@namespace EASY
	@class lookup
**/

EASY.lookup = {

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
	
	tribe: [

		{
			name: "Boothrede"
		},
		
		{
			name: "Clanmorgan"
		},
		
		{
			name: "Cowlberth"
		},
		
		{
			name: "Monkshockey"
		},
		
		{
			name: "Throckton"
		},
		
		{
			name: "Treblerath"
		}
		
	],
	
	reason: [
	
		{
			name: "Afflicted"
		},
		
		{
			name: "Disgraced"
		},
		
		{
			name: "Disillusioned"
		},
		
		{
			name: "Fanatical"
		},
		
		{
			name: "Introverted"
		}
	],
	
	title: [
		"Monk", "Dogsbody", "Illusionist", "Deacon", "Squire", "Conjurer",
		"Priest", "Knight", "Enchanter", "Bishop", "Clanlord", "Mage", "Scholar"
	],
	
	ghost: [

		{
			name: "Shade"
		},
		
		{
			name: "Phantom"
		},
		
		{
			name: "Spectre"
		},
		
		{
			name: "Wraith"
		},
		
		{
			name: "Revenant"
		}

	],
	
	trashType: ["potion", "clothing", "armor", "weapon", "art"],
	
	trash: [
	
		{
			name: "Dregs of a Healing Potion",
			glass: 1,
			oil: 1,
			type: "potion",
			chance: 0.8
		},
		
		{
			name: "Dregs of a Strength Potion",
			glass: 1,
			oil: 2,
			type: "potion",
			chance: 0.4
		},
		
		{
			name: "Dregs of a Bottle of Torch Oil",
			glass: 1,
			oil: 2,
			type: "potion",
			chance: 0.3
		},
		
		
		{
			name: "Exhausted Magical Amulet",
			wood: 1,
			metal: 1,
			cord: 1,
			type: "clothing",
			chance: 0.1
		},

		{
			name: "Exhausted Magical Ring",
			metal: 1,
			type: "clothing",
			chance: 0.2
		},
		
		{
			name: "Exhausted Magical Belt",
			metal: 1,
			cord: 2,
			type: "clothing",
			chance: 0.1
		},
		
		{
			name: "Exhausted Magical Shirt",
			cord: 2,
			cloth: 5,
			type: "clothing",
			chance: 0.2
		},
 		
		
		{
			name: "Shard of Armor",
			metal: 3,
			type: "armor",
			chance: 0.3
		},

		{
			name: "Splintered Shield",
			wood: 2,
			metal: 2,
			cord: 1,
			type: "armor",
			chance: 0.08
		},
		

		{
			name: "Hilt of a Broken Sword",
			metal: 2,
			wood: 1,
			cord: 1,
			type: "weapon",
			chance: 0.1
		},
		
		{
			name: "Blade of a Broken Sword",
			metal: 5,
			type: "weapon",
			chance: 0.08
		},
		
		
		{
			name: "Unappreciated Tapestry",
			cloth: 4,
			type: "art",
			chance: 0.1
		},
		
		{
			name: "Unread Parchment",
			cloth: 2,
			type: "art",
			chance: 0.2
		},
		
		{
			name: "Unused Bottle of Cologne",
			oil: 2,
			type: "art",
			glass: 1
		}
	]
};
