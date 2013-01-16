<?php

class ExhibitionAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Exhibition',
	);

	static $url_segment = 'exhibitions';
	static $menu_title = 'Exhibitions';

}