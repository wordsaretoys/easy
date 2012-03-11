/**
	maintain heads up display, game readouts
	
	@namespace EASY
	@class hud
**/

EASY.hud = {

	MESSAGE_FADE_TIME: 500,
	MESSAGE_DELAY: 5000,

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
			curtain: jQuery("#curtain"),
			curtainMsg: jQuery("#curtain > div"),
			messages: jQuery("#messages")
		};

		this.dom.window.bind("resize", this.resize);			
		this.dom.window.bind("keydown", this.onKeyDown);
		
		this.dom.curtainMsg.resize = function() {
			this.offset({
				top: (EASY.display.height - this.height()) * 0.5,
				left: (EASY.display.width - this.width()) * 0.5
			});
		};
		this.dom.curtain.bind("mousedown", function() {
			return false;
		});
		
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

		dom.curtain.width(EASY.display.width);
		dom.curtain.height(EASY.display.height);
		
		dom.curtainMsg.resize();
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
				EASY.hud.showCurtain(EASY.hud.pauseMsg);
				SOAR.running = false;
			} else {
				EASY.hud.hideCurtain();
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
		display the curtain (a semi-transparent div) with a message
		
		@method showCurtain
		@param msg string containing message to display
	**/
	
	showCurtain: function(msg) {
		var dom = this.dom;
		dom.curtain.css("display", "block");
		dom.curtainMsg.html(msg);
		dom.curtainMsg.resize();
	},
	
	/**
		hide the curtain
		
		@method hideCurtain
	**/
	
	hideCurtain: function() {
		this.dom.curtain.css("display", "none");
	},
	
	/**
		adds a simple message to the HUD
		
		messages are stacked at the top of the screen, fading after
		a constant timeout, then removed from the DOM
		
		@method addMessage
		@param msg string containing message to display
	**/

	addMessage: function(msg) {
		var div = jQuery(document.createElement("div"));
		div.html(msg);
		div.css("display", "none");
		this.dom.messages.append(div);
		div.fadeIn(this.MESSAGE_FADE_TIME)
			.delay(this.MESSAGE_DELAY)
			.fadeOut(this.MESSAGE_FADE_TIME, function() {
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
