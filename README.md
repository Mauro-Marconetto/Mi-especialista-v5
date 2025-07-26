
# AgendaMed - Mi Especialista

This is a Next.js application for booking medical appointments, built in Firebase Studio.

## Getting Started

To get the application running and connected to your own Firebase project, follow these steps.

### 1. Create your Environment File

The app needs your Firebase project's credentials to connect to the backend. This is the most common source of errors.

1.  **Create a new file named `.env`** in the root directory of this project (the same folder as this README file).
2.  **Copy the content** from the `.env.example` file and paste it into your new `.env` file.
3.  **Find your Firebase Web App credentials:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project (or create a new one).
    *   In the project overview, click the **Web (`</>`)** icon to add a web app or select an existing one.
    *   Go to **Project Settings** (click the gear icon ⚙️).
    *   In the "General" tab, find the `firebaseConfig` object in the code snippet.
4.  **Fill in the values** for each `NEXT_PUBLIC_FIREBASE_*` variable in your `.env` file using the corresponding keys from your `firebaseConfig` object.

### 2. Configure Google Cloud Credentials

For Google Meet integration and server-side operations to work, you need two sets of credentials.

#### a) OAuth 2.0 Client ID (for Google Meet & Calendar)

1.  **Go to Google Cloud Console**:
    *   Go to the [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials).
    *   Click **"+ CREATE CREDENTIALS"** and select **"OAuth client ID"**.
    *   Choose **"Web application"** as the application type.
    *   Under **"Authorized JavaScript origins"**, add your application's URL (e.g., `http://localhost:9002` or your full Cloud Workstation URL).
    *   Under **"Authorized redirect URIs"**, add `YOUR_APP_URL/api/oauth2callback`. For example: `http://localhost:9002/api/oauth2callback`. This step is crucial.
    *   Click **Create**. Copy the **Client ID** and **Client Secret**.
2.  **Fill in the `.env` file**: Paste the copied credentials into the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` variables in your `.env` file.

#### b) Service Account (for Firebase Admin)

1.  **Go to Firebase Console**:
    *   Navigate to **Project Settings** -> **Service accounts**.
    *   Select the **"Firebase Admin SDK"** tab.
    *   Click **"Generate new private key"**. A JSON file will be downloaded.
2.  **Fill in the `.env` file**: Open the downloaded JSON file and copy the values into the corresponding variables in your `.env` file:
    *   `GOOGLE_PROJECT_ID`: Copy the `project_id` value.
    *   `GOOGLE_CLIENT_EMAIL`: Copy the `client_email` value.
    *   `GOOGLE_PRIVATE_KEY`: Copy the entire `private_key` value. **IMPORTANT**: When you paste it, make sure to replace all newline characters (`\n`) with the literal characters `\\n`. The final result should be a single, long line of text within the quotes.

### 3. Authorize Domains

1.  **Authorize Domain in Firebase**:
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and select your project.
    *   Go to **Authentication** -> **Settings** -> **Authorized domains**.
    *   Click **Add domain** and enter your app's domain (e.g., `localhost` for local development or the host from your Cloud Workstation URL).

### 4. Set Firestore Security Rules & Data Structure

By default, your database is locked down. You need to apply security rules to allow the app to read and write data correctly.

1.  In the Firebase Console, go to **Firestore Database** in the left-hand menu.
2.  Click on the **Rules** tab at the top.
3.  Replace the existing rules with the following and click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if a user is an administrator
    function isAdmin(userId) {
      return exists(/databases/$(database)/documents/users/$(userId)) &&
             get(/databases/$(database)/documents/users/$(userId)).data.isAdmin == true;
    }

    // Helper function to check if a user is a professional
    function isProfessional(userId) {
        return exists(/databases/$(database)/documents/users/$(userId)) &&
               get(/databases/$(database)/documents/users/$(userId)).data.role == 'profesional';
    }

    match /users/{userId} {
      // READ RULE: IMPORTANT!
      // Allows anyone to read user profiles. This is necessary for the public doctor search.
      allow read: if true;
      
      // UPDATE (Patient -> Doctor for Reviews):
      // An authenticated user can update a doctor's profile ONLY to add a review.
      // This rule checks that ONLY 'rating', 'reviewCount', and 'reviews' are being changed.
      allow update: if request.auth != null &&
                       isProfessional(userId) &&
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['rating', 'reviewCount', 'reviews']);

      // CREATE / UPDATE (Own Profile):
      // An authenticated user can write to their own document.
      // An administrator can write to any user document.
      allow create, update: if (request.auth != null && request.auth.uid == userId) || isAdmin(request.auth.uid);
      
      // DELETE: No one can delete user documents for data integrity.
      allow delete: if false;
    }

    match /insurances/{insuranceId} {
      // Allows anyone to read the list of health insurances.
      allow read: if true;
      // Only admins can write to the insurances collection after seeding.
      allow write: if isAdmin(request.auth.uid);
    }

    match /appointments/{appointmentId} {
      // LIST: Allows any logged-in user to perform queries on the appointments collection.
      // This is necessary for the app to check a doctor's availability.
      allow list: if request.auth != null;

      // GET, UPDATE: The involved patient, doctor, or an admin can get or update an appointment.
      allow get, update: if request.auth != null && 
                  (request.auth.uid == resource.data.patientId || 
                   request.auth.uid == resource.data.doctorId ||
                   isAdmin(request.auth.uid));

      // CREATE: An authenticated patient can create an appointment for themselves.
      allow create: if request.auth != null && request.auth.uid == request.resource.data.patientId;
    }

    match /clinicalNotes/{noteId} {
      // LIST (QUERY): Allows professionals and admins to query the notes collection.
      // This is necessary to fetch the clinical history for a patient.
      allow list: if request.auth != null && (isProfessional(request.auth.uid) || isAdmin(request.auth.uid));

      // READ (GET): The involved patient, the involved doctor, or an admin can read an individual note.
      allow get: if request.auth != null &&
                 (request.auth.uid == resource.data.patientId || 
                  request.auth.uid == resource.data.doctorId ||
                  isAdmin(request.auth.uid));

      // CREATE: A professional can create a clinical note for one of their patients.
      allow create: if request.auth != null && isProfessional(request.auth.uid) && request.auth.uid == request.resource.data.doctorId;
    }
  }
}
```

### 5. Seed Your Database

The app needs a list of health insurances to work correctly. Run the following command in your terminal to populate the `insurances` collection in your Firestore database:

```bash
npm run seed:insurances
```
This command will only add data if the `insurances` collection is empty.

### 6. (Optional) Create an Admin User

The application now includes an admin panel to approve new doctor profiles. To access it, you need to designate a user as an administrator.

1.  **Create a normal account**: Register in the application through the login interface. You can use any role, but it's easier if you register as a "Patient".
2.  **Go to the Firebase Console**:
    *   Navigate to **Firestore Database**.
    *   In the `users` collection, find the document corresponding to the user you just created (you can identify it by its `email`).
    *   Click **"Add field"**.
    *   **Field name**: `isAdmin`
    *   **Type**: `boolean`
    *   **Value**: `true`
    *   Save the changes.
3.  **Access the Admin Panel**:
    *   Log out of your account in the application.
    *   Navigate to `/admin/login` (e.g., `http://localhost:9002/admin/login`).
    *   Log in with the credentials of the user you just promoted to admin.

### 7. Run the Application

Now you can start the development server:

```bash
npm run dev
```

Your application should now be fully connected to your Firebase project!

## Troubleshooting

### FirebaseError: The query requires an index

If you see an error in your terminal that says `The query requires an index`, it means Firestore needs a special "composite index" to perform a complex query (like filtering by one field and sorting by another).

**Solution:**

1.  The error message will contain a long URL. **Copy this entire URL**.
2.  Paste the URL into your web browser and press Enter.
3.  This will take you directly to the index creation screen in your Firebase project with all the settings pre-filled.
4.  Review the details and click the **Create index** button.

The index will start building. This can take a few minutes. Once the status is "Enabled", the error in your application will be resolved.

### FirebaseError: (auth/unauthorized-domain) or Google Sign-In Cancelled

If you are using Google Sign-In and the popup window closes immediately or you see an error like `auth/popup-closed-by-user`, it's almost always because Firebase and Google Cloud need you to explicitly authorize the domains from which sign-in requests are made.

**Solution:**

1.  **Authorize domain in Firebase**:
    *   Go to the **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized domains**.
    *   Click **Add domain** and enter your app's domain (e.g., `localhost` for local development, or your Cloud Workstation domain like `6000-...cloudworkstations.dev`).

2.  **Configure Redirect URI in Google Cloud**:
    *   Go to the **Google Cloud Console** -> **APIs & Services** -> **Credentials**.
    *   Find your **OAuth 2.0 Client ID** under the "OAuth 2.0 Client IDs" section and click on it to edit.
    *   Under **"Authorized redirect URIs"**, click **"+ ADD URI"**.
    *   Enter `YOUR_APP_URL/api/oauth2callback`. For example, if you are running locally, it would be `http://localhost:9002/api/oauth2callback`. If you are on a Cloud Workstation, it would be `https://YOUR_URL.cloudworkstations.dev/api/oauth2callback`.
    *   Click **Save**. This step is crucial for the Google Meet integration to work correctly.

### FirebaseError: Missing or insufficient permissions

If you get an error about permissions, it's almost always related to your **Firestore Security Rules**. The default rules are very restrictive. Make sure you have copied and published the rules from Step 3 of the "Getting Started" guide.
If you're still having issues, you can run `npm run test:firebase` in your terminal to get a more specific error message about your rules.
