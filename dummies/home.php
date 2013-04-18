<?php 
$bodyClass = 'index';
$hideBadge = false;

include './includes/header.inc.php' ?>

<section class="calendar">
	<h1>Kalender</h1>
	<ul>
		<li>
			<a href="#">
				<time datetime="">02.02.2013</time>
				Sem Cursus Etiam Porta Ornare
			</a>
		</li>
		<li>
			<a href="#">
				<time datetime="">88.88.2013 - 01.01.2014</time>
				Pellentesque Ipsum Cursus
			</a>
		</li>
		<li>
			<a href="#">
				<time datetime="">88.88.2013</time>
				Vehicula Ornare Quam
			</a>
		</li>
	</ul>
	<a href="#" class="btn">Foo</a>
</section>

<div>
	<section class="gravity">
	<?php
		for ($i = 0; $i < 10; $i++) : 
			$min = (int) rand(50, 150);
			$x = (int) rand($min, 300);
			$y = (int) rand($min, 300);
			?>
			<article class="gravity-item">
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
	</section>
</div>

<?php include './includes/footer.inc.php' ?>