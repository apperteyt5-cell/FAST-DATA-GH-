
const API_URL = 'https://fast-data-gh-backend.onrender.com';

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

menuToggle?.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

mainNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mainNav.classList.remove('open'));
});

let chosenBundle = null;
let pendingOrder = null;

const bundleGrid = document.getElementById('bundleGrid');
const dialog = document.getElementById('summaryDialog');

// Existing retail prices retained from the website.
const sellingPrices = {
  '1GB': 5.80,
  '2GB': 11.50,
  '5GB': 28.00
};

// Fetch MTN bundles from our backend.
async function loadBundles() {
  bundleGrid.innerHTML = '<p>Loading MTN bundles...</p>';

  try {
    const response = await fetch(`${API_URL}/api/bundles`);

    if (!response.ok) {
      throw new Error('Could not load bundles.');
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.bundles)) {
      throw new Error('Invalid bundle response.');
    }

    const mtnBundles = result.bundles.filter(bundle =>
  String(bundle.network).toUpperCase() === 'MTN' &&
  Number(bundle.size_mb) >= 1000 &&
  Number(bundle.size_mb) <= 20000
);

    if (!mtnBundles.length) {
      throw new Error('No MTN bundles available.');
    }

    bundleGrid.innerHTML = '';

    mtnBundles.sort((a, b) => a.size_mb - b.size_mb);

    mtnBundles.forEach(bundle => {
      const name = bundle.size;
      const price = sellingPrices[name];

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bundle';
      button.dataset.name = name;
      button.dataset.bundleId = bundle.bundleId;

      if (price !== undefined) {
        button.dataset.price = price;

        button.innerHTML = `
          <span class="bundle-size">${name}</span>
          <span class="bundle-price">GH₵ ${price.toFixed(2)}</span>
          <span class="bundle-action">Select bundle →</span>
        `;

        button.addEventListener('click', () => selectBundle(button));
      } else {
        button.disabled = true;
        button.innerHTML = `
          <span class="bundle-size">${name}</span>
          <span class="bundle-price">Price coming soon</span>
          <span class="bundle-action">Not available yet</span>
        `;
      }

      bundleGrid.appendChild(button);
    });

    observeMotionElements();

  } catch (error) {
    bundleGrid.innerHTML = `
      <p class="form-message">
        Unable to load MTN bundles. Please refresh and try again.
      </p>
    `;
    console.error('Bundle loading error:', error);
  }
}

// Select a bundle.
function selectBundle(button) {
  document.querySelectorAll('.bundle').forEach(item => {
    item.classList.remove('selected');
  });

  button.classList.add('selected');

  chosenBundle = {
    name: button.dataset.name,
    price: Number(button.dataset.price),
    bundleId: button.dataset.bundleId
  };

  document.getElementById('selectedBundle').value = chosenBundle.name;

  document.getElementById('selectedPrice').value =
    `GH₵ ${chosenBundle.price.toFixed(2)}`;

  document.getElementById('formMessage').textContent = '';

  document.getElementById('orderPanel').scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

// Submit order details.
document.getElementById('orderForm').addEventListener('submit', event => {
  event.preventDefault();

  const phone = document.getElementById('phone').value.trim();
  const message = document.getElementById('formMessage');

  if (!chosenBundle) {
    message.textContent = 'Please select an MTN bundle first.';
    return;
  }

  if (!/^0\d{9}$/.test(phone)) {
    message.textContent =
      'Enter a valid 10-digit Ghana phone number starting with 0.';
    return;
  }

  pendingOrder = {
    ...chosenBundle,
    phone,
    network: 'MTN'
  };

  document.getElementById('summaryBundle').textContent =
    pendingOrder.name;

  document.getElementById('summaryPhone').textContent =
    pendingOrder.phone;

  document.getElementById('summaryPrice').textContent =
    `GH₵ ${pendingOrder.price.toFixed(2)}`;

  document.getElementById('demoReceipt').textContent = '';

  dialog.showModal();
});

// Close order summary.
document.getElementById('closeDialog').addEventListener('click', () => {
  dialog.close();
});

// Demo order only. No real payment or delivery.
document.getElementById('confirmDemo').addEventListener('click', () => {
  if (!pendingOrder) return;

  const reference =
    'FDG-' + Math.floor(100000 + Math.random() * 900000);

  const saved = JSON.parse(
    localStorage.getItem('fdgDemoOrders') || '{}'
  );

  saved[reference] = {
    ...pendingOrder,
    status: 'Awaiting payment setup',
    createdAt: new Date().toISOString(),
    eta: '4+ hours (busy-period estimate)'
  };

  localStorage.setItem('fdgDemoOrders', JSON.stringify(saved));

  const placedAt = new Date(saved[reference].createdAt)
    .toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Accra'
    });

  document.getElementById('demoReceipt').textContent =
    `Demo receipt: ${reference} · Placed ${placedAt} Ghana time · Demo only; payment and delivery are not connected yet.`;

  document.getElementById('orderId').value = reference;
});

// Demo order tracking.
document.getElementById('trackForm').addEventListener('submit', event => {
  event.preventDefault();

  const reference = document.getElementById('orderId')
    .value.trim().toUpperCase();

  const saved = JSON.parse(
    localStorage.getItem('fdgDemoOrders') || '{}'
  );

  const order = saved[reference];

  document.getElementById('trackResult').textContent = order
    ? `Bundle: ${order.name} • Network: MTN • Number: ${order.phone} • Status: ${order.status} • Placed: ${new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' })} Ghana time`
    : 'We could not find that demo order on this device.';
});

// Current year.
document.getElementById('year').textContent =
  new Date().getFullYear();

// Scroll animations.
function observeMotionElements() {
  const motionTargets = document.querySelectorAll(
    '.section-heading, .bundle, .order-panel, .track-copy, .track-form, .steps article'
  );

  motionTargets.forEach((element, index) => {
    element.classList.add('reveal-on-scroll');

    if (element.classList.contains('bundle') ||
        element.closest('.steps')) {
      element.style.transitionDelay = `${(index % 3) * 80}ms`;
    }
  });

  if (
    'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    motionTargets.forEach(element => observer.observe(element));
  } else {
    motionTargets.forEach(element =>
      element.classList.add('is-visible')
    );
  }
}

// Ghana clock.
function updateGhanaClock() {
  const clock = document.getElementById('ghanaTime');
  if (!clock) return;

  clock.textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Accra',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());
}

updateGhanaClock();
setInterval(updateGhanaClock, 1000);

// Start loading MTN bundles.
loadBundles();
  
