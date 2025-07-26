import { config } from 'dotenv';
config(); // Load environment variables from .env

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

async function testFirebaseUserWrite() {
  console.log("Iniciando prueba de escritura de usuario en Firestore...");

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("❌ Error: Credenciales de Firebase no encontradas. Asegúrate de que tu archivo .env está completo y correcto.");
    process.exit(1);
  }

  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    console.log(`Conectado al proyecto de Firebase: ${firebaseConfig.projectId}`);

    const testUserId = `test-user-${Date.now()}`;
    const userDocRef = doc(db, 'users', testUserId);
    const testUserData = {
        uid: testUserId,
        email: 'test@example.com',
        role: 'paciente',
        createdAt: new Date(),
    };

    console.log(`Intentando escribir en 'users/${testUserId}'...`);
    // Este script no está autenticado, por lo que fallará con reglas seguras.
    // La guía de error a continuación es la parte más importante.
    await setDoc(userDocRef, testUserData);
    console.log(`✅ Documento de usuario de prueba escrito con ID: ${testUserId}`);

    console.log("Intentando leer el documento de vuelta...");
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      console.log("✅ Datos del documento leído:", docSnap.data());
    } else {
      throw new Error("No se pudo leer el documento después de escribirlo.");
    }
    
    console.log("Limpiando y eliminando el documento de prueba...");
    await deleteDoc(userDocRef);
    console.log(`✅ Documento de prueba eliminado.`);

    console.log("\n🎉 ¡Prueba de escritura de usuario en Firestore completada con éxito! La conexión y los permisos básicos funcionan.");
    console.log("\n💡 ¡Importante! No olvides volver a establecer tus reglas de seguridad originales si las cambiaste por unas más permisivas para esta prueba.");

  } catch (error: any) {
    console.error("\n❌ La prueba de escritura de usuario falló. La causa más probable son las reglas de seguridad de Firestore.");
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission denied"))) {
         console.error("\n👉 CAUSA PROBABLE: ¡Permiso denegado por las Reglas de Seguridad de Firestore!");
         console.error("   Las reglas de seguridad por defecto son restrictivas. Para que la aplicación funcione, necesitas permitir lecturas públicas y escrituras autenticadas.");
         console.error("\n   PARA SOLUCIONARLO:");
         console.error("   1. Ve a tu Consola de Firebase -> Firestore Database -> Pestaña 'Reglas'.");
         console.error("   2. Reemplaza las reglas existentes con las siguientes y haz clic en 'Publicar':");
         console.error("   -------------------------------------------------");
         console.error("   rules_version = '2';");
         console.error("   service cloud.firestore {");
         console.error("     match /databases/{database}/documents {");
         console.error("");
         console.error("       match /users/{userId} {");
         console.error("         // Regla de ESCRITURA: Solo un usuario autenticado puede crear o actualizar su propio documento.");
         console.error("         allow write: if request.auth != null && request.auth.uid == userId;");
         console.error("");
         console.error("         // Regla de LECTURA: ¡IMPORTANTE!");
         console.error("         // Permite que cualquiera lea los perfiles de usuario. Esto es necesario para la búsqueda pública de doctores.");
         console.error("         allow read: if true;");
         console.error("       }");
         console.error("");
         console.error("       match /insurances/{insuranceId} {");
         console.error("         // Permite que cualquiera lea la lista de obras sociales.");
         console.error("         allow read: if true;");
         console.error("         // Permite que el script de 'seed' escriba en esta colección.");
         console.error("         allow write: if true; // Para producción, restringe esto a los administradores.");
         console.error("       }");
         console.error("");
         console.error("       match /appointments/{appointmentId} {");
         console.error("         // LIST: Permite a un usuario autenticado consultar la colección (necesario para ver disponibilidad).");
         console.error("         allow list: if request.auth != null;");
         console.error("");
         console.error("         // GET, UPDATE: Solo el paciente o doctor involucrado puede leer/actualizar el turno.");
         console.error("         allow get, update: if request.auth != null && ");
         console.error("                           (request.auth.uid == resource.data.patientId || request.auth.uid == resource.data.doctorId);");
         console.error("");
         console.error("         // CREACIÓN: Un paciente autenticado puede crear un turno para sí mismo.");
         console.error("         allow create: if request.auth != null && request.auth.uid == request.resource.data.patientId;");
         console.error("       }");
         console.error("     }");
         console.error("   }");
         console.error("   -------------------------------------------------");
         console.error("   3. Vuelve a ejecutar la aplicación. Debería funcionar.");
         console.error("   4. ¡IMPORTANTE! Revisa estas reglas para un entorno de producción para asegurar tus datos.");

    } else {
        console.error("Se encontró un error diferente:", error.message);
        console.error("Asegúrate de que Firestore esté habilitado en tu proyecto y que las credenciales en .env sean correctas.");
    }
    console.error("\nError detallado:", error);
    process.exit(1);
  }
}

testFirebaseUserWrite();
