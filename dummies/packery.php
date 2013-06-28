<?php 
$bodyClass = 'index';
$hideBadge = false;

include './includes/header.inc.php' ?>

<div class="packery-wrapper">
	<div class="packery-test">
		<div class="packery">

			<!-- left top -->
			<div class="stamp corner left top"></div>
			<div class="stamp top"></div>
			<div class="stamp left"></div>

			<!-- right top -->
			<div class="stamp corner right top"></div>
			<div class="stamp top right"></div>
			<div class="stamp right"></div>

			<!-- left bottom -->
			<div class="stamp corner left bottom"></div>
			<div class="stamp bottom"></div>
			<div class="stamp left bottom"></div>

			<div class="stamp corner right bottom"></div>
			<div class="stamp bottom right-left"></div>
			<div class="stamp right bottom"></div>			



			<?php
			for ($i = 0; $i < 20; $i++) : 
				$min = (int) rand(20, 160);
				$x = (int) rand($min, 300);
				$x = $x - $x % 20;
				$y = (int) rand($min, 300);
				$y = $y - $y % 20;
				?>
				<article class="packery-item">
					<a href="">
						<img src="http://placekitten.com/g/<?php echo $x; ?>/<?php echo $y; ?>" width="<?php echo $x; ?>" height="<?php echo $y; ?>">
					</a>
					<section>
						<header>
							<h1>Test</h1>
							<p>Jörn Röder &amp; Jonathan Pirnay // Sept 2011</p>
						</header>
						<p>
							Maecenas faucibus mollis interdum. Aenean lacinia bibendum nulla sedconsectetur. Vivamus sagittis lacus.<br>
							These special contracts are so called ‚EULA‘s (end-user license agreements) Highly controvervt liabilities based on a „take it or leave it“ mentality.In most cases the user has to agree to those EULAs after purchasing thesoftware.
						</p>
						<a href="#" class="btn">Read More</a>
					</section>
				</article>
			<?php endfor; ?>
		</div>
	</div>
</div>

<?php include './includes/footer.inc.php' ?>