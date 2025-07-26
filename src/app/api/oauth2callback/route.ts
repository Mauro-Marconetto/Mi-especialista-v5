import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { adminDb } from '@/lib/firebase/admin';

const OAUTH_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// Crea un cliente OAuth con la misma URL usada en createGoogleMeet
function createOAuthClient() {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth2callback`;
  console.log("REDIRECT URI:", redirectUri);

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 });
  }

  let doctorId: string, appointmentId: string;

  try {
    const parsedState = JSON.parse(state);
    doctorId = parsedState.doctorId;
    appointmentId = parsedState.appointmentId;
  } catch (err) {
    console.error('❌ Error parsing state:', err);
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
  }

  try {
    const oauth2Client = createOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Guarda los tokens en el usuario
    const doctorRef = adminDb.collection('users').doc(doctorId);
    await doctorRef.update({ googleTokens: tokens });

    console.log('✅ Tokens guardados para el médico:', doctorId);

    // Redirige al dashboard del médico
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/doctor/calendar`);
  } catch (error) {
    console.error('❌ Error en el callback de OAuth2:', error);
    return NextResponse.json({ error: 'Error during OAuth2 callback' }, { status: 500 });
  }
}
