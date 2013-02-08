# JJRestAPI

__Konzept__

- [Kontexte](#kontexte)

__Classes__

- [DataElement](#dataelement)
- [Restful-Server](#restfulserver)
- [RestApiDataObjectListExtension](#restapidataobjectlistextension)
	- [DataFormatter](#restapidataobjectlistextension-dataformatter)
	- [API Methods](#restapidataobjectlistextension-methods)
- [RestApiExtension](#restapiextension)
	- [Wie scheibe ich meine eigene Erweiterung?](#restapiextension-howto)
	- [Structure-Extension](#structure)
	- [User-Extension](#structure)	
- [BaseDataFormatter](#basedataformatter)
- [DataFormatter](#dataformatter-howto)
	- [Wie erstelle ich meinen eigenen Formatter?](#dataformatter-howto)
	

---

<a name="kontexte"></a>
## Kontexte

Eines der Grund-Prinzipien der API ist die Betrachtung der Objekte aus unterschiedlichen Winkeln/Kontexten, die eine eigene Wirkung im Objekt haben.

So kann jedes Objekt mit den benötigten Kontexten ausgestattet werden, die weit mehr sind als nur Create, Read, Update, Delete (CRUD). Innerhalb dieser "Grund-Operationen" bieten die Kontexte vielfältige Möglichkeiten, z.B. die unterschiedliche Darstellung Objektes im eingeloggtem und anonymen Zustand.

Die API erweitert dafür [`$api_access`](#) um verchiedene Kontexte:

```
$api_access = array(
	'view' => array(
		'Title',
		'Content'
	),
	'view.logged_in' => array(
		'Title',
		'Content',
		'Secret'	
	)
);

```

Die __CRUD Operationen__ werden weiterhin durch die Silverstripe-Methoden `canOperation` _(canView, canEdit etc.)_ kontrolliert. Desweiteren können die Kontexte im gleichen Stil mit `getOperationContext` _(getViewContext, getEditContext etc.)_ verwaltet werden.

```
	static $api_access = array(
		'view' => array(
			'Title'
		),
		'view.logged_in' => array(
			'Title',
			'Content'
		),
		'view.admin' => array(
			'Title',
			'Contnet',
			'Secret'
		)
	);
	
	public function getViewContext($member = null) {
	
		// is admin
		if (Permission::checkMember($member, 'ADMIN')) {
			return 'admin';
		}
		// is logged in
		else if ($member && $member->ID) {
			return 'logged_in';
		}
		
		// return nothing. The API is going to use the default 'view' context
		return false;
	}
```


---

<a name="dataelement"></a>
## DataElement

Um Daten direkt ins Template zu übergeben und sich so einen weiteren Request auf die API zu sparen, bietet die API [JJ_DataElement](#) an.

Ein `JJ_DataElement` kann direkt aus einem DataObject oder DataList erstellt, oder mit rohen Daten (Array) konstruiert werden.

```
// your index method inside a controller
function index() {
	$dataElement = new JJ_DataElement('foo', array('foo' => 'bar'));
	$lists = DataList::create('TodoList');
	$item = DataList::create('TodoItem')->First();

	return $this->customise(array(
		'DataElement'	=> $dataElement, // raw data
		'Lists'			=> $lists->toDataElement(), // represents a DataList
		'FirstItem'		=> $item->toDataElement() // represents a DataObject
	));
}
```

<a name="dataelement-att_prefix"></a>
#### static $att_prefix = 'api-'

Attribute prefix for API generated data elements.

	<script type="application/json" id="api-{$ElementName}">
		{"foo": "bar"}
	</script>	

#### static $default_extension = 'json'

Extension/Format der DataElements.

#### __construct(_string_ $name, $data = array(), $extension = null)

<a name="dataelement-extension"></a>
#### extension()

Gibt das Format des DataElements zurück.

<a name="dataelement-setextension"></a>
#### setExtension(_string_ $value)

Setzt das Format des DataElements. Normalerweise `json` oder `xml`.

<a name="dataelement-formatter"></a>
#### formatter()

Gibt den [`DataFormatter`](#dataformatter) zurück und erstellt gegebenenfalls eine neue Instance auf Basis der momentanen [`extension()`](#dataelement-extension).

<a name="dataelement-name"></a>
#### name()

Gibt den Namen des DataElements zurück.

```
$dataElement = new JJ_DataElement('foo', array('foo' => 'bar'));
$dataElement->name(); // foo
```

<a name="dataelement-fullname"></a>
#### fullName()

Gibt den Namen inklusive [`$att_prefix`](#dataelement-att_prefix) zurück.

```
$dataElement = new JJ_DataElement('foo', array('foo' => 'bar'));
$dataElement->fullName(); // api-foo
```

<a name="dataelement-setname"></a>
#### setName(_string_ $value)

Setzt den Namen des DataElements.

<a name="dataelement-data"></a>
#### data()

Gibt die Daten in Rohform _(Array|Object)_ zurück.

<a name="dataelement-setdata"></a>
#### setData(_array|object_ $value)

Setzt die zu formattierenden Daten.

<a name="dataelement-formatteddata"></a>
#### formattedData()

Gibt die formatierten Daten im gewählten Format zurück.

<a name="dataelement-fortemplate"></a>
#### forTemplate()

Erzeugt ein `<script>`-Tag mit Typ und ID, basiert auf Format und [`fullName()`](#dataelement-fullname), das die Daten im angegebenen Format enthält.

```
$dataElement = new JJ_DataElement('foo', array('foo' => 'bar'));

// Usually this will be called from the Template-Engine.
echo $dataElement->forTemplate();

	<script type="application/json" id="api-foo">
		{"foo":"bar"}
	</script>
```

---

<a name="restfulserver"></a>
## Restful-Server


#### static $default_extension = 'json'

Standard Extension falls kein Formatter gefunden werden kann.

---

### Non-Object Requests

Um Daten über die API zu publizieren (read-only), die an keine konkreten Modelle gebunden sind, z.B. den eingeloggten User, Basis-Daten (SiteConfig, CSS, Templates) etc. können die folgenden Methoden verwendet werden:

#### add_fields(_string_ $key, _array_ $fields)

	JJ_RestfulServer::add_fields('module-key', array(
		'module property'		
	));

#### remove_fields(_string_ $key, $fields = array())

Löscht einzelne Felder des Keys, oder den gesammten Key, wenn keine Felder angegeben sind.

#### fields(_string_ $key = '')

gibt alle Felder des Keys zurück. Falls kein Key angegeben wurde, alle Keys + Felder

---

### ResponseFormatter

Formatiert den Request im angegebenen Format und verwendet URL-Extension sowie Accept-Header zur Ermittlung.

#### getResponseFormatter()

Gibt den aktuellen `ResponseFormatter` zurück. Falls noch keiner vorhanden ist, wird dieser aus URL-Extension und Accept-Header ermittelt.

#### setResponseFormatter($extension = null)

Setzt den `ResponseFormatter` anhand der mitgegebenen Extension oder via Accept-Header.

#### getDataFormatterByExtension($includeAcceptHeader = false)

Gibt den `ResponseFormatter` einer bestimmten Extension oder `false` zurück falls keiner gefunden wurde.

#### addContentTypeHeader()

Fügt den `Content-Type` des Formatters als Header zum Response hinzu.


---

<a name="restapidataobjectlistextension"></a>
## JJ_RestApiDataObjectListExtension

Die __JJ_RestApiDataObjectListExtension__ erweitert die Funktionalität von `DataObject` und `DataList` um einfacher mit der API zu kommunizieren.


#### $api_default_fields = array('ID' => 'Int')

Felder, __die unabhängig vom Kontext__, in die Repräsentation des Objektes integriert werden sollen.

#### $api_logged_in_context_name = 'logged_in'

Standard-Kontext für eingeloggte Benutzer. Falls der Kontext nicht definiert wurde, wird der Standard-Kontext verwendet.

---

<a name="restapidataobjectlistextension-dataformatter"></a>
### DataFormatter

<a name="restapidataobjectlistextension-extension"></a>
#### static $api_extension = 'json'

Die Standard-Formatierung, falls nicht über die `/api/v2/` auf den Formatter zugegriffen wird.
<a name="restapidataobjectlistextension-apiformatter"></a>
#### ApiFormatter()

Gibt den aktuellen [`DataFormatter`](#dataformatter) der API zurück. Dieser unterscheidet sich je nach URL-Extension oder [`$api_extension`](#restapidataobjectlistextension-extension)

---

<a name="restapidataobjectlistextension-methods"></a>
### API Methods

#### toApi()

Gibt das formatierte Objekt zurück. Ist ein Shortcut zu [`DataFormatter->convert`](#dataformatter-convert)


<a name="restapidataobjectlistextension-methods-getapifields"></a>
#### getApiFields($fields = null)

Konvertiert die mitgegebenen Felder (dot-Notation -> $api_access) in die einzelnen Objekte. Falls keine Felder mitgegeben wurden, werden die Felder von [`#getApiContextFields`](#) verwendet.

#### getApiContext($operation = 'view')

Gibt das API-Kontext-Objekt zurück. Verwendet `get{$Action}Context()` und fällt auf die mitgegebene `$operation` zurück.

```
	$context = $obj->getApiContext('view');
	print_r($context);
	
	stdClass Object
	(
    	[operation] => view
    	[context] => view.logged_in
	)
```

#### getApiContextName($operation = 'view')

Gibt den zu verwendenden Kontext für die angegebene Operation zurück.
Verwendet [`getApiContext($operation)`](#)

```
$context = $obj->getApiContextName('view');
echo $context; // view.logged_in
```

#### getApiContextFields($operation = 'view')

Gibt die Felder des aktuellen Kontextes zurück. Verwendet dafür [`getApiContext($operation)`](#). Zudem wird gewarnt, falls kein Kontext gefunden wurde.

---

#### getRelationKeys($component = null, $classOnly = true)

Gibt die Definition der Relations zu anderen DataObjects als Array zurück.

```
$relationKeys = $todoItem->getRelationKeys();
print_r($relationKeys);

Array
(
	[TodoList] => Array
		(
			[ClassName] => TodoList
			[Type] => has_one
			[Key] => TodoList
			[ReverseKey] => TodoItems
		)
        
	[Tags] => Array
		(
			[ClassName] => Tag
			[Type] => many_many
			[Key] => Tags
			[ReverseKey] => TodoItems
		)
)

```

#### getReverseRelationKey(_string_ $className, _string_ $key)

Gibt den Reverse-Key der Relation zurück.

```
class TodoList extends DataObject {

	static $has_many = array(
		'TodoItems'	=> 'TodoItem'
	);
	
	...
}

class TodoItem extends DataObject {

	static $has_one = array(
		'TodoList'	=> 'TodoList'
	);
	
	...
}

$reverseKey = $todoList->getReverseRelationKey('TodoItem', 'has_one');
echo $reverseKey; // TodoItems

```

#### convertRelationsNames(_array_ $fields)

Konvertiert die Dot-Syntax in multidimensionale Arrays.

#### getRelation(_stirng_ $relName, _string_ $relType)

Gibt die Liste oder das Objekt der Verbindung zurück.

---

<a name="restapiextension"></a>
## JJ_RestApiExtension

Die API ist mit eigenen Extensions erweiterbar welche als Basis-Klasse `JJ_RestApiExtension` verwenden. Die Extensions können die API um neue Endpunkte erweitern sowie Template-Variablen zu Verfügung stellen.

Die _JJRestAPI_ kommt mit folgenden Extensions:

- [Structure](#structure)
- User
- Template?


<a name="restapiextension-enabled"></a>
#### static $enabled = true

Enabled Flag

<a name="restapiextension-extension_key"></a>
#### static $extension_key = ''

Der Key ist gleichzeitig das URL-Segment, unter dem die Erweiterung in der API zu finden ist _/api/v2/$template_key.json_ sowie der Key der Template-Variablen um die Daten via [DataElement](#dataelement) ins Template zu schreiben.

```
	// in your extension
	static $template_key = 'Foo';

	// access your data via /api/v2/Foo.json

	// in your template.ss
	<!-- $JJ_RestApi.Foo -->
	$JJ_RestApi.Foo

```

<a name="restapiextension-isreadonly"></a>
#### $isReadOnly = true

Extensions are __read-only__ by default.

<a name="restapiextension-gettemplateglobalvariables"></a>
#### static get_template_global_variables()

Um weitere Variablen an das Template zu übergeben kann diese Methode überschrieben/erweitert werden.

<a name="restapiextension-for_template"></a>
#### static for_template()

Gibt die Daten an das Template weiter. Standardmäßig wird ein [DataElement](#dataelement) mit dem [`$extension_key`](#restapiextension-extension_key) als Name und der Wert von [`getData()`](#restapiextension-getdata) als DatenSatz genommen.

<a name="restapiextension-for_api"></a>
#### static for_api(_JJ_RestfulServer_ $restfulServer)

Gibt die Daten an die API zurück falls der __API-Endpunkt__ angesteuert wurde. Verwendet dafür den [DataFormatter](#) der API und convertiert den DatenSatz von [`getData()`](#restapiextension-getdata).


#### static create(_JJ_RestfulServer_ $restfulServer = null)

Erstellt und gibt eine Instanz der Erweiterung mit evtl. mitgegebener [JJ_RestfulServer](#restfulserver)-Instanz zurück.

#### static extension_key()
Gibt den [`$extension_key`](#restapiextension-extension_key) der Erweiterung zurück.

#### getOwner()

Gibt den Owner ([JJ_RestfulServer](#restfulserver)-Instanz) der Extension zurück.

#### handleExtension()

Einfacher Basis-Handler für Abfragen über die API ([`to_api()`](#restapiextension-for_api)). Checkt [$isReadOnly](#restapiextension-isreadonly) und setzt die Response-Header für `Content-Type` etc.

<a name="restapiextension-convert"></a>
#### convert(_array|object_ $data, _null|array_ $fields)

Konvertiert den mitgegebenen Datensatz mit Hilfe des [DataFormatters](#dataformatter) der [JJ_RestfulServer](#restfulserver)-Instanz.

<a name="restapiextension-getdata"></a>
#### getData($extension = null)

Gibt die Daten in Rohform (_array|object_) zurück, die dann mit [`convert()`](#restapiextension-convert) konvertiert und zurückgegeben werden. `$extension` zeigt dabei die momentane Extension der API an, aufgrund dessen die Daten unterschiedlich strukturiert werden können.

<a name="restapiextension-getfields"></a>
#### getFields($api_access = array(), $context = null)

Falls in der Extension `static $api_access = array()` definiert wurde, werden die Daten aus [`getData()`](#restapiextension-getdata) mit den Feldern des Kontextes konvertiert.

<a name="restapiextension-howto"></a>
### Wie schreibe ich meine eigene Erweiterung?

Die API um weitere Endpunkte/Template-Tags zu erweitern ist kinderleicht ;)

```
class Example_RestApiExtension extends JJ_RestApiExtension implements TemplateGlobalProvider {

	public static $extension_key = 'Example';

	public function getData($extension = null) {
		return array(
			'foo' => 'bar'
		);
	}

}

```


<a name="structure"></a>
## Structure_RestApiExtension

Um die, für die App relevante, Datenstruktur mit dem Frontend (Backbone.js) zu teilen und auf die gleichen Beziehungen zurückgreifen zu können kann die Daten-Struktur mittels der Extension geteilt werden.

Die Struktur verwendet nicht nur die angegebenen DataObjects, sondern verwendet diese als Startpunkt und fügt die DataObjects der Beziehungen automatisch hinzu.  
Um bestimmte DataObjects von der Struktur auszuschließen, können diese [ignoriert](#structure-ignore) werden.

```
// Foo.php
class Foo extends DataObject {

	static $has_one = array(
		'Secret' => 'Secret'
	);
	
	static $many_many = array(
		'Bars' => 'Bar'
	);
}

// Bar.php
class Bar extends DataObject {

	static $many_many = array(
		'Foos' => 'Foo'
	);
}

// _config.php
Structure_RestApiExtension::add('Foo'); // Bar will be added automagically
Structure_RestApiExtension::ignore('Secret'); // Secret will be ignored

// /api/v2/Structure.json
{
	"Foo": [
		{
			"ClassName"		: "Bar",
			"Type"			: "many_many",
			"Key"			: "Bars",
			"ReverseKey"	: "Foos"
		}
	],
	
	"Bar": [
		{
			"ClassName"		: "Foo",
			"Type"			: "belongs_many_many",
			"Key"			: "Foos",
			"ReverseKey"	: "Bars"
		}
	]
}

```

__NOTE__

Die Struktur kann natürlich direkt ins Template geschrieben werden, sodass sie schon mit dem ersten Request verfügbar ist.

```
// RootUrlController.ss
<body>
	
	<!-- DataStructure -->
	$JJ_RestApi.Structure
	
</body>

```

<a name="structure-add"></a>
#### static add(_string|array_ $className)

Fügte ein DataObject zu der Struktur.

<a name="structure-ignore"></a>
#### static ignore(_string|array_ $className)

Fügt ein DataObject zu den zu ignorierenden Objekten.

<a name="structure-get"></a>
#### static get()

Gibt die DataObjects der Struktur zurück.

<a name="structure-getignored"></a>
#### static get_ignored()

Gibt die ClassNames der DataObjects zurück, die in der Struktur ignoriert werden sollen.

<a name="structure-remove"></a>
#### static remove(_string|array_ $className)

Löscht ein DataObject von der Struktur.

<a name="structure-unignore"></a>
#### static unignore(_string|array_ $className)
Löscht ein DataObject von den zu ignorierenden Objekten.

<a name="structure-getdata"></a>
#### getData($extension = 'json')

Gibt die Struktur, optimiert für den zu verwendenden [Formatter](#), als Array zurück.


---

<a name="basedataformatter"></a>
## BaseDataFormatter

Der `BaseDataFormatter` enthält einige nützliche Methoden, die von den speziellen, an die Ausgabeformate, angepassten DataFormatters verwendet werden.

#### __construct($extensionFormatter)

Erzeugt eine neue BaseDataFormatter-Instanz mit der dazugehörigen Erweiterung.

#### superUnique(_array_ $array)

[link](http://www.php.net/manual/de/function.array-unique.php#97285)

#### fieldFilter(_string_ $fieldName, _array_ $fields)

Gibt zurück, ob der Feldname in den Feldern vorhanden ist.

#### castFieldValue($obj, $context = '')

Casted den Wert des Objektes, anhand des Objekt-Typs und Kontext.

---

<a name="dataformatter"></a>
## DataFormatter

Interface der `DataFormatters`, dass alle zu implementierende Methoden für spezifische/eigene Formatters enthält.

#### getBase()

Gibt den zu verwendenden [`BaseDataFormatter`](#basedataformatter) zurück.

```
/**
 *
 * @var object JJ_BaseDataFormatter
 */
protected $baseFormatter = null;

/**
 * returns and creates the JJ_BaseDataFormatter
 *
 * @return JJ_BaseDataFormatter
 */
public function getBase() {
	if (!$this->baseFormatter) {
		$this->baseFormatter = new JJ_BaseDataFormatter($this);
	}

	return $this->baseFormatter;
}
```

#### supportedExtensions()

Gibt die Extensions zurück, bei denen die Erweiterung verwendet werden soll.

```
public function supportedExtensions() {
	return array(
		'json'
	);
}
```

#### static _int_ $priority

Set priority from 0-100. If multiple formatters for the same extension exist, we select the one with highest priority.

```
/**
 * @var int
 */
public static $priority = 60;
```

#### convertObj(_object_ $obj, _array_ $keys = null)

Gibt das konvertierte Object zurück.

<a name="dataformatter-getdatalist"></a>
#### getDataList(_SS_List_ $set, _array_ $fields = null)

Gibt die `DataList` alls formatiertes _Array_ zurück. Die `DataObject`s werden mit [`convertDataObject`](#dataformatter-convertdataobject) formatiert.

<a name="dataformatter-convertdatalist"></a>
#### convertDataList(_SS_List_ $list, _array_ $fields = null)

Gibt die konvertierte `DataList` zurück und verwendet dafür [`getDataList`](#dataformatter-getdatalist)

<a name="dataformatter-convertdataobject"></a>
#### convertDataObject(_DataObjectInterface_ $obj, _array_ $fields = null, _array_ $relations = null)

Gibt das konvertierte `DataObject` zurück. Felder und Relations können mit den entsprechenden parametern eingeschränkt werden. Werden keine Felder bzw. Relations angebeben wird auf [`getApiFields()`](#restapidataobjectlistextension-methods-getapifields) zurückgegriffen.

<a name="dataformatter-convert"></a>
#### convert(_SS_List|DataObject|object_ $data, $fields = null)

Shortcut, der je nach daten-Typ auf die oben genannten `convertDataType` zurückfällt.

<a name="dataformatter-howto"></a>
### Wie erweitere ich die API um einen weiteren Formatter?

Die API lässt sich mit eigenen Formattierungen erweitern. Dafür ist das Interface [`DataFormatter`](#dataformatter) zu verwenden. Sollte das Austauschformat `XML`oder `JSON` sein, können zudem die vorhandenen Formatter erweitert werden.

#### Beispiel

Das DatenVisualisierungs-Tool [Gephi](#) bietet z.B. das Laden der Daten aus einem `JSON Stream` herraus. Allerdings muss dieser im [_Gephi-Austauschformat_](#) formatiert sein.  
Wir machen unsere Erweiterung unter `/api/v2/DataObject.graph` verfügbar, und implementieren die von [`DataFormatter`](#dataformatter) verlangten Methoden.

```
class JJ_GraphStreamDataFormatter extends JJ_JSONDataFormatter implements JJ_DataFormatter {

	/**
	 * Set priority from 0-100.
	 * If multiple formatters for the same extension exist,
	 * we select the one with highest priority.
	 *
	 * Set to 60 to be higher than JSONDataFormatter, cool!
	 *
	 * @var int
	 */
	public static $priority = 60;
	
	/**
	 * use /api/v2/DataObject.graph
	 */
	public function supportedExtensions() {
		return array(
			'graph'
		);
	}
	
	...
```

---




