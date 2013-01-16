<?php

class CalendarEntryAdmin extends ModelAdmin {

	public static $managed_models = array(
		'CalendarEntry',
	);

	static $url_segment = 'calendarentries';
	static $menu_title = 'CalendarEntries';

}