<!DOCTYPE html>
<html lang="en">
<head>
	<% base_tag %>
	<meta charset="utf-8"/>
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
	<title>NM Website Boilerplate</title>
	
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

<body>
	<!-- JJRestApi.Structure -->
	$JJRestApi.Structure

	<!-- InitialData -->
	$InitialData

	<!-- Main container. Everything gets injected here. -->
	<div id="wrapper">
		<!-- This is our header which won't change. Ever. -->
		<section class="badge">
			<a href="/">Neue Medien Kassel</a>
			<nav>
				<ul>
					<li><a href="/about/">About</a></li>
					<li><a href="/portfolio/">Portfolio</a></li>
				</ul>
			</nav>
		</section>
		<!-- This is our Backbone Layout container -->
		<div id="main">

		</div>
	</div>

	<!-- Application source. -->
	<script data-main="/app/app/config" src="/app/assets/js/libs/require.js"></script>
</body>
</html>
