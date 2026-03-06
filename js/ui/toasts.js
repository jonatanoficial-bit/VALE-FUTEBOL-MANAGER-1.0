/*
 * Toast notifications. Displays transient messages at the bottom of
 * the screen. Each toast is automatically removed after a period.
 */

const containerId = 'toast-container';

function ensureContainer() {
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, variant = 'info', durationSec = 4) {
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.setProperty('--toast-duration', `${durationSec}s`);
  toast.textContent = message;
  // Color variants
  if (variant === 'success') toast.style.borderColor = 'var(--color-success)';
  if (variant === 'partial') toast.style.borderColor = 'var(--color-warning)';
  if (variant === 'fail' || variant === 'error') toast.style.borderColor = 'var(--color-error)';
  container.appendChild(toast);
  // Remove after duration + fade time
  setTimeout(() => {
    toast.remove();
  }, (durationSec + 0.5) * 1000);
}