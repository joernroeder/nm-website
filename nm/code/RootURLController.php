<?php

class RootURLController extends Controller {

	static $project_types = array(
		'Project',
		'Workshop',
		'Excursion',
		'Exhibition'
	);

	static $url_handlers = array(
		'$Action/$OtherAction/$ID/$OtherID'	=> 'index'
	);

	/**
	 * resets the controller. there is nothing to reset yet, but it's required for the tests
	 */
	static function reset() {
	}

	function index($request) {
		$initialData = $this->getInitData($request->params());

		return $this->customise(array(
			'InitialData'	=> $initialData
		));
	}

	public function getInitData($params) {
		$returnVal = '';
		switch ($params['Action']) {
			// about pages
			case 'about':
				if (isset($params['OtherAction']) && $urlSlug = Convert::raw2sql($params['OtherAction'])) {
					if (isset($params['ID']) && $uglyHash = Convert::raw2sql($params['ID'])) {
						// detailed project
						if ($detailed = $this->getDetailedProjectTypeByUglyHash($uglyHash)) {
							$returnVal .= $detailed->toDataElement('detailed-' . strtolower($detailed->class) . '-item', null)->forTemplate();
						}
					} else {
						// person page
						$returnVal .= DataObject::get_one('Person', "UrlSlug='$urlSlug'")->toDataElement('detailed-person-item', null)->forTemplate();
					}
				} else {
					// simple about page with statement, groupimage and people, yo!
					// group image
					$returnVal .= GroupImage::get()->toDataElement('groupimage', null)->forTemplate();
					// get the persons
					$persons = Person::get()->where("IsExternal=0")->sort('Surname', 'ASC');
					$returnVal .= $persons->toDataElement('about-persons', null, 'view.about_init')->forTemplate();
				}


				break;

			// portfolio pages
			case 'portfolio':
				$uglyHash = '';
				// check if detailed
				if (isset($params['OtherAction'])) $uglyHash = Convert::raw2sql($params['OtherAction']);

				if ($uglyHash && $uglyHash !== 'search') {
					if ($detailed = $this->getDetailedProjectTypeByUglyHash($uglyHash)) {
						$returnVal .= $detailed->toDataElement('detailed-' . strtolower($detailed->class) . '-item', null)->forTemplate();
					}
				} else {
					// whole portfolio
					foreach (self::$project_types as $type) {
						$portfolio = $type::get()->where('IsPortfolio=1');
						$returnVal .= $portfolio->toDataElement('portfolio-' . strtolower($type), null, 'view.portfolio_init')->forTemplate();
					}
				}
				break;

			// calendar pages
			case 'calendar':
				// check if detailed
				if (isset($params['OtherAction']) && $slug = Convert::raw2sql($params['OtherAction'])) {
					$detailedCalendarItem = DataObject::get_one('CalendarEntry', "UrlHash='$slug'");
					$returnVal .= $detailedCalendarItem->toDataElement('detailed-calendar-item', null)->forTemplate();
				} else {
					// @todo: whole calendar
				}
				break;

			// index page
			case null:
				// get featured projects/workshops/exhibtions/excursions
				foreach (self::$project_types as $type) {
					$featured = $type::get()->where('IsFeatured=1');
					$returnVal .= $featured->toDataElement('featured-' . strtolower($type), null, 'view.portfolio_init')->forTemplate();
				}

				// get upcoming calendar data
				$returnVal .= singleton('UpcomingEvents_RestApiExtension')->getData()->toDataElement('upcoming-calendar', null, 'view.upcoming_init')->forTemplate();

				break;
			default:
				break;
		}

		return $returnVal;
	}

	public function getDetailedProjectTypeByUglyHash(string $uglyHash) {
		$detailed = null;
		$flipped = array_flip(UglyHashExtension::$class_enc);
		$className = $flipped[substr($uglyHash, 0, 1)];
		if ($className) {
			$detailed = DataObject::get_one($className, "UglyHash='$uglyHash'");
		}
		return $detailed;
	}

}