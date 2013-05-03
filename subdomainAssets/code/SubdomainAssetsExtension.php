<?php

class SubdomainAssetsExtension extends DataExtension {

	private static $domain_name = null;
	private static $subdomain_name = null;
	private static $subdomain_points_to_assets = null;

	public function setSubdomainName($value) {
		$this->owner->config()->subdomain_name =  (string) $value;
	}

	public function getSubdomainName() {
		$subdomainName = $this->owner->config()->subdomain_name;

		if ($subdomainName === null) {
			$subdomainName = Config::inst()->get('SubdomainAssetsConfig', 'subdomain_name');
		}
		
		return $subdomainName;
	}

	public function setSubdomainPointsToAssets($value) {
		$this->owner->config()->subdomain_points_to_assets = (bool) $value;
	}

	public function getSubdomainPointsToAssets() {
		$pointsToAssets = $this->owner->config()->subdomain_points_to_assets;

		if ($pointsToAssets === null) {
			$pointsToAssets = Config::inst()->get('SubdomainAssetsConfig', 'subdomain_points_to_assets');
		}

		return (bool) $pointsToAssets; 
	}

	public function getDomainName() {
		$domainName = $this->owner->config()->domain_name;
		if ($domainName === null) {
			$domainName = Config::inst()->get('SubdomainAssetsConfig', 'domain_name');
		}

		return $domainName ? Director::protocol() . $domainName . '/' : str_replace('://', '://' . $this->getSubdomainName() . '.', Director::absoluteBaseURL());
	}

	function SubdomainLink() {
		$abs = $this->getDomainName();

		$relative = $this->owner->RelativeLink();

		if ($this->getSubdomainPointsToAssets()) {
			$relative = str_replace(ASSETS_DIR . '/', '', $relative);
		}

		return $abs . $relative;
	}

}

