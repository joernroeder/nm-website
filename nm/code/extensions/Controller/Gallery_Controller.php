<?php

class Gallery_Controller extends Controller {

	protected $currentUser = null;
	protected $image_type = null;

	protected static $supported_class_types = array(
		'docimage'		=> 'DocImage',
		'personimage'	=> 'PersonImage'
	);

	private static $url_handlers = array(
		'$Action/$OtherAction'	=> 'handleAction'
	);

	public function init() {
		parent::init();

		if (Member::CurrentUserID()) {
			$this->currentUser = Member::CurrentUser();
		}	
	}

	/**
	 * This function gets the whole gallery of the user
	 * 
	 */
	public function gallery() {
		$gallery = array(
			'Person'	=> array(),
			'Projects'	=> array()
		);
		$member = $this->currentUser;
		if ($member && $person = $member->Person()) {
			// get the person images
			foreach ($member->PersonImages() as $img) {
				$gallery['Person'][] = $this->imageAsGalleryItem($img);
			}

			// get the project images
			foreach (array('Projects', 'Exhibitions', 'Workshops', 'Excursions') as $projectTypes) {
				foreach ($person->$projectTypes() as $project) {
					$projectData = array(
						'FilterID' => Convert::raw2att($project->class . '-' . $project->ID),
						'Title' => $project->Title
					);

					if ($project->canEdit($member)) {
						$projectData['Images'] = array();
						foreach ($project->Images() as $img) {
							$projectData['Images'][] = $this->imageAsGalleryItem($img);
						}
					}

					$gallery['Projects'][] = $projectData;
				}
			}
		}


		return json_encode($gallery);
	}


	/**
	 * Image uploads / fetching of specific images
	 */
	public function images() {
		if (!$this->currentUser) return $this->methodNotAllowed();

		$imageType = $this->urlParams['OtherAction'];
		// get the necessary class type
		$this->imageType = isset(self::$supported_class_types[$imageType]) ? self::$supported_class_types[$imageType] : null;



		if ($this->request->isPOST()) {
			return $this->handleImageUpload();
		} else
		if ($this->request->isGET()) {
			$out = array();
			$ids = $this->getIds();

			$list = DataList::create($this->imageType)->byIDs($ids);
	
			foreach ($list as $image) {
				/**
				 * @todo : check if member may get that image anyway
				 * 
				 */
				$out[] = array(
					'tag'	=> $image->forTemplate(),
					'id'	=> $image->ID
				);
			}

			return json_encode($out);
		}
	}

	protected function handleImageUpload() {
		$response = array();

		$postVars = $this->request->postVars();
		if (!$postVars || empty($postVars) || !$this->imageType) return $this->notFound();

		if ($this->imageType == 'DocImage') {
			$authenticated = false;

			// check if project may be edited
			$projectId = (int) $postVars['projectId'];
			$projectClass = $postVars['projectClass'];
			if (class_exists($projectClass)) {
				$project = DataObject::get_by_id($projectClass, $projectId);
				if ($project && $project->canEdit($this->currentUser)) $authenticated = true;
			}
			if (!$authenticated) return $this->methodNotAllowed();
		}

		foreach ($postVars as $key => $fileRequest) {
			if ( !is_array($fileRequest) || !$fileRequest['tmp_name'] || $fileRequest['error'] ) continue;
			if (strpos($fileRequest['type'], 'image') === false) continue;

			// change the name to make it really unique
			$fileRequest['name'] = md5(time()) . '-' . $fileRequest['name'];

			// make the ResponsiveImage subclass
			$imgObj = new $this->imageType();
			$imgObj->write();

			// make the image
			$image = new SubdomainResponsiveImageObject();
			$u = new Upload();
			$u->loadIntoFile($fileRequest, $image);
			$image->OwnerID = $this->currentUser->ID;
			$image->ResponsiveID = $imgObj->ID;
			$image->write();

			$galleryItem = $this->imageAsGalleryItem($imgObj, true);
			
			$galleryItem['UploadedToClass'] = $this->imageType;

			// handle uploads to a project
			if ($project) {
				$project->Images()->add($imgObj);
				$project->write();
				$galleryItem['FilterID'] = Convert::raw2att($project->class . '-' . $project->ID);	
			}
			
			$response[] = $galleryItem;
		}

		return json_encode($response);

	}

	/**
	 * Helpers
	 */

	private function getIds() {
		$ids = $this->request->getVar('ids');
		return explode(',', $ids);
	}

	private function imageAsGalleryItem($img, $includeTag = false) {
		$closest = $img->getClosestImage(150);
		$url = $closest ? $closest->CroppedImage(150,150)->getURL() : null;
		$a = array(
			'id'	=> $img->ID,
			'url'	=> $url
		);
		if ($includeTag) $a['tag'] = $img->forTemplate();
		return $a;
	}

	protected function methodNotAllowed() {
		$this->getResponse()->setStatusCode(405);
		$this->getResponse()->addHeader('Content-Type', 'text/plain');
		return "Method Not Allowed";
	}

}