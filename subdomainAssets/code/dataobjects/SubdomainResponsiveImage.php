<?php

class SubdomainResponsiveImage extends ResponsiveImage {

	private static $has_many = array(
		'Images' => 'SubdomainResponsiveImageObject'
	);

}