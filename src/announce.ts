let announceTimeout: number | null = null;

export const announce = (message: string, manners: 'polite' | 'assertive' = 'polite'): HTMLElement => {
  let announcer = document.getElementById('announce-this') as HTMLElement;
  
  const clearAnnouncer = (): HTMLElement => {
    announcer.innerHTML = '';
    announceTimeout = null;
    return announcer;
  };

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'announce-this';
    document.body.appendChild(announcer);
  }
  
  announcer.setAttribute('aria-live', 'off');
  clearAnnouncer().setAttribute('aria-live', manners);
  announcer.innerHTML = message;
  
  if (announceTimeout) {
    clearTimeout(announceTimeout);
  }
  announceTimeout = window.setTimeout(clearAnnouncer, 500);
  
  return announcer;
};