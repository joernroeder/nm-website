<?php

class Lists_Controller extends Controller {

	protected $currentUser = null;

	private static $url_handlers = array(
		'$Action/$OtherAction'	=> 'handleAction'
	);

	public function init() {
		parent::init();

		if (Member::CurrentUserID()) {
			$this->currentUser = Member::CurrentUser();
		}

		$this->addContentTypeHeader();
	}

	public function addContentTypeHeader() {
		$contentType = 'application/json; charset="utf-8"';
		$response = $this->getResponse();

		$response->removeHeader('Content-Type');
		$response->addHeader('Content-Type', $contentType);
	}

	/**
	 * This function returns basic lists (ID and Title/Name) of:
	 * 	- Project @todo : check if published
	 * 	- Exhibition @todo : check if published
	 * 	- Workshop @todo : check if published
	 * 	- Excursion @todo : check if published
	 * 	- Person
	 * 	- Category
	 * 	
	 */
	public function all() {
		$out = array();

		if (!$this->currentUser) return json_encode($out);
		
		foreach (array('Project', 'Exhibition', 'Excursion', 'Workshop') as $type) {
			$out[$type] = $this->getObjectsAsList($type, 'Title', '', 'Title');
		}

		$out['Category'] = $this->getObjectsAsList('Category', 'Title', '', 'Title');

		$out['Person'] = $this->getObjectsAsList('Person', 'FullName', '', 'Surname');

		return json_encode($out);

	}

	/**
	 * @todo JJ_Aggregate and Cache
	 */
	private function getObjectsAsList($className, $att, $where = '', $sortBy = null, $sortOrder = 'ASC') {
		$objs = DataList::create($className)->where($where);
		if ($sortBy) $objs->sort($sortBy, $sortOrder);

		$out = array();
		
		foreach ($objs as $obj) {
			
			$theAtt = $obj->hasMethod($att) ? $obj->$att() : $obj->$att;
			
			if ($theAtt) {
				$out[] = array(
					'ID'	=> $obj->ID,
					$att 	=> $theAtt
				);	
			}
			
		}

		return $out;
	}

}