<?php

class SubdomainImage extends Image {

	private static $extensions = array(
		'SubdomainAssetsExtension',
		'SubdomainFormattedImageExtension'
	);

	// maps subdomainAssetsExtension
	public function Link() {
		return $this->SubdomainLink();
	}

	// maps subdomainFormattedImageExtension
	public function getFormattedImage($format) {
		return call_user_func_array(array($this, "getFormattedSubdomainImage"), func_get_args());
		//return $this->getFormattedSubdomainImage($format);
	}

}


class SubdomainImage_Cached extends Image_Cached {
	
	private static $extensions = array(
		'SubdomainAssetsExtension'
	);

	// maps subdomainAssetsExtension
	public function Link() {
		return $this->SubdomainLink();
	}

}