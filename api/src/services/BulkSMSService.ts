import axios from 'axios';

const BULKSMS_URL = 'https://api.bulksms.com/v1/messages';

export async function sendSMS(to: string | string[], body: string): Promise<number> {
  const tokenId = process.env.BULKSMS_TOKEN_ID;
  const tokenSecret = process.env.BULKSMS_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    return 0;
  }
  const recipients = Array.isArray(to) ? to : [to];
  const messages = recipients.map(phone => ({ to: phone, body }));
  try {
    const response = await axios.post(BULKSMS_URL, messages, {
      auth: { username: tokenId, password: tokenSecret },
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data?.length || recipients.length;
  } catch (err: any) {
    console.error('[BulkSMS] Error:', err.response?.data || err.message);
    return 0;
  }
}

export function buildSOSMessage(
  lang: 'af' | 'en',
  type: 'attack' | 'medical' | 'fire' | 'general',
  data: {
    farmerName: string; farmName: string; plotNumber?: string;
    lat: number; lng: number; gateLat?: number; gateLng?: number;
    timestamp: string; bloodType?: string; allergies?: string; medicalAid?: string;
  }
): string {
  const mapsLink = `https://maps.google.com/?q=${data.lat},${data.lng}`;
  const gateLink = data.gateLat ? `https://maps.google.com/?q=${data.gateLat},${data.gateLng}` : '';
  const plot = data.plotNumber ? ` (${data.plotNumber})` : '';

  if (lang === 'af') {
    const headers: Record<string, string> = {
      attack: 'NOODGEVAL: PLAASAANVAL',
      medical: 'MEDIESE NOODGEVAL',
      fire: 'BRAND NOODGEVAL',
      general: 'NOODGEVAL',
    };
    let msg = `${headers[type]}\nNaam: ${data.farmerName}\nPlaas: ${data.farmName}${plot}\nGPS: ${data.lat}, ${data.lng}\n${mapsLink}`;
    if (data.gateLat) msg += `\nHek/Gate GPS: ${data.gateLat}, ${data.gateLng}\n${gateLink}`;
    msg += `\nTyd: ${data.timestamp}`;
    if (type === 'attack') msg += '\nSTUUR HULP DADELIK\nAntwoord VEILIG om te kanselleer';
    if (type === 'medical') {
      msg += `\nMEDIESE HULP BENODIG\nBloedgroep: ${data.bloodType||'Onbekend'}\nAllergieë: ${data.allergies||'Geen'}\nMediese fonds: ${data.medicalAid||'Onbekend'}`;
      msg += '\nAntwoord VEILIG om te kanselleer';
    }
    if (type === 'fire') msg += '\nBRAND OP PLAAS - HULP BENODIG\nNaaste bure moet DADELIK bewus wees\nAntwoord VEILIG om te kanselleer';
    if (type === 'general') msg += '\nAntwoord VEILIG om te kanselleer';
    return msg;
  } else {
    const headers: Record<string, string> = {
      attack: 'EMERGENCY: FARM ATTACK',
      medical: 'MEDICAL EMERGENCY',
      fire: 'FIRE EMERGENCY',
      general: 'EMERGENCY',
    };
    let msg = `${headers[type]}\nName: ${data.farmerName}\nFarm: ${data.farmName}${plot}\nGPS: ${data.lat}, ${data.lng}\n${mapsLink}`;
    if (data.gateLat) msg += `\nGate GPS: ${data.gateLat}, ${data.gateLng}\n${gateLink}`;
    msg += `\nTime: ${data.timestamp}`;
    if (type === 'attack') msg += '\nSEND HELP IMMEDIATELY\nReply SAFE to cancel';
    if (type === 'medical') {
      msg += `\nMEDICAL HELP NEEDED\nBlood Type: ${data.bloodType||'Unknown'}\nAllergies: ${data.allergies||'None'}\nMedical Aid: ${data.medicalAid||'Unknown'}`;
      msg += '\nReply SAFE to cancel';
    }
    if (type === 'fire') msg += '\nFIRE ON FARM - HELP NEEDED\nNeighbours must be aware IMMEDIATELY\nReply SAFE to cancel';
    if (type === 'general') msg += '\nReply SAFE to cancel';
    return msg;
  }
}

export function buildStandDownMessage(lang: 'af' | 'en', name: string, farm: string): string {
  if (lang === 'af') {
    return `VEILIG — Alarm gekanselleer\n${name} (${farm}) het bevestig dat alles veilig is.\nGeen verdere aksie nodig nie.`;
  }
  return `SAFE — Alert cancelled\n${name} (${farm}) has confirmed all is safe.\nNo further action needed.`;
}
