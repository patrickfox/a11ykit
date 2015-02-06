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

	$.fn.access = (place_focus_before) ->
		if place_focus_before
			temp_em = $('<span />')
			temp_em.insertBefore(@)
			temp_em.attr('tabindex', '-1').on('blur focusout', ->
			  $(@).remove()
			)
			.focus()
		else
			ogti = 'original-tabindex'
			target = $(@)
			target.data(ogti, target.attr('tabindex') || false)
			target.attr('tabindex', '-1').on('blur focusout', ->
				if target.data(ogti) isnt false
					target.attr('tabindex', target.data(ogti))
				else
					target.removeAttr('tabindex')
			  target.off('blur focusout')
			  target.data(ogti, false)
			)
			.focus()
		return @


## Announce - Say anything

###Usage
```
$.announce(message, manner)
```

### _Note:_ Requires a dedicated #a11y_announcer container with a hard-coded aria-live attribute that is stays in the page at all times.

### Example
```
<div id="a11y_announcer" aria-live="polite"></div>
```

### Params
- @message: copy/message to be announced
- @manner: ['polite'(default), 'assertive'] manner is which message is announced

Announce content via a dedicated, global aria-live announcement container. announce() works by simply updating the content of the #a11y_container with the content to be spoken. It also performs a reset of sorts by toggling the @aria-live value to 'off', clearing the contents, and lastly resetting the @aria-live value to its original value. This allows for repeated messages to be spoken, if needed.
	
	announce_timeout = null
	$.announce = (message, manner) ->
		manner = manner || 'polite'
		announcer = $('#a11y_announcer').attr('aria-live', 'off')
		clear_announcer = ->
			announcer.html('')
			announce_timeout = null
			return
		announcer.attr('aria-live', manner)
		announcer.html(message)
		clearTimeout announce_timeout
		announce_timeout = setTimeout(clear_announcer, 500)
		return @


## Utility pseudo-selectors for jQuery

	visible = (element) ->
		$.expr.filters.visible(element) and !$(element).parents().addBack().filter(->
			$.css(this, 'visibility') == 'hidden'
		).length

	focusable = (element, isTabIndexNotNaN) ->
		nodeName = element.nodeName.toLowerCase()
		if 'area' == nodeName
			map = element.parentNode
			mapName = map.name
			if !element.href or !mapName or map.nodeName.toLowerCase() != 'map'
				return false
			img = $('img[usemap=#' + mapName + ']')[0]
			return !!img and visible(img)
		(if /input|select|textarea|button|object/.test(nodeName) then !element.disabled else if 'a' == nodeName then element.href or isTabIndexNotNaN else isTabIndexNotNaN) and visible(element)

###Usage
```
$(':focusable') # -> returns all focusable elements

$(':tabbable') # -> returns all tabbable elements

	$.extend $.expr[':'],
		data: (if $.expr.createPseudo then $.expr.createPseudo((dataName) ->
			(elem) ->
				!!$.data(elem, dataName)

			# support: jQuery <1.8
			) else (elem, i, match) ->
				!!$.data(elem, match[3])
			)
		focusable: (element) ->
			focusable element, not isNaN($.attr(element, "tabindex"))

		tabbable: (element) ->
			tabIndex = $.attr(element, "tabindex")
			isTabIndexNaN = isNaN(tabIndex)
			(isTabIndexNaN or tabIndex >= 0) and focusable(element, not isTabIndexNaN)
