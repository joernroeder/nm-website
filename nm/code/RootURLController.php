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
		$params = $request->params();
		$initialData = $this->getInitData($params);
		$getVars = $request->getVars();
		if (isset($getVars['_escaped_fragment_'])) {
			// Google bot
			return $this->searchEngineResponse($params);
		} else {
			return $this->customise(array(
				'InitialData'	=> $initialData
			));
		}
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

	public function searchEngineResponse($params) {
		$templates = array();
		$customise = array();

		switch ($params['Action']) {
			// about pages
			case 'about':
				$person = null;
				$detailed = null;
				if (isset($params['OtherAction']) && $urlSlug = Convert::raw2sql($params['OtherAction'])) {
					$person = $this->getDataArray('Person', null, "UrlSlug='$urlSlug'")->first();
					if (isset($params['ID']) && $uglyHash = Convert::raw2sql($params['ID'])) {
						// detailed project
						$detailed = $this->getDetailedProjectTypeByUglyHash($uglyHash);
						$detailed = ($detailed && $detailed->canView()) ? $detailed : null;
					} 
					
					if (!$person) return $this->fourOhFour();
					$customise = array(
						'Title'		=> ($detailed ? $detailed->Title . ' - ' : '') . $person->getFullName() . ' - New Media Kassel',
						'Person'	=> $person ? $person : null,
						'Project'	=> $detailed ? $detailed : null
					);

					
					$templates[] = 'SearchController_' . ($detailed ? 'Project' : 'Person');

				} else {
					$groupImages = $this->getDataArray('GroupImage');

					// get the persons
					$persons = $this->getDataArray('Person', null, "IsExternal=0", array('Surname', 'ASC'));
					$templates[] = 'SearchController_About';
					$customise = array(
						'Title'			=> 'About - New Media Kassel',
						'GroupImages'	=> $groupImages,
						'Persons'		=> $persons
					);
				}
				break;
			// portfolio pages
			case 'portfolio':
				$uglyHash = '';
				// check if detailed
				if (isset($params['OtherAction'])) $uglyHash = Convert::raw2sql($params['OtherAction']);
				if ($uglyHash) {
					if ($detailed = $this->getDetailedProjectTypeByUglyHash($uglyHash) && $detailed->canView()) {
						$customise = array(
							'Title'		=> $detailed->Title . ' - Portfolio - New Media Kassel',
							'Project'	=> $detailed
						);

						$templates[] = 'SearchController_Project';
					}
				} else {
					// whole portfolio
					$portfolioList = new ArrayList();
					foreach (self::$project_types as $type) {
						foreach ($this->getDataArray($type, null, 'IsPortfolio=1') as $item) {
							if ($item->canView()) {
								$portfolioList->push($item);
							}
						}
						
					}
					$customise['Projects'] = $portfolioList;
					$customise['Title'] = 'Portfolio - New Media Kassel';
					$templates[] = 'SearchController_Portfolio';
				}
				break;
			// calendar pages
			case 'calendar':
				// check if detailed
				if (isset($params['OtherAction']) && $slug = Convert::raw2sql($params['OtherAction'])) {
					if ($detailedCalendarItem = $this->getDataArray('CalendarEntry', null, "UrlHash='$slug'")->first()) {
						$customise = array(
							'Title'		=> $detailedCalendarItem->Title . ' - New Media Kassel',
							'CalendarItem'	=> $detailedCalendarItem
						);
						$templates[] = 'SearchController_Calendar';
					}
				}
				break;
			// index page
			case null:
				// get featured projects/workshops/exhibtions/excursions
				$featuredList = new ArrayList();
				foreach (self::$project_types as $type) {
					foreach ($this->getDataArray($type, null, 'IsFeatured=1')->toArray() as $item) {
						if ($item->canView()) {
							$featuredList->push($item);
						}
					}
				}
				$customise['Projects'] = $featuredList;
				$customise['UpcomingEvents'] = singleton('UpcomingEvents_RestApiExtension')->getData();
				$customise['Title'] = 'New Media Kassel';

				$templates[] = 'SearchController_Portfolio';

				break;
			default:
				break;
		}	

		$templates[] = 'SearchController';
		return $this->customise($customise)->renderWith($templates);
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
					// categories
					$categories = $this->getDataArray('Category');
					$dataEl = new JJ_DataElement('category', $categories);
					$returnVal .= $dataEl->forTemplate();
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