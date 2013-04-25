<?php

abstract class MarkdownFormatterExtension extends Object implements MarkdownFormatter {


	public static function getSubclasses() {
		$className = get_called_class();
		$subClasses = ClassInfo::subclassesFor($className);
		$result = array();
		foreach (array_keys($subClasses) as $class) {
			if ($className != $class) {
				$result[] = $class;
			}
		}

		return $result;
	}

}