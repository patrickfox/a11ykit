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