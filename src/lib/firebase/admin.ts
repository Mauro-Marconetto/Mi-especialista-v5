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
    // Cuando se despliega en un entorno de Google Cloud, las ADC se encuentran automáticamente.
    // Para desarrollo local, estas variables de entorno deben estar en tu archivo .env.
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.GOOGLE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      // Reemplaza los saltos de línea literales \n en la clave privada por \\n para que sean interpretados correctamente.
      privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    // El SDK de Admin intentará usar las variables de entorno si están presentes.
    // Si no lo están (y estás en un entorno de Google Cloud), usará las credenciales del entorno.
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK inicializado correctamente.');
  } catch (error: any) {
    // Si falla la inicialización con `cert`, intenta con `applicationDefault`.
    // Esto cubre el caso en que las variables de entorno no están definidas, pero el entorno de ejecución (ej. Firebase Hosting) sí provee credenciales.
    if (error.code === 'app/invalid-credential') {
        try {
            console.log('Credenciales de cuenta de servicio no encontradas o inválidas, intentando con Application Default Credentials...');
            admin.initializeApp({
              credential: admin.credential.applicationDefault(),
            });
            console.log('Firebase Admin SDK inicializado con Application Default Credentials.');
        } catch (adcError: any) {
             console.error('Error al inicializar Firebase Admin SDK con Application Default Credentials:', adcError);
             throw new Error('No se pudo inicializar el Firebase Admin SDK. Asegúrate de que las variables de entorno o el entorno de ejecución estén configurados correctamente.');
        }
    } else {
        console.error('Error al inicializar Firebase Admin SDK:', error);
        throw error;
    }
  }
}

const adminDb = admin.firestore();

export { admin, adminDb };
