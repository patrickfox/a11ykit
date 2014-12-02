# A11y Kit
###Essential tools to empower modern accessibility
This library adds common jQuery methods that are useful is creating modern accessible web applications.


## Access - Focus on anything
###Usage
```
$(selector).access(place_focus_before)
```

### Params
- ```@place_focus_before: boolean```  if true, focus is placed on a temporary span tag inserted before the specified element

###How It Works
This method enables .focus() to be fired on elements that do not natively support .focus().  This is accomplished via the addition of tabindex="-1" to the supplied target and allows it to temporarily receive focus. Once the element is blurred, everything is cleaned up and returned to its original state.

## Announce - Say anything

###Usage
```
$.announce(message, manner)
```

__Note:__ Requires a dedicated #a11y_announcer container with a hard-coded aria-live attribute that is stays in the page at all times.

### Example
```
<div id="a11y_announcer" aria-live="polite"></div>
```

### Params
- ``` @message: string``` copy/message to be announced
- ```@manner: ['polite'(default), 'assertive']``` manner is which message is announced


Announce content via a dedicated, global aria-live announcement container. announce() works by simply updating the content of the #a11y_container with the content to be spoken. It also performs a reset of sorts by toggling the @aria-live value to 'off', clearing the contents, and lastly resetting the @aria-live value to its original value. This allows for repeated messages to be spoken, if needed.





## Utility pseudo-selectors for jQuery
Select all :focusable and :tabbable elements. Credit: jQuery UI

###Usage
```
$(':focusable') # -> returns all focusable elements

$(':tabbable') # -> returns all tabbable elements
```
