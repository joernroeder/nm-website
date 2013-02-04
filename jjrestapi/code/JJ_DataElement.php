<?php

class JJ_DataElement extends ViewableData {

	/**
	 * Attribute prefix for API generated data elements
	 *
	 * @static
	 * @var string
	 */
	public static $att_prefix = 'api-';


	/**
	 * extension/formatter for api-elements
	 *
	 * @static
	 * @var string
	 */
	public static $default_extension = 'json';


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
	 * @param string name
	 * @param array|object data
	 * @param string $extension (optional)
	 */
	public function __construct($name, $data = array(), $extension = null) {
		$this->setName($name);
		$this->setData($data);

		if ($extension) {
			$this->setExtension($extension);
		}
	}


	/**
	 * Extension getter
	 *
	 * @return string extension
	 */
	public function extension() {
		return $this->extension ? $this->extension : self::$default_extension;
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
	 * formats and returns the data based on {@link getExtension()}
	 *
	 * @return string formatted data
	 */
	public function formattedData() {
		$data = $this->data();

		return $this->formatter()->convert($data);
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
		$output .= "\t</script>";

		return $output;
	}

}

