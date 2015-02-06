(function() {
  var access, announce_timeout;

  access = void 0;

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
    onblur_el = function() {
      if (el.getAttribute("data-ogti")) {
        el.setAttribute("tabindex", ogti);
      } else {
        el.removeAttribute("tabindex");
      }
      el.removeAttribute("data-ogti");
      el.removeEventListener("blur", focus_method);
    };
    onblur_temp_el = function() {
      temp_el.removeEventListener("blur", focus_method);
      temp_el.parentNode.removeChild(temp_el);
    };
    focus_el = function() {
      el.setAttribute("tabindex", "-1");
      el.addEventListener("blur", focus_method);
      return el.focus();
    };
    focus_method = onblur_el;
    if (place_focus_before) {
      temp_el = document.createElement("span");
      temp_el = el.parentNode.insertBefore(temp_el, el);
      focus_method = onblur_temp_el;
      focus_el(temp_el);
    } else {
      ogti = el.getAttribute("tabindex");
      if (ogti) {
        el.setAttribute("data-ogti", ogti);
      }
      focus_el(el);
    }
  };

  announce_timeout = null;

  $.announce = function(message, manners) {
    var announcer, clear_announcer, method;
    announcer = void 0;
    clear_announcer = void 0;
    method = void 0;
    method = method || "polite";
    announcer = $("#a11y_announcer").attr("aria-live", "off");
    clear_announcer = function() {
      announcer.html("");
      announce_timeout = null;
      return announcer;
    };
    clear_announcer.attr("aria-live", method);
    announcer.html(message);
    clearTimeout(announce_timeout);
    announce_timeout = setTimeout(clear_announcer, 500);
    return this;
  };

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

  return;

}).call(this);
