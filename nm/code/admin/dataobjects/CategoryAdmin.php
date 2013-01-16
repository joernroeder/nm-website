<?php

class CategoryAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Category',
	);

	static $url_segment = 'categories';
	static $menu_title = 'Categories';

}