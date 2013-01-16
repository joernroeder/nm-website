<?php

class WorkshopAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Workshop',
	);

	static $url_segment = 'workshops';
	static $menu_title = 'Workshops';

}