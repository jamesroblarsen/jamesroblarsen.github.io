// The contact page: "Write to me" opens a message box that sends through the pulse Worker (POST /v1/contact), which
// emails James. Without this script (or in a browser with no <dialog>), the button stays a plain mailto link.
(() => {
  const EMAIL = 'contact@fourthmeridiangames.com';
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  // A local preview posts to `wrangler dev` (npm run contact:dev); everywhere else to the real counter.
  const ENDPOINT = local ? `http://${location.hostname}:8787/v1/contact` : 'https://pulse.fourthmeridiangames.com/v1/contact';

  // Copy the address: mailto links do nothing on computers with no mail app set up.
  const copy = document.querySelector('.copy-address');
  if (copy && navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(EMAIL);
        copy.textContent = 'Copied';
      } catch {
        copy.textContent = 'Press Ctrl+C';
      }
      setTimeout(() => { copy.textContent = 'Copy'; }, 2000);
    });
  }

  const dialog = document.getElementById('contact-dialog');
  const opener = document.getElementById('open-contact');
  if (!dialog || !opener || typeof dialog.showModal !== 'function') return;
  const form = dialog.querySelector('form');
  const status = dialog.querySelector('.form-status');
  const thanks = dialog.querySelector('.contact-thanks');
  const send = form.querySelector('button[type="submit"]');
  let openedAt = 0;

  function show(text, kind = '', withEmail = false) {
    status.className = `form-status${kind ? ` ${kind}` : ''}`;
    status.textContent = text;
    if (withEmail) {
      status.append(' You can also email ');
      const a = document.createElement('a');
      a.href = `mailto:${EMAIL}`;
      a.textContent = EMAIL;
      status.append(a, '.');
    }
  }

  opener.addEventListener('click', (event) => {
    event.preventDefault();
    if (!thanks.hidden) { // a fresh box after a message went out
      thanks.hidden = true;
      form.hidden = false;
    }
    show('');
    openedAt = Date.now();
    dialog.showModal();
    (form.elements.name.value ? form.elements.message : form.elements.name).focus();
  });

  // Close with the ×, Cancel, Escape (built in) or a click on the dimmed page around the box. What was typed stays.
  for (const b of dialog.querySelectorAll('[data-close]')) b.addEventListener('click', () => dialog.close());
  let downOnBackdrop = false;
  dialog.addEventListener('mousedown', (e) => { downOnBackdrop = e.target === dialog; });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && downOnBackdrop) dialog.close();
  });
  dialog.addEventListener('close', () => opener.focus());

  // Ctrl+Enter (Cmd+Enter on a Mac) in the message sends it.
  form.elements.message.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (!String(data.get('message') ?? '').trim()) {
      show('Please write a message.', 'error');
      form.elements.message.focus();
      return;
    }
    const email = String(data.get('email') ?? '').trim();
    if (email && !form.elements.email.checkValidity()) {
      show('That email address does not look right.', 'error');
      form.elements.email.focus();
      return;
    }
    data.set('page', location.pathname);
    data.set('t', String(Math.round((Date.now() - openedAt) / 1000)));
    send.disabled = true;
    show('Sending…');
    try {
      const res = await fetch(ENDPOINT, { method: 'POST', body: data });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        form.reset();
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
        return;
      }
      show(out.error || 'Something went wrong sending that.', 'error', true);
    } catch {
      show('Could not reach the server. Check your connection and try again.', 'error', true);
    } finally {
      send.disabled = false;
    }
  });
})();
