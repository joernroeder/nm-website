<?php

class SubdomainResponsiveImageObject extends ResponsiveImageObject {

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
	}

}

