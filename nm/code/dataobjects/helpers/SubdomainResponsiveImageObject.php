<?php

class SubdomainResponsiveImageObject extends ResponsiveImageObject {

	function Link() {
		print_r("custom image link");

		return parent::Link();
	}

}