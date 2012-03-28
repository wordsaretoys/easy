/**
	maintain heads up display, game readouts
	
	@namespace EASY
	@class hud
**/

EASY.hud = {

	COMMENT_FADE_TIME: 100,
	COMMENT_READ_TIME: 4000,
	
	LABEL: {
		wood: 0,
		oil: 1,
		coin: 2,
		resolve: 3,
		grace: 4
	},

	pauseMsg: "Press Esc To Resume",
	waitMsg: "Loading",
	
	/**
		establish jQuery shells around UI DOM objects &
		assign methods for simple behaviors (resize, etc)
		
		@method init
	**/
	
	init: function() {

		this.dom = {
			window: jQuery(window),
			comment: jQuery("#comment"),
			tracker: jQuery("#tracker"),
			message: jQuery("#message"),
			prompts: jQuery("#prompts"),
			
			value: jQuery(".value")
			
		};

		this.dom.prompts.shown = false;
		this.dom.prompts.resize = function() {
			var p = EASY.hud.dom.prompts;
			p.offset({
				top: (EASY.display.height - p.height()) * 0.75,
				left: (EASY.display.width - p.width()) * 0.5
			});
		};

		this.dom.window.bind("resize", this.resize);			
		this.dom.window.bind("keydown", this.onKeyDown);
		this.resize();
	},

	/**
		adjust UI elements in response to browser window resize

		some elements are attached to the edges via CSS, and do
		not require manual resizing or recentering
		
		@method resize
	**/

	resize: function() {
		var dom = EASY.hud.dom;

		dom.tracker.width(EASY.display.width);
		dom.tracker.height(EASY.display.height);
		
		dom.message.offset({
			top: (EASY.display.height - dom.message.height()) * 0.5,
			left: (EASY.display.width - dom.message.width()) * 0.5
		});
		
		dom.prompts.resize();
	},
	
	/**
		handle a keypress
		
		note that the hud object only handles keys related to 
		HUD activity. see player.js for motion control keys
		
		@method onKeyDown
		@param event browser object containing event information
		@return true to enable default key behavior
	**/

	onKeyDown: function(event) {
		switch(event.keyCode) {
		case SOAR.KEY.ESCAPE:
			if (SOAR.running) {
				EASY.hud.darken(EASY.hud.pauseMsg);
				SOAR.running = false;
			} else {
				EASY.hud.lighten();
				SOAR.running = true;
				EASY.player.mouse.invalid = true;
			}
			break;
		case SOAR.KEY.TAB:
			// prevent accidental TAB keypress from changing focus
			return false;
			break;
		case SOAR.KEY.E:
			if (EASY.hud.dom.prompts.shown) {
				switch(EASY.hud.dom.prompts.action) {
				case "cremate":
					EASY.player.cremate();
					break;
				}
			}
			break;
		default:
			//console.log(event.keyCode);
			break;
		}
	},
	
	/**
		darken the HUD with optional message
		
		used when the UI will be temporarily unresponsive
		
		@method darken
		@param msg string containing message to display
	**/
	
	darken: function(msg) {
		this.dom.tracker.css("background-color", "rgba(0, 0, 0, 0.5)");
		this.dom.message.html(msg);
		this.resize();
	},
	
	/**
		make the HUD fully visible again
		
		@method hideCurtain
	**/
	
	lighten: function() {
		this.dom.tracker.css("background-color", "rgba(0, 0, 0, 0)");
		this.dom.message.html("");
	},
	
	/**
		add an entry to the HUD commentary

		entries are appended to the comment box,
		growing as they fade in, then fading out
		after a delay. they are removed from the
		DOM once they are no longer visible.
		
		@method comment
		@param msg string, message to display
		@param who string, classname of speaker
	**/

	comment: function(msg, who) {
		var div = jQuery(document.createElement("div"));
		who = who || "player";
		div.addClass(who);
		div.html(msg);
		div.css("display", "none");
		this.dom.comment.append(div);
		div.show(this.COMMENT_FADE_TIME)
			.delay(this.COMMENT_READ_TIME)
			.hide(this.COMMENT_FADE_TIME, function() {
				div.remove();
			});
	},

	/**
		set player resolve display
		
		@method setPlayerResolve
		@param pc number, resolve as fraction of total
	**/
	
	setPlayerResolve: function(pc) {
		//this.dom.resolve.css("width", Math.floor(pc * 100) + "%");
	},
	
	/**
		set player money display
		
		@method setPlayerMoney
		@param n number, total amount of money
	**/
	
	setPlayerMoney: function(n) {
		//this.dom.money.html(n);
	},

	/**
		display prompt with specified message
		
		@method showPrompt
		@param key string, key to prompt for
		@param verb string, what the key does
		@param phrase string, what the verb acts on
		@param action string, what the action does
	**/
	
	showPrompt: function(key, verb, phrase, action) {
		var pr = this.dom.prompts;
		if (!pr.shown) {
			pr.html("<p><span class=\"key\">" + key + "</span>&nbsp;" + verb + "</p><p>" + phrase + "</p>");
			pr.resize();
			pr.css("visibility", "visible");
			pr.shown = true;
			pr.action = action;
		}
	},
	
	/**
		hide prompt
		
		@method hidePrompt
	**/
	
	hidePrompt: function() {
		var pr = this.dom.prompts;
		if (pr.shown) {
			pr.css("visibility", "hidden");
			pr.shown = false;
		}
	},
	
	/**
		update a particular player state readout
		
		@method setReadout
		@param label string, name of state to change (see this.LABEL)
		@param value string, state value
	**/
	
	setReadout: function(label, value) {
		var index = this.LABEL[label];
		this.dom.value[index].innerHTML = value;
	}

};
