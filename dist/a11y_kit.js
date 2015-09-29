(function() {
  (function(ns) {
    var access, announce, announce_timeout;
    announce_timeout = void 0;
    access = function(el, place_focus_before) {
      temp_el;
      var focus_el, focus_method, ogti, onblur_el, onblur_temp_el, temp_el;
      focus_el = void 0;
      focus_method = void 0;
      ogti = void 0;
      onblur_el = void 0;
      onblur_temp_el = void 0;
      temp_el = void 0;
      onblur_el = function(e) {
        if (el.getAttribute('data-ogti')) {
          el.setAttribute('tabindex', ogti);
        } else {
          el.removeAttribute('tabindex');
        }
        el.removeAttribute('data-ogti');
        el.removeEventListener('focusout', focus_method);
      };
      onblur_temp_el = function(e) {
        temp_el.removeEventListener('focusout', focus_method);
        temp_el.parentNode.removeChild(temp_el);
      };
      focus_el = function(the_el) {
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
        if (ogti) {
          el.setAttribute('data-ogti', ogti);
        }
        focus_el(el);
      }
    };
    window.access = access;
    announce_timeout = null;
    announce = function(message, manners) {
      var announcer, clear_announcer;
      manners = manners || 'polite';
      announcer = document.getElementByID('a11y_announcer');
      announcer.setAttribute('aria-live', 'off');
      clear_announcer = function() {
        announcer.innerHTML = '';
        announce_timeout = null;
        return announcer;
      };
      clear_announcer.setAttribute('aria-live', manners);
      announcer.innerHTML = message;
      clearTimeout(announce_timeout);
      announce_timeout = setTimeout(clear_announcer, 500);
      return announcer;
    };
    window.announce = announce;
    $.extend($.expr[":"], {
      data: ($.expr.createPseudo ? $.expr.createPseudo(function(dataName) {
        return function(elem) {
          return !!$.data(elem, dataName);
        };
      }) : function(elem, i, match) {
        return !!$.data(elem, match[3]);
      }),
      focusable: function(element) {
        return focusable(element, !isNaN($.attr(element, "tabindex")));
      },
      tabbable: function(element) {
        var isTabIndexNaN, tabIndex;
        isTabIndexNaN = void 0;
        tabIndex = void 0;
        tabIndex = $.attr(element, "tabindex");
        isTabIndexNaN = isNaN(tabIndex);
        return (isTabIndexNaN || tabIndex >= 0) && focusable(element, !isTabIndexNaN);
      }
    });
  });

}).call(this);
