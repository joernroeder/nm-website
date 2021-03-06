<?php

class JJ_DataElement extends ViewableData {

	/**
	 * Attribute prefix for API generated data elements
	 *
	 * @static
	 * @var string
	 */
	private static $att_prefix = 'api-';


	/**
	 * extension/formatter for api-elements
	 *
	 * @static
	 * @var string
	 */
	private static $default_extension = 'json';


	/**
	 * Extension/formatter for this instance
	 *
	 * @var string
	 */
	protected $extension;


	/**
	 *
	 * @var string
	 */
	protected $name;

	/**
	 *
	 * @var string
	 */
	protected $context;

	/**
	 *
	 *
	 * @var array|object
	 */
	protected $data;

	/**
	 * DataFormatter instance
	 *
	 * @var DataFormatter
	 */
	protected $formatter;


	/**
	 * Constructor: Creates a new JJ_DataElement
	 *
	 * @param string $name
	 * @param array|object $data
	 * @param string $extension (optional)
	 * @param string $context (optional)
	 */
	public function __construct($name, $data = array(), $extension = null, $context = null) {
		$this->setName($name);
		$this->setData($data);

		$extension = $extension ? $extension : self::get_default_extension();
		$context = $context ? $context : JJ_ApiContext::create_from_string();
		
		$this->setExtension($extension);
		$this->setContext($context);
	}

	public static function get_default_extension() {
		return self::config()->default_extension;
	}


	/**
	 * Extension getter
	 *
	 * @return string extension
	 */
	public function extension() {
		return $this->extension;
	}

	/**
	 * Extension setter
	 *
	 * @param string $value Extenson (json|xml)
	 */
	public function setExtension($value) {
		$this->extension = $value;
		$this->formatter = DataFormatter::for_extension($value);
	}


	/**
	 * returns the Formatter
	 *
	 * @return DataFormatter
	 */
	public function formatter() {
		if (!$this->formatter) {
			$this->formatter = DataFormatter::for_extension($this->extension());
		}

		return $this->formatter;
	}


	/** 
	 * returns the name
	 *
	 * @return string
	 */
	public function name() {
		return $this->name;
	}


	/**
	 * returns the name with prefix {@link self::$att_prefix}
	 *
	 * @return string
	 */
	public function fullName() {
		return self::$att_prefix . $this->name();
	}


	/**
	 * Name setter
	 *
	 * @param string
	 */
	public function setName($value) {
		$this->name = $value;
	}	

	/** 
	 *
	 *
	 */
	public function data() {
		return $this->data;
	}


	/**
	 * Data setter
	 *
	 * @param array|object
	 */
	public function setData($value) {
		$this->data = $value;
	}

	/** 
	 *
	 *
	 */
	public function context() {
		return $this->context;
	}


	/**
	 * Context setter
	 *
	 * @param array
	 */
	public function setContext($value) {
		if (is_string($value)) {
			$this->context = JJ_ApiContext::create_from_string($value);
		}
		else if (is_array($value)) {
			$this->context = JJ_ApiContext::create_from_string($value);
		}
		else if (!$value instanceof JJ_ApiContext) {
			// throw error
		}
	}


	/**
	 * formats and returns the data based on {@link getExtension()}
	 *
	 * @return string formatted data
	 */
	public function formattedData() {
		$data = $this->data();
		$context = $this->context();
		$fields = null;
		$obj = null;

		if ($data instanceof Object) {
			if ($data instanceof SS_List) {
				if ($first = $data->first()) {
					$obj = singleton($first->ClassName);	
				} else return null;
			}
			
			$obj = $obj ? $obj : $data;

			$fields = $obj->getApiContextFields($context);
		}

		return $this->formatter()->convert($data, $fields);
	}


	/**
	 * returns the formatted data within a script tag.
	 *
	 * @example
	 * <script type="application/json" id="api-foo">
	 *	{"foo": "bar"}
	 * </script>
	 *
	 * @return string
	 */
	public function forTemplate() {
		$output = '<script type="application/' . $this->extension() . '" id="' . $this->fullName() . '">' . "\n";
		$output .= "\t\t" . $this->formattedData() . "\n";
		$output .= "\t</script>\n";

		return $output;
	}

}

