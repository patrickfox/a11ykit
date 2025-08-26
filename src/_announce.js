const announce = function(message, manners) {
  let announce_timeout = null;
	let announcer = document.getElementById('announce-this');
  const clear_announcer = function() {
    announcer.innerHTML = '';
    announce_timeout = null;
    return announcer;
  };
  manners = manners || 'polite';
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'announce-this';
    document.body.appendChild(announcer);
  }
  announcer.setAttribute('aria-live', 'off');
  clear_announcer().setAttribute('aria-live', manners);
  announcer.innerHTML = message;
  clearTimeout(announce_timeout);
  announce_timeout = setTimeout(clear_announcer, 500);
  return announcer;
};

export {announce};
