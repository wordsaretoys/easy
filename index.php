<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<title>easy does it</title>
		<link rel="stylesheet" type="text/css" media="screen" href="easy.css">
		<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>

		<script type="text/javascript" src="soar.js"></script>
		<script type="text/javascript" src="easy.js"></script>
		<script type="text/javascript" src="canvasser.js"></script>
		<script type="text/javascript" src="hud.js"></script>
		<script type="text/javascript" src="player.js"></script>
		<script type="text/javascript" src="cave.js"></script>
		<script type="text/javascript" src="trash.js"></script>
		<script type="text/javascript" src="ghost.js"></script>
		<script type="text/javascript" src="corpse.js"></script>
		
<?php
include("easy.glsl");
?>
		<script type="text/javascript">
			jQuery(window).bind("load", function() {
				EASY.start();
			});
		</script>
    </head>
	<body>
		<canvas id="gl"></canvas>
		<?php include("hud.html"); ?>
	</body>
</html>
