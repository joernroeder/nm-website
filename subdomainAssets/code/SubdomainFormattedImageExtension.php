<?php

class SubdomainFormattedImageExtension extends DataExtension {

	/**
	 * replaced Image_Cached with SubdomainImage_Cached
	 * copied from framework/model/Image.php ~ line 408
	 * 
	 * - - - - - - - - - - - - - - - - - -
	 * 
	 * Return an image object representing the image in the given format.
	 * This image will be generated using generateFormattedImage().
	 * The generated image is cached, to flush the cache append ?flush=1 to your URL.
	 * 
	 * Just pass the correct number of parameters expected by the working function
	 * 
	 * @param string $format The name of the format.
	 * @return Image_Cached
	 */
	public function getFormattedSubdomainImage($format) {
		$args = func_get_args();
		
		if($this->owner->ID && $this->owner->Filename && Director::fileExists($this->owner->Filename)) {
			$cacheFile = call_user_func_array(array($this->owner, "cacheFilename"), $args);
			
			if(!file_exists(Director::baseFolder()."/".$cacheFile) || isset($_GET['flush'])) {
				call_user_func_array(array($this->owner, "generateFormattedImage"), $args);
			}
			
			$cached = new SubdomainImage_Cached($cacheFile);
			// Pass through the title so the templates can use it
			$cached->Title = $this->owner->Title;
			return $cached;
		}
	}

}