	access = undefined
	announce_timeout = undefined
	access = (el, place_focus_before) ->
		temp_el
		focus_el = undefined
		focus_method = undefined
		ogti = undefined
		onblur_el = undefined
		onblur_temp_el = undefined
		temp_el = undefined
		onblur_el = ->
			if el.getAttribute("data-ogti")
				el.setAttribute "tabindex", ogti
			else
				el.removeAttribute "tabindex"
			el.removeAttribute "data-ogti"
			el.removeEventListener "blur", focus_method
			return

		onblur_temp_el = ->
			temp_el.removeEventListener "blur", focus_method
			temp_el.parentNode.removeChild temp_el
			return

		focus_el = ->
			el.setAttribute "tabindex", "-1"
			el.addEventListener "blur", focus_method
			el.focus()

		focus_method = onblur_el
		if place_focus_before
			temp_el = document.createElement("span")
			temp_el = el.parentNode.insertBefore(temp_el, el)
			focus_method = onblur_temp_el
			focus_el temp_el
		else
			ogti = el.getAttribute("tabindex")
			el.setAttribute "data-ogti", ogti  if ogti
			focus_el el
		return

	announce_timeout = null
	$.announce = (message, manners) ->
		announcer = undefined
		clear_announcer = undefined
		method = undefined
		method = method or "polite"
		announcer = $("#a11y_announcer").attr("aria-live", "off")
		clear_announcer = ->
			announcer.html ""
			announce_timeout = null
			announcer

		clear_announcer.attr "aria-live", method
		announcer.html message
		clearTimeout announce_timeout
		announce_timeout = setTimeout(clear_announcer, 500)
		this

	$.extend $.expr[":"],
		data: ((if $.expr.createPseudo then $.expr.createPseudo((dataName) ->
			(elem) ->
				!!$.data(elem, dataName)
		) else (elem, i, match) ->
			!!$.data(elem, match[3])
		))
		focusable: (element) ->
			focusable element, not isNaN($.attr(element, "tabindex"))

		tabbable: (element) ->
			isTabIndexNaN = undefined
			tabIndex = undefined
			tabIndex = $.attr(element, "tabindex")
			isTabIndexNaN = isNaN(tabIndex)
			(isTabIndexNaN or tabIndex >= 0) and focusable(element, not isTabIndexNaN)

	return