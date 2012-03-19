/**
	maintain heads up display, game readouts
	
	@namespace EASY
	@class hud
**/

EASY.hud = {

	LOG_FADE_TIME: 500,
	LOG_DELAY: 5000,

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
			log: jQuery("#log"),
			tracker: jQuery("#tracker"),
			message: jQuery("#message")
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
			}
			break;
		case SOAR.KEY.TAB:
			// prevent accidental TAB keypress from changing focus
			return false;
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
		adds an entry to the HUD log
		
		entries are appended to the end of the log,
		then fade, and are removed from the DOM
		
		@method log
		@param msg string, message to display
		@param type string, optional message class
	**/

	log: function(msg, type) {
		var div = jQuery(document.createElement("div"));
		if (type) {
			div.addClass(type);
		}
		div.html(msg);
		div.css("display", "none");
		this.dom.log.append(div);
		div.fadeIn(this.LOG_FADE_TIME)
			.delay(this.LOG_DELAY)
			.fadeOut(this.LOG_FADE_TIME, function() {
				div.remove();
		});
	},
	
	/**
		determines which indefinite article applies to a noun
		
		not 100%, but hopefully good enough
		
		@method getArticle
		@param noun the noun or phrase to check
		@return the proper atricle to prepend
	**/
	
	getArticle: function(noun) {
		var ch = noun.charAt(0).toLowerCase();
		return "aeiou".indexOf(ch) != -1 ? "an" : "a";
	}

};
