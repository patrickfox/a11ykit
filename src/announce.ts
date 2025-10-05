let announceTimeout: number | null = null;

type Manners = 'polite' | 'assertive';

const isValidManners = (value: any): value is Manners => {
  return value === 'polite' || value === 'assertive';
};

export const announce = (message: string, manners?: string): HTMLElement => {
  const validManners: Manners = isValidManners(manners) ? manners : 'polite';

  let announcer = document.getElementById('announce-this') as HTMLElement;

  const clearAnnouncer = (): HTMLElement => {
    announcer.innerHTML = '';
    announceTimeout = null;
    return announcer;
  };

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'announce-this';
    announcer.style = 'position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;'
    document.body.appendChild(announcer);
  }

  announcer.setAttribute('aria-live', 'off');
  clearAnnouncer().setAttribute('aria-live', validManners);
  announcer.innerHTML = message;
  
  if (announceTimeout) {
    clearTimeout(announceTimeout);
  }
  announceTimeout = window.setTimeout(clearAnnouncer, 500);
  
  return announcer;
};