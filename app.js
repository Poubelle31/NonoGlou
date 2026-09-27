(() => {
  const GOAL = window.OBJECTIF || 8;
  const KEY = 'glouglou:v1';
  const $ = (id) => document.getElementById(id);

  // ---------- Données (stockées sur le téléphone) ----------
  const dayKey = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || { days: {} }; }
    catch { return { days: {} }; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  function prune() {
    const limit = new Date();
    limit.setDate(limit.getDate() - 30);
    const min = dayKey(limit);
    for (const k of Object.keys(state.days)) if (k < min) delete state.days[k];
  }

  let state = load();
  const today = () => state.days[dayKey()] || 0;

  function change(n, source) {
    const k = dayKey();
    state.days[k] = Math.max(0, (state.days[k] || 0) + n);
    prune();
    save();
    render(n > 0 ? source || 'tap' : 'undo');
  }

  // ---------- Affichage ----------
  const MOUTH = {
    sad:   'M88 186 Q100 177 112 186',
    smile: 'M88 178 Q100 190 112 178',
    happy: 'M84 176 Q100 200 116 176 Z',
  };

  function moodText(n, source) {
    if (n >= GOAL) return 'Objectif atteint, bravo ✨';
    if (source === 'reminder') return 'Verre compté, merci pour ta goutte 💧';
    if (n === 0) return 'Ta goutte est toute sèche…';
    if (n <= 2) return "C'est un bon début, continue !";
    if (n <= 4) return 'Ça remonte, bien joué';
    return 'Presque pleine !';
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Coucou du matin ☀️';
    if (h < 18) return 'Coucou de l'après-midi 🤓';
    return 'Coucou du soir ✨';
  }

  function render(source) {
    const n = today();
    const ratio = Math.min(n / GOAL, 1);

    $('hello').textContent = greeting();
    $('count').textContent = n;
    $('goal').textContent = GOAL;
    $('undo').disabled = n === 0;
    $('mood').textContent = moodText(n, source);

    $('level').style.transform = `translateY(${250 - 238 * ratio}px)`;

    const mouth = $('mouth');
    const kind = n >= Math.ceil(GOAL * 0.75) ? 'happy' : n >= 3 ? 'smile' : 'sad';
    mouth.setAttribute('d', MOUTH[kind]);
    mouth.classList.toggle('open', kind === 'happy');

    const done = n >= GOAL;
    $('eyesOpen').toggleAttribute('hidden', done);
    $('eyesHappy').toggleAttribute('hidden', !done);
    $('drop').classList.toggle('done', done);

    if (source === 'tap' || source === 'reminder') {
      const drop = $('drop');
      drop.classList.remove('squish');
      void drop.offsetWidth;
      drop.classList.add('squish');
      setTimeout(() => drop.classList.remove('squish'), 180);
    }

    renderWeek();
  }

  // Une rangée de 7 barres. offset = 0 : les 7 derniers jours ; offset = 1 : les 7 jours d'avant.
  function renderRow(listId, totalId, offset) {
    const letters = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const ol = $(listId);
    ol.innerHTML = '';
    let total = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i - offset * 7);
      const n = state.days[dayKey(d)] || 0;
      total += n;
      const li = document.createElement('li');
      if (i === 0 && offset === 0) li.className = 'today';
      li.innerHTML = `<b>${n}</b><div class="bar"><i style="--h:${Math.min(n / GOAL, 1) * 100}%"></i></div><span>${letters[d.getDay()]}</span>`;
      ol.appendChild(li);
    }
    $(totalId).textContent = `${total} verre${total > 1 ? 's' : ''}`;
  }

  function renderWeek() {
    renderRow('week', 'totalThis', 0);
    renderRow('lastWeek', 'totalLast', 1);
  }

  // ---------- Interactions ----------
  $('drop').addEventListener('click', () => change(1));
  $('add').addEventListener('click', () => change(1));
  $('undo').addEventListener('click', () => change(-1));

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { state = load(); render(); }
  });

  // Toucher une notification ouvre l'app avec ?drink=1 : on compte un verre.
  const params = new URLSearchParams(location.search);
  const fromReminder = params.has('drink');
  if (fromReminder) history.replaceState(null, '', location.pathname);

  // ---------- Service worker et notifications ----------
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'drink') change(1, 'reminder');
    });
  }

  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  function urlB64ToUint8Array(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  }

  function showCode(sub) {
    $('code').value = JSON.stringify(sub);
    $('codeBlock').hidden = false;
    $('enable').textContent = 'Rappels activés 💧';
  }

  async function existingSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  }

  $('openSettings').addEventListener('click', async () => {
    $('installHint').hidden = isStandalone;
    $('settings').showModal();
    try {
      const sub = await existingSubscription();
      if (sub) showCode(sub);
    } catch {}
  });

  $('closeSettings').addEventListener('click', () => $('settings').close());

  $('enable').addEventListener('click', async () => {
    const status = $('status');
    if (!isStandalone || !('PushManager' in window)) {
      status.textContent = "Les rappels fonctionnent seulement depuis l'icône sur l'écran d'accueil (iOS 16.4 ou plus récent).";
      $('installHint').hidden = false;
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        status.textContent = 'Notifications refusées. Tu peux les autoriser dans Réglages › Notifications › Glouglou.';
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(window.VAPID_PUBLIC_KEY),
        });
      }
      status.textContent = '';
      showCode(sub);
    } catch (err) {
      status.textContent = "L'activation a échoué : " + err.message;
    }
  });

  $('copy').addEventListener('click', async () => {
    const text = $('code').value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      $('code').select();
      document.execCommand('copy');
    }
    $('copy').textContent = 'Code copié ✓';
    setTimeout(() => ($('copy').textContent = 'Copier le code'), 2000);
  });

  // ---------- Démarrage ----------
  render();
  if (fromReminder) setTimeout(() => change(1, 'reminder'), 400);
})();
