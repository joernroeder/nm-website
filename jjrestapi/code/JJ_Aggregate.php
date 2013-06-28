<?php

class JJ_Aggregate extends Aggregate {

	protected function query($attr) {
		$singleton = singleton($this->type);
		$query = DataList::create($this->type)->where($this->filter);
		// edit by jj
		$query = $query->dataQuery()->query();
		
		$query->setSelect($attr);
		$query->setOrderBy(array()); 
		$singleton->extend('augmentSQL', $query);
		return $query;
	}

	public function XML_val($name, $args = null, $cache = false) {
		$func = strtoupper( strpos($name, 'get') === 0 ? substr($name, 3) : $name );
		$attribute = $args ? $args[0] : 'ID';
		
		$table = null;
		
		foreach (ClassInfo::ancestry($this->type, true) as $class) {
			$fields = DataObject::database_fields($class);
			if (array_key_exists($attribute, $fields)) { $table = $class; break; }
		}
		
		if (!$table) user_error("Couldn't find table for field $attribute in type {$this->type}", E_USER_ERROR);
		
		$query = $this->query("$func(\"$table\".\"$attribute\"), COUNT(\"$table\".\"ID\")");

		$result = '0';
		$map = $query->execute()->map();
		if ($map) {
			foreach ($map as $key => $value) {
				$result = (string) $key . ' ' . (string) $value;
			}
		}
		
		return $result;
	}

}