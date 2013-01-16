<?php
/**
 *
 *    000000  0000000000    000000000000000000
 *    000000  0000000000    00000000000000000000
 *    000000      000000    000000   00000  000000
 *    000000      000000    000000     000  000000
 *     00000      000000    000000       0  000000
 *       000      000000    000000          000000
 *         0      000000    000000          000000
 *
 *    Neue Medien - Kunsthochschule Kassel
 *    http://neuemedienkassel.de
 *
 */

/**
 * Project Object
 *
 * {@todo: `RelatedProjects()` that merges ParentProjects and ChildProjects}
 */
class Project extends DataObject {

	static $db = array(
		'Title'			=> 'Varchar(255)',			// Projekt Titel
		'Date'			=> 'Date',					// Projekt-Datum: Hierbei werden nur Monat und Jahr berücksichtigt.
		'Text'			=> 'Text',					// Text des Projekts (Markdown formatiert)
		'Code'			=> 'Text',					// Code, der teil des Projektes ist und auf der Projektseite ausgeführt wird

		'IsPortfolio'	=> 'Boolean',				// Flagge: Zeigt an ob das Projekt im Portfolio erscheint
		'IsFeatured'	=> 'Boolean'				// Flagge: Zeigt an ob das Projekt auf der Startseite erscheint
	);

	static $has_many = array(
		'Rankings' 		=> 'Ranking'				// Sortierungssystem {@see Ranking}
	);

	static $many_many = array(
		'ChildProjects'		=> 'Project',			// Verknüpfte "Kind"-Projekte, die zugehörig zu diesem Projekt sind 
		'Categories'		=> 'Category'			// Kategorie (z.B. Installation)
	);

	static $belongs_many_many = array(
		'CalendarEntries'	=> 'CalendarEntry',		// Kalendereinträge
		'ParentProjects'	=> 'Project',			// "Eltern"-Projekte, die mit diesem Projekt verknüpft sind.
		'Exhibitions'		=> 'Exhibition',		// Ausstellungen
		'Workshops'			=> 'Workshop',			// Workshops
		'Excursions'		=> 'Excursion'			// Exkursionen
	);
}

