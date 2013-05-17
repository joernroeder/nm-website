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

		<style type="text/css">
			.preview {
				width: 100%;
				height: 400px;
			}

			*[data-editor-type="markdown"] {
				padding-bottom: 40px;
			}
			*[data-editor-type="markdown"] img {
				max-width: 100%;
				height: auto;
			}

			.dropzone {
				width: 100%;
				height: 50px;
				background: pink;
			}

			.gravity-item > a {
				width: 160px;
				height: 160px;
				background: gray;
			}
		</style>
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

					<!--
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
					-->

					<!-- Overview -->

					<section class="overview" data-editor-scope="\Foo">
						<article class="gravity-item">
							<a href="/{{LinkTo}}/{{UglyHash}}/">
								<!--{{#with PreviewImage.Urls._320}}-->
									<img src="http://placedog.com/160/160" width="{{Width}}" height="{{Height}}"/>
								<!--{{/with}}-->
							</a>
							<section class="meta">
								<header data-editor-scope="\Person">
									<h1>
										<a href="/{{LinkTo}}/{{UglyHash}}/" data-editor-type="inline" data-editor-name="\My.Fucki.Image.Title">{{Title}}</a>
									</h1>
									<p><span data-editor-type="date" data-editor-name="Date" data-editor-options='{"date": {"format": "Y"}}'>{{Date}}</span></p>
								</header>
								<p data-editor-type="markdown-split" data-editor-name="Description">
# h1

MarkdownedTeaser
</p>
								<p data-editor-type="markdown" data-editor-name="\Project.Description">MarkdownedTeaser</p>

								<div data-editor-scope="\My.Fucki">
									<a href="/{{LinkTo}}/{{UglyHash}}/" data-editor-type="inline" data-editor-name="Image.Test">{{Test}}</a>
									<div data-editor-scope="Image">
										<a href="/{{LinkTo}}/{{UglyHash}}/" data-editor-type="inline" data-editor-name="Test">{{Test}}</a>
										<a href="/{{LinkTo}}/{{UglyHash}}/" data-editor-type="inline" data-editor-name="Title">{{Title}}</a>
									</div>
								</div>
							</section>
						</article>
					</section>
				</div>
			</div>
	
			<!-- Editor Sidebar -->
			<?php $projects = 10; ?>
			<section class="editor-sidebar" id="editor-sidebar">
				<nav>
					<ul>
						<li>
							<a href="#" data-editor-sidebar-content="user">User</a>
						</li>
						<li>
							<a href="#">Log out</a>
						</li>
					</ul>
					<ul>
						<li>
							<a href="#" id="toggle-editor-sidebar">Editor</a>
						</li>

						<li>
							<a href="#foo">Switch View</a>
						</li>

						<li>
							<a href="#">Save</a>
						</li>
					</ul>
				</nav>

				<div class="editor-sidebar-container">
					<!-- User -->
					<header class="editor-header hideable">
						<div class="img">
						</div>
						<hgroup>
							<h1>Foo Bar</h1>
							<p>joernroeder@gmail.com</p>
						</hgroup>
					</header>
					<section class="editor-sidebar-content scrollbox">
						<section>
							<h2>Foo</h2>
						</section>
					</section>

					<!-- Gallery -->
					<!--
					<header class="editor-header">
						<h1>Images</h1>
						<select class="filter">
							<option value="">Choose Project</option>
							<?php for ($j = 0; $j < $projects; $j++) : ?>
								<option value="<?php echo $j; ?>">Option <?php echo $j; ?></option>
							<?php endfor; ?>
						</select>
					</header>
					<section class="editor-sidebar-content scrollbox">
						<?php for ($k = 0; $k < $projects; $k++) : ?>
								<section data-filter-id="<?php echo $k; ?>">
									<header>
										<h2>Project <?php echo $k; ?></h2>
									</header>
									<ul class="image-list">
										<?php for ($i = 0; $i < 30; $i++) : ?>
											<li><a href="#"><img src="_http://placedog.com/100/100" alt=""></a></li>
										<?php endfor; ?>
									</ul>
								</section>
							<?php endfor; ?>
					</section>
					-->
				</div>
			</section>
		</div>

<?php include './includes/footer.inc.php' ?>