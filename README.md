# A11y Kit
###Essential tools to empower modern accessibility
This library adds common jQuery methods that are useful is creating modern accessible web applications.


## Access - Focus on anything
###Usage
```
$(selector).access(place_focus_before)
```

### Params
@place_focus_before: boolean, if true, focus is placed on a temporary span tag inserted before the specified element

###How It Works
This method enables .focus() to be fired on elements that do not natively support .focus().  This is accomplished via the addition of tabindex="-1" to the supplied target and allows it to temporarily receive focus. Once the element is blurred, everything is cleaned up and returned to its original state.


## Utility pseudo-selectors for jQuery
Select all :focusable and :tabbable elements. Credit: jQuery UI

###Usage
```
$(':focusable') # -> returns all focusable elements

$(':tabbable') # -> returns all tabbable elements
```
