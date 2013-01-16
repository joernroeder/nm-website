<?php

class StartEndDateExtension extends DataExtension {

	function Date() {
		$startFormat = $this->owner->stat('start_date_format');
		$endFormat = $this->owner->stat('end_date_format');

		if (!$startFormat) {
			user_error("you have to set the StartDate formatter (static \$start_date_format) in {$this->owner->class}", E_USER_ERROR);
		}

		if (!$endFormat) {
			user_error("you have to set the StartDate formatter (static \$start_date_format) in {$this->owner->class}", E_USER_ERROR);
		}

		$start = $this->owner->dbObject('StartDate');
		$end = $this->owner->dbObject('EndDate');

		return $end && $end->value ? $start->format($startFormat) . '-' . $end->format($endFormat) : $start->format($endFormat);
	}

	/**
	 * Gibt das formattierte Start-Datum zurück
	 *
	 *  @return string
	 */
	function FormattedStartDate() {
		return $this->getFormattedDate('Start');
	}

	/**
	 * Gibt das formattierte End-Datum zurück
	 *
	 *  @return string
	 */
	function FormattedEndDate() {
		return $this->getFormattedDate('End');
	}

	/**
	 * gibt das formatierte Datum zurück
	 *
	 * @param string $dateName Der Name es Datums z.B. 'Start' oder 'End'
	 *
	 * @return string
	 */
	private function getFormattedDate($dateName) {
		$lowerName = strtolower($dateName);
		$format = $this->owner->stat($lowerName . '_date_format');

		if (!$format) {
			user_error("you have to set the {$dataName}Date formatter (static \${$lowerName}_date_format) in {$this->owner->class}", E_USER_ERROR);
		}

		$date = $this->owner->dbObject($dateName . 'Date');

		return $date ? $date->format($format) : '';
	}



}