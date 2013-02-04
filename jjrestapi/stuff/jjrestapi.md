
# JJRestApi

## Todo

- check {Config:"" Items: ""}


---

## JJ_RestfulServer

### _static_
	element_attr_prefix = "api-"

#### DataFormatter
- addContentTypeHeader()
- setResponseFormatter($extension = null)
- getResponseFormatter()
- getDataFormatterByExtension($includeAcceptHeader = false)

#### HTTP Handling
- unsupportedMediaType()
- isReadOnly()
- getHandler($className, $id, $relationName)

#### STATICS

##### add_fields
##### remove_fields
##### fields

##### get_template_global_variables




## JJ_RestApiExtension

- Erweitert die API um neue urls /api/v2/your-extension


## JJ_RestApiDataObjectExtension

### TODO

#### check additionalApiFields

- ob am DataObject
- für den Formatter, 
- generell in der API
- wer gewinnt?

---

### Variables & Methods

#### $api_default_fields
	array('ID' => 'Int'	)

#### $api_extension
	public static $api_extension = 'json';

#### ApiFormatter
returns the ApiFormatter. Usually a JSON or xml Formatter

#### toApiObject

#### toApiTag
@param string tag-id  
returns a json representation in a `<script>` tag

#### getApiFields

#### getApiContext

#### getApiContextFields

#### getRelationKeys


- 
- @todo: abstract class?

### JJ_DataListRestApiExtension

## JJ_RestfulSearchContext

## JJ_BaseDataFormatter
### JJ_JSONDataFormatter
### JJ_XMLDataFormatter