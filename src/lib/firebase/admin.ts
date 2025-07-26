/**
 * @fileoverview Configuración e inicialización del Firebase Admin SDK para el lado del servidor.
 *
 * Utiliza las Credenciales por Defecto de la Aplicación (ADC) cuando se despliega en un entorno de Google Cloud (como Firebase Hosting, Cloud Functions, App Engine),
 * y permite especificar una cuenta de servicio a través de variables de entorno para desarrollo local o entornos que no son de Google Cloud.
 *
 * Variables de entorno para desarrollo local:
 * - GOOGLE_PROJECT_ID: El ID de tu proyecto de Firebase.
 * - GOOGLE_CLIENT_EMAIL: El email de tu cuenta de servicio.
 * - GOOGLE_PRIVATE_KEY: La clave privada de tu cuenta de servicio (reemplaza los saltos de línea \n por \\n).
 */
import * as admin from 'firebase-admin';

// Evita la reinicialización en entornos de "hot-reload"
if (!admin.apps.length) {
  try {
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.GOOGLE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    // Check if the service account credentials are provided in the environment.
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
       admin.initializeApp({
         credential: admin.credential.cert(serviceAccount),
       });
       console.log('Firebase Admin SDK inicializado correctamente con credenciales de cuenta de servicio.');
    } else {
        // Fallback to Application Default Credentials if service account is not provided.
        // This is useful for environments like Google Cloud Run, Cloud Functions, etc.
        console.log('Credenciales de cuenta de servicio no encontradas en las variables de entorno, intentando con Application Default Credentials...');
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        console.log('Firebase Admin SDK inicializado con Application Default Credentials.');
    }
  } catch (error: any) {
    console.error('--------------------------------------------------------------------');
    console.error('❌ ERROR FATAL: No se pudo inicializar el Firebase Admin SDK.');
    console.error('Este es un problema de configuración y no un error en el código de la aplicación.');
    console.error('CAUSA MÁS PROBABLE: Faltan las credenciales de la cuenta de servicio en tu entorno local.');
    console.error('\nSOLUCIÓN:');
    console.error('1. Ve a tu proyecto de Firebase -> Project Settings -> Service accounts.');
    console.error('2. Haz clic en "Generate new private key" para descargar un archivo JSON.');
    console.error('3. Abre tu archivo .env y añade las siguientes variables con los valores del JSON:');
    console.error('   GOOGLE_PROJECT_ID="tu-project-id"');
    console.error('   GOOGLE_CLIENT_EMAIL="tu-client-email"');
    console.error('   GOOGLE_PRIVATE_KEY="tu-private-key" (Copia toda la clave, incluyendo "-----BEGIN PRIVATE KEY-----" y asegúrate de escapar los saltos de línea con \\n).');
    console.error('\nConsulta el archivo README.md para más detalles.');
    console.error('--------------------------------------------------------------------');
  }
}

let adminDb: admin.firestore.Firestore;
try {
  adminDb = admin.firestore();
} catch (e) {
    console.error("Error al obtener la instancia de Firestore. El Admin SDK no se inicializó correctamente.")
    // We create a dummy object here to avoid further crashes in the app,
    // although any attempt to use it will fail.
    // The console error above is the most important part.
    adminDb = {} as admin.firestore.Firestore;
}


export { admin, adminDb };