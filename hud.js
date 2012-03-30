/**
	maintain heads up display, game readouts
	
	@namespace EASY
	@class hud
**/

EASY.hud = {

	COMMENT_FADE_TIME: 250,
	COMMENT_READ_TIME: 4000,
	
	LABEL: {
		wood: 0,
		oil: 1,
		coin: 2,
		resolve: 3
	},

	pauseMsg: "Press Esc To Resume",
	waitMsg: "Loading",
	
	endingMsg: {
		resolve: "<p>You've Gained the Confidence to Seek Your Own Path.</p><p>Leave the Cave and Send Easy the Bill.</p>",
		money: "<p>You've Made Enough Coin to Leave the Cave</p><p>(sadly, you'll probably be back soon enough)</p>",
		playagain: "<p>Press F5 to Play Again</p>"
	},
	
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
			
			collect: {
				oil: jQuery("#oil"),
				wood: jQuery("#wood"),
				coin: jQuery("#coin")
			},
			resolve: jQuery("#resolve"),
			maxResolve: jQuery("#max-resolve")
			
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
		
		// prevent highlighting of message text
		this.dom.message.bind("mousedown", function() {
			return false;
		});
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
		@param hey boolean, true if we should flash
	**/

	comment: function(msg, who, hey) {
		var div = jQuery(document.createElement("div"));
		div.addClass(who);
		div.html(msg);
		div.css("display", "none");
		this.dom.comment.append(div);
		if (hey) {
			div.fadeTo(50, 0).fadeTo(50, 1)
				.fadeTo(50, 0).fadeTo(50, 1)
				.fadeTo(50, 0).fadeTo(50, 1)
				.fadeTo(this.COMMENT_FADE_TIME, 0.5)
				.delay(this.COMMENT_READ_TIME)
				.hide(this.COMMENT_FADE_TIME, function() {
					div.remove();
				});
		} else {
			div.fadeTo(this.COMMENT_FADE_TIME, 0.5)
				.delay(this.COMMENT_READ_TIME)
				.hide(this.COMMENT_FADE_TIME, function() {
					div.remove();
				});
		}
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
		update collection readout
		
		@method setCollection
		@param type string, "wood" || "oil" || "coin"
		@param value number, how much of the type player holds now
	**/
	
	setCollection: function(type, value) {
		var collect = this.dom.collect[type];
		var current = parseInt(collect.html(), 10);
		if (value !== current) {
			collect.html(value);
			collect.fadeTo(50, 0).fadeTo(50, 1)
				.fadeTo(50, 0).fadeTo(50, 1)
				.fadeTo(50, 0).fadeTo(50, 1);
		}
	},
	
	/**
		set resolve readout
		
		@method setResolve
		@param value number, current resolve
		@param total number, maximum possible resolve
	**/
	
	setResolve: function(value, total) {
		var current = parseInt(this.dom.resolve.html(), 10);
		if (value !== current) {
			this.dom.resolve.html(value);
			this.dom.resolve.fadeTo(50, 0).fadeTo(50, 1)
				.fadeTo(50, 0).fadeTo(50, 1)
				.fadeTo(50, 0).fadeTo(50, 1);
		}

		current = parseInt(this.dom.maxResolve.html(), 10);
		if (total !== current) {
			this.dom.maxResolve.html(total);
			this.dom.maxResolve.fadeTo(50, 0).fadeTo(50, 1)
				.fadeTo(50, 0).fadeTo(50, 1)
				.fadeTo(50, 0).fadeTo(50, 1);
		}
		
	},
	
	/**
		set up an end screen and stop the game
		
		@method endGame
		@param ending string, which ending to display
	**/

	endGame: function(ending) {
		var msg = this.endingMsg[ending] + this.endingMsg["playagain"];
		this.darken(msg);
		SOAR.running = false;
		this.dom.window.unbind("keydown");
		this.dom.tracker.unbind();
	}
};
