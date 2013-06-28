<?php

class Lists_Controller extends Controller {

	protected $currentUser = null;

	private static $url_handlers = array(
		'$Action/$OtherAction'	=> 'handleAction'
	);

	private static $allowed_actions = array(
		'all'
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
			$out[$type] = $this->getObjectsAsList($type, 'Title', 'IsPublished=1', 'Title');
		}

		$out['Category'] = $this->getObjectsAsList('Category', 'Title', '', 'Title');

		$out['Person'] = $this->getObjectsAsList('Person', 'FullName', '', 'Surname');

		return json_encode($out);

	}

	/**
	 * @todo JJ_Aggregate and Cache
	 */
	private function getObjectsAsList($className, $att, $where = '', $sortBy = null, $sortOrder = 'ASC') {
		$aggregate = JJ_RestfulServer::getAggregate($className);
		$cacheAtts = array(
			$className,
			$aggregate,
			$att,
			$where,
			($sortBy ? $sortBy . '_' . $sortOrder : ''),
			'ObjectList'
		);
		$cacheKey = JJ_RestfulServer::convertToCacheKey(implode('_', $cacheAtts));
		$cache = SS_Cache::factory('Root_ObjectList_' . $className);
		$result = $cache->load($cacheKey);

		if ($result) {
			$result = unserialize($result);
		} else {
			$objs = DataList::create($className)->where($where);
			if ($sortBy) $objs->sort($sortBy, $sortOrder);
	
			$result = array();
			
			foreach ($objs as $obj) {
				
				$theAtt = $obj->hasMethod($att) ? $obj->$att() : $obj->$att;
				
				if ($theAtt) {
					$result[] = array(
						'ID'		=> $obj->ID,
						'Title' 	=> $theAtt
					);	
				}
				
			}

			$cache->save(serialize($result));
		}

		

		return $result;
	}

}