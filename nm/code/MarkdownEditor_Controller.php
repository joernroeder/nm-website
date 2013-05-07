<?php

class MarkdownEditor_Controller extends Controller {

	private static $url_handlers = array(
		'images/$ID/$OtherID'	=> 'images',
		'$Action/$ID/$OtherID' 	=> 'handleAction'
	);

	private static $allowed_actions = array(
		'images',
		'handleAction'
	);

	protected static $supported_class_types = array(
		'docimage'	=> 'DocImage'
	);

	protected static $preview_img_width = 300;
	protected static $preview_img_height = 300;

	protected $current_member = null;

	public function init() {
		parent::init();

		$this->current_member = Member::CurrentUserID() ? Member::CurrentUser() : null;
		if (!$this->current_member) return $this->methodNotAllowed();

		/**
		 * @todo: CSRF Protection (copy from JJ_RestfulServer.php)
		 */
	}

	public function index() {
		return $this->notFound();
	}

	public function images() {
		if ($this->request->isPOST()) {
			return $this->handleImageUpload();
		}
	}



	/**
	 * 
	 * ! - Upload
	 * 
	 */
	
	protected function handleImageUpload() {
		$response = array();

		$imageType = $this->urlParams['ID'];
		// get the necessary class type
		$imageType = isset(self::$supported_class_types[$imageType]) ? self::$supported_class_types[$imageType] : null;

		$postVars = $this->request->postVars();
		if (!$postVars || empty($postVars) || !$imageType) return $this->notFound();

		foreach ($postVars as $key => $fileRequest) {
			if ( !is_array($fileRequest) || !$fileRequest['tmp_name'] || $fileRequest['error'] ) return $this->methodFailed();
			if (strpos($fileRequest['type'], 'image') === false) return $this->unsupportedMediaType();

			// change the name to make it really unique
			$fileRequest['name'] = md5(time()) . '-' . $fileRequest['name'];
			
			// make the ResponsiveImage sublass
			$imgObj = new $imageType();
			$imgObj->write();

			// make the image
			$image = new ResponsiveImageObject();
			$u = new Upload();
			$u->loadIntoFile($fileRequest, $image);
			$image->OwnerID = $this->current_member->ID;
			$image->ResponsiveID = $imgObj->ID;
			$image->write();
			
			// preview
			$previewImage = $image->SetRatioSize(self::$preview_img_width, self::$preview_img_height);

			$response[] = array(
				'previewPath'	=> $previewImage->getURL(),
				'responsiveId'	=> $imgObj->ID
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