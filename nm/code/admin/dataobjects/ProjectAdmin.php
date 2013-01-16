<?php

class ProjectAdmin extends ModelAdmin {

	public static $managed_models = array(
		'Project',
	);

	static $url_segment = 'projects';
	static $menu_title = 'Projects';

}