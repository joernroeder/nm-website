<?php 

interface JJ_DataFormatter {

	/**
	 * returns the JJ_BaseDataFormatter instance.
	 * 
	 * @return JJ_BaseDataFormatter
	 */
	public function getBase();

	public function supportedExtensions();
	/**
	 *
	 * @param object $obj
	 * @param array $keys
	 *
	 * @return json object
	 */
	public function convertObj(DataObject $obj, $keys = null);

	/**
	 *
	 * @param SS_List $list
	 * @param array $fields
	 *
	 * @return array
	 */
	public function getDataList(SS_List $list, $fields = null);

	/**
	 *
	 * @param SS_List $list
	 * @param array $fields
	 *
	 * @return string format (json|xml) representation
	 */
	public function convertDataList(SS_List $list, $fields = null);

	/*
	 * Generate a representation of the given {@link DataObject}.
	 */
	public function convertDataObject(DataObjectInterface $obj, $fields = null);

	/**
	 * A wrapper method with internal switch between DataLists and DataObjects
	 *
	 * {@link JJ_JSONDataFormatter.convert}
	 *
	 * @param SS_List|DataObject|object $data
	 * @param array $fields
	 *
	 * @return string format (json|xml) representation
	 */
	public function convert($data, $fields = null);

}