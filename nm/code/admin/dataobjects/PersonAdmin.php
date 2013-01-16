<?php

class PersonAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Person',
	);

	static $url_segment = 'persons';
	static $menu_title = 'Persons';

}