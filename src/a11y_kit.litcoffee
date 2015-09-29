	(ns) ->

		announce_timeout = undefined
		access = (el, place_focus_before) ->
			temp_el
			focus_el = undefined
			focus_method = undefined
			ogti = undefined
			onblur_el = undefined
			onblur_temp_el = undefined
			temp_el = undefined
			onblur_el = (e)->
				if el.getAttribute 'data-ogti'
					el.setAttribute 'tabindex', ogti
				else
					el.removeAttribute 'tabindex'
				el.removeAttribute 'data-ogti'
				el.removeEventListener 'focusout', focus_method
				return

			onblur_temp_el = (e)->
				temp_el.removeEventListener 'focusout', focus_method
				temp_el.parentNode.removeChild temp_el
				return

			focus_el = (the_el)->
				the_el.setAttribute 'tabindex', '-1'
				the_el.addEventListener 'focusout', focus_method
				the_el.focus()
				return

			focus_method = onblur_el
			if place_focus_before
				temp_el = document.createElement 'span'
				if typeof place_focus_before is 'string'
					temp_el.innerHTML = place_focus_before
				temp_el.setAttribute 'style', 'position: absolute;height: 1px;width: 1px;margin: -1px;padding: 0;overflow: hidden;clip: rect(0 0 0 0);border: 0;'
				temp_el = el.parentNode.insertBefore(temp_el, el)
				focus_method = onblur_temp_el
				focus_el temp_el
			else
				ogti = el.getAttribute 'tabindex' 
				el.setAttribute 'data-ogti', ogti if ogti
				focus_el el
			return

		window.access = access

		announce_timeout = null
		announce = (message, manners) ->
			manners = manners or 'polite'
			announcer = document.getElementByID 'a11y_announcer'
			announcer.setAttribute 'aria-live', 'off'
			clear_announcer = ->
				announcer.innerHTML = ''
				announce_timeout = null
				return announcer

			clear_announcer.setAttribute 'aria-live', manners
			announcer.innerHTML = message
			clearTimeout announce_timeout
			announce_timeout = setTimeout(clear_announcer, 500)
			return announcer

		window.announce = announce

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