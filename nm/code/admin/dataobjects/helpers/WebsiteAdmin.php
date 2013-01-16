<?php

class WebsiteAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Website',
	);

	static $url_segment = 'websites';
	static $menu_title = 'Websites';

}