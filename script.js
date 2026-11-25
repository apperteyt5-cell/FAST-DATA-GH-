const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
menuToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => mainNav.classList.remove('open')));

let chosenBundle = null;
const bundleButtons = document.querySelectorAll('.bundle');
bundleButtons.forEach(button => {
  button.addEventListener('click', () => {
    bundleButtons.forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');
    chosenBundle = { name: button.dataset.name, price: Number(button.dataset.price) };
    document.getElementById('selectedBundle').value = chosenBundle.name;
    document.getElementById('selectedPrice').value = `GH₵ ${chosenBundle.price.toFixed(2)}`;
    document.getElementById('formMessage').textContent = '';
    document.getElementById('orderPanel').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

const dialog = document.getElementById('summaryDialog');
let pendingOrder = null;
document.getElementById('orderForm').addEventListener('submit', event => {
  event.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  if (!chosenBundle) {
    document.getElementById('formMessage').textContent = 'Please select a data bundle first.';
    return;
  }
  if (!/^0\d{9}$/.test(phone)) {
    document.getElementById('formMessage').textContent = 'Enter a valid 10-digit Ghana phone number starting with 0.';
    return;
  }
  pendingOrder = { ...chosenBundle, phone };
  document.getElementById('summaryBundle').textContent = pendingOrder.name;
  document.getElementById('summaryPhone').textContent = pendingOrder.phone;
  document.getElementById('summaryPrice').textContent = `GH₵ ${pendingOrder.price.toFixed(2)}`;
  document.getElementById('demoReceipt').textContent = '';
  dialog.showModal();
});
document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
document.getElementById('confirmDemo').addEventListener('click', () => {
  if (!pendingOrder) return;
  const reference = 'FDG-' + Math.floor(100000 + Math.random() * 900000);
  const saved = JSON.parse(localStorage.getItem('fdgDemoOrders') || '{}');
  saved[reference] = { ...pendingOrder, status: 'Awaiting payment setup', createdAt: new Date().toISOString(), eta: '4+ hours (busy-period estimate)' };
  localStorage.setItem('fdgDemoOrders', JSON.stringify(saved));
  const placedAt = new Date(saved[reference].createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' });
  document.getElementById('demoReceipt').textContent = `Demo receipt: ${reference} · Placed ${placedAt} Ghana time · Estimated processing: 4+ hours. Demo only; payment and delivery are not connected yet.`;
  document.getElementById('orderId').value = reference;
});
document.getElementById('trackForm').addEventListener('submit', event => {
  event.preventDefault();
  const reference = document.getElementById('orderId').value.trim().toUpperCase();
  const saved = JSON.parse(localStorage.getItem('fdgDemoOrders') || '{}');
  const order = saved[reference];
  document.getElementById('trackResult').textContent = order
    ? `Bundle: ${order.name} • Number: ${order.phone} • Status: ${order.status} • Placed: ${new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' })} Ghana time • Estimate: ${order.eta || '4+ hours'}`
    : 'We could not find that demo order on this device. Check the reference and try again.';
});
document.getElementById('year').textContent = new Date().getFullYear();


// Reveal sections gently as the customer scrolls down the page.
const motionTargets = document.querySelectorAll(
  '.section-heading, .bundle, .order-panel, .track-copy, .track-form, .steps article'
);
motionTargets.forEach((element, index) => {
  element.classList.add('reveal-on-scroll');
  if (element.classList.contains('bundle') || element.closest('.steps')) {
    element.style.transitionDelay = `${(index % 3) * 80}ms`;
  }
});

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const motionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  motionTargets.forEach(element => motionObserver.observe(element));
} else {
  motionTargets.forEach(element => element.classList.add('is-visible'));
}


// Keep the displayed clock aligned to Ghana time (GMT).
function updateGhanaClock() {
  const clock = document.getElementById('ghanaTime');
  if (!clock) return;
  clock.textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date());
}
updateGhanaClock();
setInterval(updateGhanaClock, 1000);
