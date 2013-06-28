<?php

class RootURLController extends Controller {

	private static $project_types = array(
		'Project',
		'Workshop',
		'Excursion',
		'Exhibition'
	);

	private static $url_handlers = array(
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

	public function getDataArray($className, $id = null, $where = null, $sort = null) {
		// try to get it from chace
		
		$aggregate = JJ_RestfulServer::getAggregate($className, ($id ? array($id) : null));
		$cacheKey = JJ_RestfulServer::convertToCacheKey(($id ? $id . '_' : '') . $aggregate . ($where ? '_' . sha1($where) : '') . ($sort ? '_' . $sort[0] . '_' . $sort[1] : '') . '_InitData');

		$cache = SS_Cache::factory('Root_InitData_' . $className);
		$result = $cache->load($cacheKey);

		if ($result) {
			$result = unserialize($result);
		}
		else {
			if ($id) $where = "\"ID\" = $id";

			$result = DataList::create($className);
			if ($where) $result = $result->where($where);
			if ($sort) $result = $result->sort($sort[0], $sort[1]);

			$result = $result->toArray();
		
			$cache->save(serialize($result));
		}

		return new ArrayList($result);
	}

	public function getInitData($params) {

		
		$returnVal = '';

		/**
		 *defaults 
		 */
		// User + his/her Person
		$userData = singleton('User_RestApiExtension')->getData();
		$de = new JJ_DataElement('current-member', $userData, 'json', 'view');
		$returnVal .= $de->forTemplate();

		$currentPerson = null;
		if (isset($userData['PersonID']) && $id = $userData['PersonID']) {
			
			if ($currentPerson = $this->getDataArray('Person', (int) $id)->first()) {
				$returnVal .= $currentPerson->toDataElement('current-member-person')->forTemplate();
			}
		}

		switch ($params['Action']) {
			// about pages
			case 'about':
				if (isset($params['OtherAction']) && $urlSlug = Convert::raw2sql($params['OtherAction'])) {
					if (isset($params['ID']) && $uglyHash = Convert::raw2sql($params['ID'])) {
						// detailed project
						if ($detailed = $this->getDetailedProjectTypeByUglyHash($uglyHash)) {
							$returnVal .= $detailed->toDataElement('detailed-' . strtolower($detailed->class) . '-item', null)->forTemplate();
						}
					} 
					// person page
					else if ($person = ($currentPerson && $currentPerson->UrlSlug == $urlSlug) ? $currentPerson : $this->getDataArray('Person', null, "UrlSlug='$urlSlug'")->first()) {
						$returnVal .= $person->toDataElement('detailed-person-item', null)->forTemplate();
					}
				} else {
					// simple about page with statement, groupimage and people, yo!
					// group image
					$dataEl = new JJ_DataElement('groupimage', $this->getDataArray('GroupImage'), null);
					$returnVal .= $dataEl->forTemplate();
					// get the persons
					$persons = $this->getDataArray('Person', null, "IsExternal=0", array('Surname', 'ASC'));
					$dataEl = new JJ_DataElement('about-persons', $persons, null, 'view.about_init');
					$returnVal .= $dataEl->forTemplate();
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
						$portfolio = $this->getDataArray($type, null, 'IsPortfolio=1');
						$dataEl = new JJ_DataElement('portfolio-' . strtolower($type), $portfolio, null, 'view.portfolio_init');
						$returnVal .= $dataEl->forTemplate();
					}
				}
				break;

			// calendar pages
			case 'calendar':
				// check if detailed
				if (isset($params['OtherAction']) && $slug = Convert::raw2sql($params['OtherAction'])) {
					if ($detailedCalendarItem = $this->getDataArray('CalendarEntry', null, "UrlHash='$slug'")->first()) {
						$returnVal .= $detailedCalendarItem->toDataElement('detailed-calendar-item', null)->forTemplate();
					}
				} else {
					// @todo: whole calendar
				}
				break;

			// index page
			case null:
				// get featured projects/workshops/exhibtions/excursions
				foreach (self::$project_types as $type) {
					$featured = $this->getDataArray($type, null, 'IsFeatured=1');
					$dataEl = new JJ_DataElement('featured-' . strtolower($type), $featured, null, 'view.portfolio_init');
					$returnVal .= $dataEl->forTemplate();
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
		$flipped = array_flip(UglyHashExtension::get_class_enc());
		$className = $flipped[substr($uglyHash, 0, 1)];
		if ($className) {
			$detailed = $this->getDataArray($className, null, "UglyHash='$uglyHash'")->first();
		}

		return $detailed;
	}

}