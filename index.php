<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<title>caves are easy</title>
		<link rel="stylesheet" type="text/css" media="screen" href="easy.css">
		<link rel="stylesheet" type="text/css" media="screen" href="/shared/toybox.css">
		<script type="text/javascript" src="/shared/jquery-1.7.1.js"></script>

		<script type="text/javascript" src="/debug/soar/soar.js"></script>
		<script type="text/javascript" src="/debug/soar/vector.js"></script>
		<script type="text/javascript" src="/debug/soar/quaternion.js"></script>
		<script type="text/javascript" src="/debug/soar/rotator.js"></script>
		<script type="text/javascript" src="/debug/soar/noise.js"></script>
		<script type="text/javascript" src="/debug/soar/camera.js"></script>
		<script type="text/javascript" src="/debug/soar/mesh.js"></script>
		<script type="text/javascript" src="/debug/soar/shader.js"></script>
		<script type="text/javascript" src="/debug/soar/texture.js"></script>
		<script type="text/javascript" src="/debug/soar/display.js"></script>

		<script type="text/javascript" src="/debug/easy/easy.js"></script>
		<script type="text/javascript" src="/debug/easy/canvasser.js"></script>
		<script type="text/javascript" src="/debug/easy/world.js"></script>
		<script type="text/javascript" src="/debug/easy/hud.js"></script>
		<script type="text/javascript" src="/debug/easy/player.js"></script>
		<script type="text/javascript" src="/debug/easy/cave.js"></script>
		<script type="text/javascript" src="/debug/easy/paddler.js"></script>

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
		<?php include($_SERVER["DOCUMENT_ROOT"] . "/shared/toybox.php"); ?>
		<canvas id="gl"></canvas>
		<?php include("hud.html"); ?>
	</body>
</html>
