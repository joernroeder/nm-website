<?php

class ExcursionAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Excursion',
	);

	static $url_segment = 'excursions';
	static $menu_title = 'Excursions';

}