# A11y Kit
### Essential JS tools that empower modern accessibility
This library provides common jQuery methods that are useful in managing user focus, speaking content and selecting interactive elements.

## Installation

### Bower Package

```
bower install a11y_kit
```

In your page, link to the file at:

```
bower_components/dist/a11y_kit.jquery.js
```


## Access - Focus on anything
### Usage
```
$(selector).access(place_focus_before)
```

### Params
- ```@place_focus_before: boolean(default: false)```  if true, focus is placed on a temporary span tag inserted before the specified element. By default, focus is placed on the specified element itself.

### Why use $.access()?
Managing focus on web pages can be complex, and requires the use of tabindex. The tabindex attribute allows any element to receive focus, but hard coding tabindex into your pages makes your project more brittle and error-prone. _One example:_ using tabindex="0" on a container makes all child interactive elements read the container's entire contents(in VoiceOver). 

A far more elegant solution is to place focus on an element dynamically using a script like $.access().

__General rule:__ don't hard code tabindex - instead, use $.access() to manage focus.

###How It Works
This method allows focus of elements that do not natively support .focus().  This is accomplished via the addition of tabindex="-1" to the supplied target and allows it to temporarily receive focus. Once the element is blurred, everything is cleaned up and returned to its original state.

###Behavior
When focus is placed on a container, screen readers may either 1) read the contents of the container or 2) read any associated label(e.g. aria-label, aria-labelledby) on the element.

## Announce - Say anything

###Usage
```
$.announce(message, manner)
```

__Note:__ Requires a dedicated #a11y_announcer container with a hard-coded aria-live attribute that stays in the page at all times. _This element cannot be created dynamically and must be in the page on page load._

### Example
```
<div id="a11y_announcer" aria-live="polite"></div>
```

### Params
- ``` @message: string``` copy/message to be announced
- ```@manner: ['polite'(default), 'assertive']``` manner is which message is announced


Announce content via a dedicated, global aria-live announcement container. announce() works by simply updating the content of the #a11y_container with the content to be spoken. It also performs a reset of sorts by toggling the @aria-live value to 'off', clearing the contents, and lastly resetting the @aria-live value to its original value. This allows for repeated messages to be spoken, if needed.


###Why use $.announce()?
The promise of live regions and aria-live is to improve understanding and perception of dynamic content. In reality, though, overuse of live regions can create a lot more problems than it solves. Too many live regions on a page makes it more difficult to debug related issues. 

At any given time, only one live region can speak its content, so there's never a need to have more than one in the page. Using a single, common live region and the $.announce() script greatly simplifies your code and debugging efforts.

__General Rule:__ Do not use _aria-live_ or any live region role( _role=alert|log|marquee|status|timer_) - instead, use ONE common live region and $.announce() your content as needed.

## Utility pseudo-selectors for jQuery
Select all :focusable and :tabbable elements. Credit: jQuery UI

###Usage
```
$(':focusable') # -> returns all focusable elements

$(':tabbable') # -> returns all tabbable elements
```
