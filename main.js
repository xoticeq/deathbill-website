/* ============================================
   DeathBill - main.js
   ============================================ */

// ── CONFIG ──────────────────────────────────
const WORKER_URL  = 'https://deathbill-api.team93227.workers.dev';
const MC_SERVER   = 'deathbill.net';
const TEBEX_STORE = 'deathbillnet';
// ────────────────────────────────────────────


// ── SERVER STATUS ────────────────────────────
async function fetchServerStatus() {
    try {
        const res  = await fetch(`https://api.mcsrvstat.us/3/${MC_SERVER}`);
        const data = await res.json();

        const statusEl  = document.getElementById('server-status');
        const playersEl = document.getElementById('player-count');
        const versionEl = document.getElementById('server-version');

        if (data.online) {
            statusEl.innerHTML   = '<span class="status-dot"></span>Online';
            statusEl.className   = 'status-value online';
            playersEl.textContent = `${data.players?.online ?? 0} / ${data.players?.max ?? 0}`;
            versionEl.textContent = data.version ?? '-';
        } else {
            statusEl.textContent  = 'Offline';
            statusEl.className    = 'status-value offline';
            playersEl.textContent = '0';
            versionEl.textContent = '-';
        }
    } catch (e) {
        document.getElementById('server-status').textContent = 'Unknown';
    }
}


// ── TEBEX STORE ──────────────────────────────
async function fetchTebexPackages() {
    try {
        const res  = await fetch(`https://headless.tebex.io/api/accounts/${TEBEX_STORE}/packages`, {
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
        const packages = data.data;

        if (packages && packages.length > 0) {
            const pkg   = packages[0];
            const price = pkg.total_price ?? pkg.base_price ?? 5;
            const name  = pkg.name ?? 'DeathBill Revival';
            const desc  = pkg.description ?? 'Purchase a revival to rejoin the server with your full inventory.';

            // Strip HTML tags from description
            const temp = document.createElement('div');
            temp.innerHTML = desc;
            const cleanDesc = temp.textContent || temp.innerText || desc;

            document.getElementById('package-price').textContent = parseFloat(price).toFixed(0);
            document.getElementById('package-name').textContent  = name;
            document.getElementById('package-desc').textContent  = cleanDesc;
            document.getElementById('store-btn').textContent     = `Purchase Revival - $${parseFloat(price).toFixed(2)}`;

            // Store package ID for checkout
            document.getElementById('store-btn').dataset.packageId = pkg.id;
        }
    } catch (e) {
        console.log('Tebex fetch failed, using defaults');
    }
}


// ── TEBEX CHECKOUT ───────────────────────────
function openCheckout() {
    window.open('https://deathbillnet.tebex.io/', '_blank');
}


// ── WIPE COUNTDOWN ───────────────────────────
async function fetchWipeCountdown() {
    try {
        const res      = await fetch(`${WORKER_URL}/wipe`);
        const data     = await res.json();
        const lastWipe = new Date(data.last_wipe);
        const nextWipe = new Date(lastWipe.getTime() + 30 * 24 * 60 * 60 * 1000);

        document.getElementById('last-wipe-text').textContent =
            `Last wipe: ${lastWipe.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

        function tick() {
            const now  = new Date();
            const diff = nextWipe - now;

            if (diff <= 0) {
                ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
                    document.getElementById(id).textContent = '00';
                });
                return;
            }

            const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs  = Math.floor((diff % (1000 * 60)) / 1000);

            document.getElementById('cd-days').textContent  = String(days).padStart(2, '0');
            document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('cd-mins').textContent  = String(mins).padStart(2, '0');
            document.getElementById('cd-secs').textContent  = String(secs).padStart(2, '0');
        }

        tick();
        setInterval(tick, 1000);
    } catch (e) {
        document.getElementById('last-wipe-text').textContent = 'Unable to load wipe data.';
    }
}


// ── SCROLL ANIMATIONS ────────────────────────
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 100);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.step, .rule').forEach(el => observer.observe(el));


// ── INIT ─────────────────────────────────────
fetchServerStatus();
fetchWipeCountdown();
fetchTebexPackages();
setInterval(fetchServerStatus, 60000);