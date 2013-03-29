<?php

class JJ_ApiContext {

	protected $operation = 'view';
	protected $subContext = '';

	public static function create_from_string($operation = 'view', $subContext = '') {
		$context = new self();

		if (strpos($operation, '.') !== false) {
			$contextData = explode('.', $operation);

			$operation = $contextData[0];
			unset($contextData[0]);

			$subContext = join($contextData, '.');
		}
		// use $operation as subContext and view as default operation
		/*else if (!$subContext) {
			$subContext = $operation;
			$operation = 'view';
		}*/

		$context->setOperation($operation);
		$context->setSubContext($subContext);

		return $context;
	}

	public static function create_from_array($value = array('operation' => 'view', 'context' => '')) {
		$context = new self();

		$value = (array) $value;

		if (!$value || empty($value)) return $context;

		if (isset($value['operation'])) {
			$this->setOperation($value['operation']);
		}

		if (isset($value['context'])) {
			$this->setSubContext($value['context']);
		}

		return $context;
	}

	public function __construct() {
	}

	public function setOperation($value) {
		$this->operation = (string) $value;
	}

	public function getOperation() {
		return $this->operation;
	}

	public function setSubContext($value) {
		$value = (string) $value;

		if (strpos($value, '.') !== false) {
			user_error("Use underscores instead of points to refine the context. '{$value}'", E_USER_WARNING);
			$value = str_replace('.', '_', $value);
		}

		$this->subContext = $value;
	}

	public function getSubContext() {
		return $this->subContext;
	}

	public function getContext() {
		return $this->hasSubContext() ? $this->getOperation() . '.' . $this->getSubContext() : $this->getOperation();
	}

	public function hasSubContext() {
		return $this->getSubContext() ? true : false;
	}

}