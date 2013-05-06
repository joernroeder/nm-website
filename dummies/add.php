<!doctype html>
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
		<!--<link rel="stylesheet" href="/dummies/css/jquery.qtip.css"/> -->
		
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
	
	<body lang="en" class="editor">
		
		<!-- Wrapper -->
		<div id="wrapper">
			<section class="badge">
				<a href="home.php">Neue Medien Kassel</a>

				<nav>
					<ul>
						<li><a href="about.php">About</a></li>
						<li><a href="detail.php">Detail</a></li>
					</ul>
				</nav>
			</section>

			<!-- Main container. -->
			<div id="main">
				<div id="layout" class="layout index">
<!-- END Header inc -->


					<!-- Choose Project-Item List -->

					<ul class="project-type-list">
						<li>
							<a href="#" class="excursion">Excursion</a>
						</li>

						<li>
							<a href="#" class="exhibition">Exhibition</a>
						</li>

						<li>
							<a href="#" class="project">Project</a>
						</li>

						<li>
							<a href="#" class="workshop">Workshop</a>
						</li>
					</ul>

					<!-- Editor -->
					<section class="editor-sidebar open_" id="editor-sidebar">
						<nav>
							<ul>
								<li>
									<a href="#editor-sidebar">Editor</a>
								</li>

								<li>
									<a href="#foo">Switch</a>
								</li>

								<li>
									<a href="">Save</a>
								</li>
							</ul>
						</nav>

						<section class="editor-sidebar-content">
							<header>
								<h1>Test</h1>
								<input type="search" id="sidebar-search" placeholder="Fucki Search">
							</header>

							<ul class="image-list">
								<?php for ($i = 0; $i < 20; $i++) : ?>
									<li><a href="#" class="img">image <?php echo $i; ?></a></li>
								<?php endfor; ?>
							</ul>
						</section>
					</section>

<?php include './includes/footer.inc.php' ?>