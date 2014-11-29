# Accessibility Essentials
This library adds common jQuery methods that are useful is creating modern accessibile web applications.


## Focus on anything with $(el).access(place_focus_before)
_Usage:_ $(selector).access(place\_focus\_before)

### Params
This method enables .focus() to be fired on elements that do not natively support .focus().  This is accomplished via the addition of tabindex="-1" to the supplied target and allows it to receive focus.

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


## Say anything with $.announce(message, manner)

###Usage:
$.announce(message, manner)

### _Note:_ Requires a dedicated #a11y_announcer container with a hard-coded aria-live attribute that is stays in the page at all times.

### Example: 
'''<div id="a11y_announcer" aria-live="polite"></div>'''

### Params:
- @message: copy/message to be announced
- @manner: ['polite'(default), 'assertive'] manner is which message is announced

Announce content via a dedicated, global aria-live announcement container. announce() works by simply updating the content of the #a11y_container with the content to be spoken. It also performs a reset of sorts by toggling the @aria-live value to 'off', clearing the contents, and lastly resetting the @aria-live value to its original value. This allows for repeated messages to be spoken, if needed.

	$.announce = (message, manners) ->
		method = method || 'polite'
		announcer = $('#a11y_announcer').attr('aria-live', 'off')
		announcer.html('').attr('aria-live', method)
		announcer.html(message)
		return @


## :focusable and :tabbable pseudo selectors from jQuery

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