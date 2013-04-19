<?php

class HyphenatedTextExtension extends DataExtension {

	public static $hyphenator_folder = '/code/thirdparty/phpHyphenator/';
	public static $hyphen = '&shy;';

	public static $default_locale = 'de';
	/**
	 *
	 *
	 *
	 */
	function getHyphenatedText($text, $locale = null) {
		global $GLOBALS;
		global $project;
		
		if (class_exists('Translatable')) {
			$locale = $locale ? $locale : Translatable::get_current_locale();
		}
		else if (!$locale) {
			$locale = self::$default_locale;
		}

		$locale = substr($locale, 0, 2);

		// hyphenator defaults
		//print_r($locale);
		$GLOBALS['language'] = $locale;
		// Where the patterns are located.
		$GLOBALS['path_to_patterns'] = Director::baseFolder() . '/' . $project . self::$hyphenator_folder . 'patterns/';		
		$GLOBALS['dictionary'] = self::$hyphenator_folder . 'dictionary.txt';
		/*You can create a text file with special words
		and those hyphenations line by line.
		Use the / to mark a hyphenation.
		For example: hyphe/nation
		Be sure to use UNIX line encoding LF*/
		
		$GLOBALS['hyphen'] = self::$hyphen;

		include_once (Director::baseFolder() . '/' . $project . self::$hyphenator_folder . 'hyphenation.php');

		//$text = 'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?';
		//print_r(hyphenation($text));

		//print_r($GLOBALS["patterns"]);
		return hyphenation($text);
	}

}