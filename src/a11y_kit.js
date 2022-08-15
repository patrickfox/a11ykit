	(function(ns) {

		let announce_timeout = undefined;

		const access = function(el, place_focus_before) {
			temp_el;
			let focus_el = undefined;
			let focus_method = undefined;
			let ogti = undefined;
			let onblur_el = undefined;
			let onblur_temp_el = undefined;
			var temp_el = undefined;
			onblur_el = function(e){
				if (el.getAttribute('data-ogti')) {
					el.setAttribute('tabindex', ogti);
				} else {
					el.removeAttribute('tabindex');
				}
				el.removeAttribute('data-ogti');
				el.removeEventListener('focusout', focus_method);
			};

			onblur_temp_el = function(e){
				temp_el.removeEventListener('focusout', focus_method);
				temp_el.parentNode.removeChild(temp_el);
			};

			focus_el = function(the_el){
				the_el.setAttribute('tabindex', '-1');
				the_el.addEventListener('focusout', focus_method);
				the_el.focus();
			};

			focus_method = onblur_el;
			if (place_focus_before) {
				temp_el = document.createElement('span');
				if (typeof place_focus_before === 'string') {
					temp_el.innerHTML = place_focus_before;
				}
				temp_el.setAttribute('style', 'position: absolute;height: 1px;width: 1px;margin: -1px;padding: 0;overflow: hidden;clip: rect(0 0 0 0);border: 0;');
				temp_el = el.parentNode.insertBefore(temp_el, el);
				focus_method = onblur_temp_el;
				focus_el(temp_el);
			} else {
				ogti = el.getAttribute('tabindex'); 
				if (ogti) { el.setAttribute('data-ogti', ogti); }
				focus_el(el);
			}
		};

		ns.access = access;

		announce_timeout = null;
		let announcer = undefined;
		const announce = function(message, manners) {
			const clear_announcer = function() {
				announcer.innerHTML = '';
				announce_timeout = null;
				return announcer;
			};
			manners = manners || 'polite';
			if (!announcer) {
				announcer = document.createElement('div');
			}
			announcer.setAttribute('aria-live', 'off');

			clear_announcer().setAttribute('aria-live', manners);
			announcer.innerHTML = message;
			clearTimeout(announce_timeout);
			announce_timeout = setTimeout(clear_announcer, 500);
			return announcer;
		};

		ns.announce = announce;

	});