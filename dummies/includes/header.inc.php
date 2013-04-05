<?php

$nav = array(
	'about.php'		=> 'About',
	'detail.php'	=> 'Detail'
);

?><!doctype html>
<!--[if lt IE 9]><html class="ie"><![endif]-->
<!--[if gte IE 9]><!--><html><!--<![endif]-->

<!--
	The comment jumble above is handy for targeting old IE with CSS.
	http://paulirish.com/2008/conditional-stylesheets-vs-css-hacks-answer-neither/
-->
	
	<head>
		<meta charset="utf-8"/>
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
		<title>Golden Grid System Demo</title>
		
		<!-- Please don't add "maximum-scale=1" here. It's bad for accessibility. -->
		<meta name="viewport" content="width=device-width, initial-scale=1"/>
		
		<!-- Feel free to split the CSS into separate files, if you like. -->
		<link rel="stylesheet" href="/dummies/css/styles.css"/> 
		
		<!-- Here's Golden Gridlet, the grid overlay script. -->
		<script src="/dummies/js/ggs.js"></script>
		
		<!-- 
			This script enables structural HTML5 elements in old IE.
			http://code.google.com/p/html5shim/
		-->
		<!--[if lt IE 9]>
			<script src="//html5shim.googlecode.com/svn/trunk/html5.js"></script>
		<![endif]-->
	</head>
	
	<body lang="en" class="<?php echo $bodyClass; ?>">
		
		<!-- Wrapper -->
		<div id="wrapper">

			<?php if (!$hideBadge) : ?>
				<section class="badge">
					<a href="home.php">Neue Medien Kassel</a>

					<nav>
						<ul>
							<?php foreach($nav as $page => $title) : ?>
								<li><a href="<?php echo $page; ?>"><?php echo $title; ?></a></li>
							<?php endforeach; ?>
						</ul>
					</nav>
				</section>
			<?php endif; ?>

			<!-- Main container. -->
			<div id="main">
				<div id="layout" class="layout index">
			