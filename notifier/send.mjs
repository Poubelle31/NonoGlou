import webpush from 'web-push';

const {
  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT, PUSH_SUBSCRIPTION, TRIGGER,
} = process.env;

// Chaque créneau existe deux fois dans le workflow (GitHub ne connaît que l'heure UTC) :
// une version pour l'heure d'été (UTC+2) et une pour l'heure d'hiver (UTC+1).
// On n'envoie que celle qui correspond à la saison en cours.
const ETE = new Set(['0 7,10,13,16,19 * * *', '30 8,11,14,17 * * *']);
const HIVER = new Set(['0 8,11,14,17,20 * * *', '30 9,12,15,18 * * *']);

// Personnalise librement ces messages 💌
const MESSAGES = [
  'Petite gorgée ? 💧',
  'Ta goutte a soif… et toi aussi 🥺',
  "Un verre d'eau et tu redeviens invincible ✨",
  'Pause glouglou ! 🫧',
  "Quelqu'un pense à toi… et à ton hydratation 💙",
  "Trois gorgées, c'est cadeau 🎁",
  'Ta peau te dira merci 🌸',
  "Eau secours ! C'est l'heure de boire 🚨",
  "Un verre pour moi, s'il te plaît 🙏",
  'Glou, glou, glou… 🐟',
];

function parisOffset(date = new Date()) {
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
    .formatToParts(date).find((p) => p.type === 'timeZoneName').value; // ex. "GMT+2"
  return Number(tz.replace('GMT', '')) || 0;
}

if (TRIGGER) {
  const offset = parisOffset();
  if ((ETE.has(TRIGGER) && offset !== 2) || (HIVER.has(TRIGGER) && offset !== 1)) {
    console.log(`Créneau "${TRIGGER}" ignoré (heure de Paris actuelle : UTC+${offset}).`);
    process.exit(0);
  }
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_CONTACT || !PUSH_SUBSCRIPTION) {
  console.error('Il manque un secret : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT ou PUSH_SUBSCRIPTION.');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const title = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
const payload = JSON.stringify({ title, body: 'Touche la notification une fois ton verre bu 💦' });

try {
  const res = await webpush.sendNotification(JSON.parse(PUSH_SUBSCRIPTION), payload, {
    TTL: 3600,        // un rappel non reçu dans l'heure est abandonné
    urgency: 'normal',
  });
  console.log(`Rappel envoyé (${res.statusCode}) : ${title}`);
} catch (err) {
  if (err.statusCode === 404 || err.statusCode === 410) {
    console.error("Abonnement expiré : elle doit réactiver les rappels dans l'app et t'envoyer un nouveau code.");
  } else {
    console.error('Envoi impossible :', err.statusCode, err.body || err.message);
  }
  process.exit(1);
}
