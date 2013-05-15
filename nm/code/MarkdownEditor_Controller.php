<?php

class MarkdownEditor_Controller extends Controller {

	/*private static $url_handlers = array(
		'$Action/$ID/$OtherID' 	=> 'handleAction'
	);
*/
	private static $allowed_actions = array(
		'images',
		'oembed'
	);

	protected static $supported_class_types = array(
		'docimage'		=> 'DocImage',
		'personimage'	=> 'PersonImage'
	);

	protected static $preview_img_width = 300;
	protected static $preview_img_height = 300;

	protected $current_member = null;
	protected $image_type = null;

	public function isAuthorized() {
		$this->current_member = Member::CurrentUserID() ? Member::CurrentUser() : null;
		return $this->current_member ? true : false;

		/**
		 * @todo: CSRF Protection (copy from JJ_RestfulServer.php)
		 */
	}

	public function index(SS_HTTPRequest $request = null) {
		if (!$this->urlParams['Action']) {
			return $this->notFound();
		}
	}

	public function images() {
		if (!$this->isAuthorized()) return $this->methodNotAllowed();

		$imageType = $this->urlParams['ID'];
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
				$out[] = array(
					'tag'	=> $image->forTemplate(),
					'id'	=> $image->ID
				);
			}

			return json_encode($out);
		}
	}

	public function oembed() {
		if (!$this->isAuthorized()) return $this->methodNotAllowed();

		if ($this->request->isGET()) {
			$out = array();
			$ids = $this->getIds();
			
			foreach ($ids as $shortcode) {
				$oembed = Oembed::handle_shortcode(array('width' => '200'), $shortcode, null, null);
				$out[] = array(
					'tag'	=> $oembed,
					'id'	=> $shortcode
				);
			}

			return json_encode($out);
		} else return $this->notFound();
	}

	private function getIds() {
		$ids = $this->request->getVar('ids');
		return explode(',', $ids);
	}



	/**
	 * 
	 * ! - Upload
	 * 
	 */
	
	protected function handleImageUpload() {
		$response = array();

		$postVars = $this->request->postVars();
		if (!$postVars || empty($postVars) || !$this->imageType) return $this->notFound();

		foreach ($postVars as $key => $fileRequest) {
			if ( !is_array($fileRequest) || !$fileRequest['tmp_name'] || $fileRequest['error'] ) return $this->methodFailed();
			if (strpos($fileRequest['type'], 'image') === false) return $this->unsupportedMediaType();

			// change the name to make it really unique
			$fileRequest['name'] = md5(time()) . '-' . $fileRequest['name'];

			// make the ResponsiveImage subclass
			$imgObj = new $this->imageType();
			$imgObj->write();

			// make the image
			$image = new SubdomainResponsiveImageObject();
			$u = new Upload();
			$u->loadIntoFile($fileRequest, $image);
			$image->OwnerID = $this->current_member->ID;
			$image->ResponsiveID = $imgObj->ID;
			$image->write();


			$response[] = array(
				'tag'	=> $imgObj->forTemplate(),
				'id'	=> $imgObj->ID
			);
		}

		return json_encode($response);

	}


	/**
	 * Different responses
	 */

	protected function methodFailed() {
		$this->getResponse()->setStatusCode(424);
		$this->getResponse()->addHeader('Content-Type', 'text/plain');
		return "Method Failed";
	}

	protected function notFound() {
		// return a 404
		$this->getResponse()->setStatusCode(404);
		$this->getResponse()->addHeader('Content-Type', 'text/plain');
		return "Four oh four bitch";
	}
	
	protected function methodNotAllowed() {
		$this->getResponse()->setStatusCode(405);
		$this->getResponse()->addHeader('Content-Type', 'text/plain');
		return "Method Not Allowed";
	}
	
	protected function unsupportedMediaType() {
		$this->response->setStatusCode(415); // Unsupported Media Type
		$this->getResponse()->addHeader('Content-Type', 'text/plain');
		return "Unsupported Media Type";
	}

	protected function permissionFailure() {
		// return a 401
		$this->getResponse()->setStatusCode(401);
		$this->getResponse()->addHeader('WWW-Authenticate', 'Basic realm="API Access"');
		$this->getResponse()->addHeader('Content-Type', 'text/plain');
		return "No access.";
	}

}