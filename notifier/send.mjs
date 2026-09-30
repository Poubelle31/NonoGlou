import webpush from 'web-push';

const {
  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT, PUSH_SUBSCRIPTION, FORCE,
} = process.env;

// Plage horaire autorisée, heure de Paris (été comme hiver).
// Sécurité : même si un déclenchement arrive en retard, aucun rappel ne part la nuit.
const DEBUT = 9;   // pas de rappel avant 9h00
const FIN = 21;    // dernier rappel à 21h (tolérance de 15 minutes)

// Personnalise librement ces messages 💌
const MESSAGES = [
  'Petite gorgée ? 💧',
  'Ta goutte a soif… et toi aussi 🥺',
  "Il y a pas un verre d'eau qui traine dans l'appart? ✨",
  "sors ta paille, c'est l'heure de boire",
  "Quelqu'un pense à toi… et à ton hydratation 💙",
  "ça sent la Nono déshydratée... ",
  "Coucou, c'est ton relou de mec qui te dit de boire ❤️",
  "Aller, encore un pour la route 😉",
  "Un verre pour moi, s'il te plaît 🙏",
  'Glou, glou, glou… 🐟',
];

function heureDeParis(date = new Date()) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { h: get('hour'), m: get('minute') };
}

const { h, m } = heureDeParis();
const dansLaPlage = h >= DEBUT && (h < FIN || (h === FIN && m <= 15));

if (!dansLaPlage && FORCE !== 'true') {
  console.log(`Il est ${h}h${String(m).padStart(2, '0')} à Paris : hors de la plage ${DEBUT}h–${FIN}h, pas de rappel.`);
  process.exit(0);
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
    TTL: 1800,        // un rappel non reçu dans la demi-heure est abandonné
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
