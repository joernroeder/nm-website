<?php

class RootURLController extends Controller {

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
				/* @todo handle about pages */
				break;

			// portfolio pages
			case 'portfolio':
				/* @todo handle portfolio pages */
				break;

			// index page
			case null:
				/* @todo handle index page */

				// get featured projects/workshops/exhibtions/excursions
				$types = array('Project', 'Workshop', 'Excursion', 'Exhibition');
				foreach ($types as $type) {
					$featured = $type::get()->where('IsFeatured=1');
					$returnVal .= $featured->toDataElement('featured-' . strtolower($type), null, 'view.portfolio_init')->forTemplate();
				}
				
				break;
			default:
				break;
		}

		return $returnVal;
	}

}