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

	public static function removeMarkdown($mdText) {
		$className = get_called_class();
		if (isset($className::$regex)) {
			preg_match_all($className::$regex, $mdText, $res, PREG_PATTERN_ORDER);

			$found = $res[0];
			if (!empty($found)) {
				foreach ($found as $key => $value) {
					$mdText = str_replace($value, '', $mdText);
				}
			}
		}

		return $mdText;
	}

}