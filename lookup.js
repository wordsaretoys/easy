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
			text: "Boothrede"
		},
		
		{
			text: "Clanmorgan"
		},
		
		{
			text: "Cowlberth"
		},
		
		{
			text: "Monkshockey"
		},
		
		{
			text: "Throckton"
		},
		
		{
			text: "Treblerath"
		}
		
	],
	
	/*
		
		table of antagonist reasons
		
	*/
	
	reason: [
	
		{
			text: "Afflicted"
		},
		
		{
			text: "Disgraced"
		},
		
		{
			text: "Disillusioned"
		},
		
		{
			text: "Fanatical"
		},
		
		{
			text: "Introverted"
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
			text: "Shade"
		},
		
		{
			text: "Phantom"
		},
		
		{
			text: "Spectre"
		},
		
		{
			text: "Wraith"
		},
		
		{
			text: "Revenant"
		}

	],
	
	/*
	
		list of trash types
		
	*/
	
	trashType: ["potion", "clothing", "armor", "weapon", "art"],
	
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
	
	/*
	
		list of defense types
		
	*/
	
	defenseType: [ "excuse", "appease", "flatter", "blame", "confuse" ],
	
	/*
	
		table of defenses
		
	*/
	
	defense: [
	
		{
			text: "Easy's had a rough life. He tends to lash out.",
			type: "excuse",
			keys: [ "life", "anger", "past", "regret" ]
		}
	],
	
	/*
	
		table of ghostly attacks
		
	*/
	
	attack: [
	
		{
			text: "Insinuation of Personal Mortality",
			damage: 1
		}
	]
			
};
