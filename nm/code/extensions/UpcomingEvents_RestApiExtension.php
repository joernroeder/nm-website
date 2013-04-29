<?php

class UpcomingEvents_RestApiExtension extends JJ_RestApiDataExtension {

	private static $extension_key = 'UpcomingEvents';

	private static $max_display_num = 3; // maximumg upcoming events to display

	private static $api_access = array(
		'view' => array(
			'DateRangeNice',
			'Title',
			'UrlHash'
		)
	);

	public function getData($extension = null) {
		$now = date('Y-m-d H:i:s');
		$num = self::$max_display_num;
		$events = DataList::create('CalendarEntry')->where("`EndDate` >= '$now'")->limit($num);
		$count = $events->count();

		if ($count < $num) {
			$restNum = $num - $count; 
			$pastEvents = DataList::create('CalendarEntry')->where("`EndDate` < '$now'")->limit($restNum);
			$eventsArray = array_merge($pastEvents->toArray(), $events->toArray());
			$events = new DataList('CalendarEntry');
			$events->addMany($eventsArray);
		}
		$events->sort('StartDate', 'ASC');
		return $events;
	}

}