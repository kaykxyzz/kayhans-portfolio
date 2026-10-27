// Load genuine page snapshots from live URLs. If the first public capture endpoint
// fails, try WordPress mShots; if both fail, show the source link instead of an empty slot.
document.querySelectorAll('.site-capture').forEach((img) => {
  const frame = img.closest('.capture-frame');
  let triedFallback = false;
  const fail = () => {
    if (!triedFallback && img.dataset.fallback) {
      triedFallback = true;
      img.src = img.dataset.fallback;
      return;
    }
    frame?.classList.add('capture-failed');
  };
  img.addEventListener('load', () => {
    if (img.naturalWidth > 80) frame?.classList.remove('capture-failed');
    else fail();
  });
  img.addEventListener('error', fail);
  if (img.complete && img.naturalWidth === 0) fail();
});
