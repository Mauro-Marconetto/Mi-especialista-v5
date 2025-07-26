
'use server';

import { google } from 'googleapis';
import { adminDb } from './firebase/admin';
import { OAuth2Client } from 'google-auth-library';
import { headers } from 'next/headers';

const OAUTH_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

type CreateMeetParams = {
  appointmentId: string;
  doctorId: string;
  summary: string;
  description: string;
  startDateTime: string;
  attendees: { email: string }[];
};

type ActionResult = {
  error?: string;
  needsAuth?: boolean;
  authUrl?: string;
  meetUrl?: string; // Add meetUrl to the return type
};

// Helper function to create an OAuth2 client
function createOAuthClient(): OAuth2Client {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth2callback`;
  console.log("Redirect URI usado para Google OAuth2:", redirectUri);
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

// Server Action to create the Google Meet link
export async function createGoogleMeet(params: CreateMeetParams): Promise<ActionResult> {
  const { appointmentId, doctorId, summary, description, startDateTime, attendees } = params;

  try {
    const doctorRef = adminDb.collection('users').doc(doctorId);
    const doctorSnap = await doctorRef.get();

    if (!doctorSnap.exists) {
      return { error: 'Doctor not found.' };
    }

    const doctorData = doctorSnap.data();
    if (!doctorData) {
      return { error: 'Doctor data not found.' };
    }

    const googleTokens = doctorData.googleTokens;
    const oauth2Client = createOAuthClient();

    // If doctor doesn't have tokens, they need to authorize first
    if (!googleTokens || !googleTokens.refresh_token) {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: OAUTH_SCOPES,
        prompt: 'consent',
        state: JSON.stringify({ doctorId, appointmentId }),
      });
      return { needsAuth: true, authUrl };
    }

    oauth2Client.setCredentials(googleTokens);

    if (googleTokens.expiry_date && googleTokens.expiry_date < Date.now()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await doctorRef.update({ googleTokens: credentials });
      oauth2Client.setCredentials(credentials);
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const appointmentDate = new Date(startDateTime);
    const appointmentDuration = doctorData.appointmentDuration || 30;
    const endDateTime = new Date(appointmentDate.getTime() + appointmentDuration * 60000);

    const event = {
      summary,
      description,
      start: {
        dateTime: appointmentDate.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
      },
      attendees,
      conferenceData: {
        createRequest: {
          requestId: `meet-${appointmentId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    });

    const meetUrl = response.data.hangoutLink;
    if (!meetUrl) {
      throw new Error('Google Calendar did not return a meeting link.');
    }

    const appointmentRef = adminDb.collection('appointments').doc(appointmentId);
    await appointmentRef.update({ meetingUrl: meetUrl });

    return { meetUrl };
  } catch (error: any) {
    console.error('Error in createGoogleMeet Server Action:', error);
    if (error.code === 401 || error.message.includes('invalid_grant')) {
      const oauth2Client = createOAuthClient();
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: OAUTH_SCOPES,
        prompt: 'consent',
        state: JSON.stringify({ doctorId, appointmentId }),
      });
      return { needsAuth: true, authUrl };
    }

    return { error: 'An unexpected error occurred while creating the meeting.' };
  }
}
