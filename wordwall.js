/**
	generate and animate the wall of words, 
	the player's only weapon against ghosts
	
	@namespace EASY
	@class wordwall
**/

EASY.wordwall = {

	MAX_RADIUS: 15,
	EXPAND_RATE: 20,
	
	active: false,
	radius: 0,
	attack: "",
	damage: false,

	/**
		initialize shaders and persistent objects
		
		@method init
	**/

	init: function() {
	
	},
	
	/**
		generate a wordwall of a particular attack type
		
		recognized attacks: excuse, appease, flatter, blame, confuse
		
		@method spawn
		@param type string, attack type
	**/
	
	spawn: function(type) {
		if (!this.active) {
			this.active = true;
			this.radius = 0;
			this.attack = type;
			this.damage = false;
			EASY.hud.addMessage("Attacked with " + type);
		}
	},
	
	/**
		update the wordwall expansion and fire off
		damage whenever called for
		
		@method update
	**/
	
	update: function() {
		var dt, dd;

		if (this.active) {

			dt = SOAR.interval * 0.001;
			dd = EASY.ghost.position.distance(EASY.player.footPosition);
		
			if (dd < this.MAX_RADIUS && !this.damage) {
				EASY.ghost.weaken(this.attack);
				this.damage = true;
			}

			this.radius = Math.min(
				this.radius + this.EXPAND_RATE * dt,
				this.MAX_RADIUS
			);
			
			if (this.radius === this.MAX_RADIUS) {
				this.active = false;
			}
		}
	}
};