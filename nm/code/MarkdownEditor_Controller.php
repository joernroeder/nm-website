<?php

class MarkdownEditor_Controller extends Controller {

	/*private static $url_handlers = array(
		'$Action/$ID/$OtherID' 	=> 'handleAction'
	);
*/
	private static $allowed_actions = array(
		'oembed'
	);

	protected $current_member = null;

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