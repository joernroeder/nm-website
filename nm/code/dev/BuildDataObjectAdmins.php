<?php

class BuildDataObjectAdmins extends BuildTask {

	// relative to mysite/code
	public static $source_folder = '/dataobjects/helpers';
	public static $target_folder = 'admin/dataobjects/helpers';
	public static $admin_appendix = 'Admin';

	protected $title = 'Build DataObject ModelAdmins';
	protected $description = '...';
	protected $enabled = true;

	protected $queue = '';
	protected $base = '';

	function run($request) {
		global $project;

		$this->base = BASE_PATH . '/' . $project . '/code/';

		if ($handle = opendir($this->base . self::$source_folder)) {
			while (false !== ($file = readdir($handle))) {
				$pos = strpos($file, '.php');

				if (false !== $pos) {
					$className = substr($file, 0, $pos);

					if (!class_exists($className . self::$admin_appendix)) {
						$this->buildModelAdmin($className);
					}
				}
			}

			closedir($handle);

			if ($this->queue != '') {
				echo $this->queue;
				echo '<br><a href="/dev/build?flush=all">flush database</a>';
			}
			else {
				echo 'No ModelAdmins created';
			}	
		}
		else {
			echo "source folder: {self::$source_folder} not found!";
		}
	}

	protected function getPlural($className) {
		$plural = $className::$plural_name;
		
		return $plural ? $plural : $className . 's';
	}

	protected function buildModelAdmin($className) {
		$adminName = $className . self::$admin_appendix;
		$plural = $this->getPlural($className);
		$urlSegment = strtolower($plural);

		$content = "<?php

class $adminName extends ModelAdmin {

	public static \$managed_models = array(
		'$className',
	);

	static \$url_segment = '$urlSegment';
	static \$menu_title = '$plural';

}";
	
		$file = $this->base . self::$target_folder . "/{$adminName}.php";

		$fp = fopen($file, 'w') or die("Couldn't open $file for login!");
		fwrite($fp, $content) or die("Couldn't open new page!");

		fclose($fp);

		$this->queue .= "created $adminName<br>\n";
	}

}