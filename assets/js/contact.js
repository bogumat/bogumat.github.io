// The address stays available through native details even without JavaScript.
document.querySelectorAll('[data-contact]').forEach(contact => {
    const email = contact.querySelector('.contact-email');
    const copyButton = contact.querySelector('[data-copy-email]');
    const status = contact.querySelector('[role="status"]');

    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
        status.textContent = '';
        try {
            await navigator.clipboard.writeText(email.textContent.trim());
            status.textContent = 'Email copied.';
        } catch {
            const range = document.createRange();
            range.selectNodeContents(email);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            status.textContent = 'Email selected. Copy it with your usual copy command.';
        }
    });

    contact.addEventListener('toggle', () => { status.textContent = ''; });
    contact.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            contact.open = false;
            contact.querySelector('summary').focus();
        }
    });
});
