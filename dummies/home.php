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

<section class="gravity">
	<?php
		for ($i = 0; $i < 10; $i++) : 
			$min = (int) rand(50, 150);
			$x = (int) rand($min, 300);
			$y = (int) rand($min, 300);
			echo '<div class="gravity-item"><div><img src="http://placekitten.com/g/' . $x . '/' . $y . '" width="' . $x . '" height="' . $y . '"></div></div>' . "\n";
		endfor;
	?>
</section>

<?php include './includes/footer.inc.php' ?>