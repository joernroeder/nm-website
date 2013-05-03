<?php

class SubdomainResponsiveImageObject extends ResponsiveImageObject {

	private static $extensions = array(
		'SubdomainAssetsExtension'
	);

	function Link() {
		$abs = str_replace('://', '://' . $this->getSubdomainName() . '.', Director::absoluteBaseURL());
		$relative = $this->RelativeLink();

		if ($this->getSubdomainPointsToAssets()) {
			$relative = str_replace(ASSETS_DIR . '/', '', $relative);
		}

		return $abs . $relative;
	}

}