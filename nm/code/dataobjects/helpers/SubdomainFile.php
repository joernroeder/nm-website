<?php

class SubdomainFile extends File {

	function Link() {
		print_r("custom link");

		return parent::Link();
	}

}