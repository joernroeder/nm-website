<?php

class CalendarEntryAdmin extends ModelAdmin {

	public static $managed_models = array(
		'CalendarEntry',
	);

	static $url_segment = 'calendar';
	static $menu_title = 'Calendar';

}