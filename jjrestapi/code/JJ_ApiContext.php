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
		$this->subContext = (string) $value;
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