// The contact form: posts to the hub-contact Worker and shows the answer in place.
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const thanks = document.getElementById('contact-thanks');
  const button = form.querySelector('button[type="submit"]');
  const EMAIL = 'contact@fourthmeridiangames.com';

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
    if (!data.get('cf-turnstile-response')) {
      show('One moment: the spam check is still running. Try again in a few seconds.', 'error');
      return;
    }
    data.set('page', location.pathname);
    button.disabled = true;
    show('Sending…');
    try {
      const res = await fetch(form.action, { method: 'POST', body: data });
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
      button.disabled = false;
      // Each spam-check token works once, so get a fresh one for another try.
      try {
        window.turnstile?.reset();
      } catch {}
    }
  });
})();
