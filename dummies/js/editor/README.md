# Editor

## Methods

- getComponent ( _id_ )

### EventSystem

- on ( _name, callback_ )
- off ( _name, callback_ )
- trigger ( _name, eventData_ )

---

---

# Editable

## Variables

### _value

### contentTypes: _array_  
```
	contentTypes: ['markdown']
```

---

## Methods

- constructor ( _Editor_ )
- init ( _$element_ )
- setValue ( _value_ )
- getValue()
- render()

### EventSystem

__Note: All Names will be namespaced with the component name!__

- on ( _name, callback_ )
- off ( _name, callback_ )
- trigger ( _name, eventData_ )

---

---

# PopoverEditable

- open()
- close()
- toggle()
- setPopoverContent( _string|html_ )
- getPopoverContent()