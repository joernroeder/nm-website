<?php

class ResponsiveImageFormatter extends MarkdownFormatterExtension {

	/**
	 *
	 * @todo : extra class functionality within MarkdownTag. (like [img 6 foo])
	 * 
	 */

	public static $indicator = 'ResponsiveImage';

	static $regex 		= "^\[img (.*?)\]^";
	static $img_class 	= 'ResponsiveImage';

	public static function formatMarkdown($mdText) {

		preg_match_all(self::$regex, $mdText, $res, PREG_PATTERN_ORDER);

		$found = $res[0];
		if (!empty($found)) {
			foreach ($found as $key => $value) {
				// 1.) remove exceeding whitespaces
				$tmp = trim(preg_replace('/\s+/', ' ',$res[1][$key]));
				
				// 2.) explode to array. first value is always the ID
				$tmpArray = explode(' ', $tmp);
				$imgID = array_shift($tmpArray);
				
				if ($imgID) {

					$img = DataObject::get_by_id(self::$img_class, (int) $imgID);
					if ($img && $img->exists()) {
						// 3.) add possible extra classes
						foreach ($tmpArray as $extraClass) {
							$img->addExtraClass($extraClass);
						}

						$mdText = str_replace($value, $img->getTag(), $mdText);
					}
				}
			}
		}

		return $mdText;
	}

}