
import { config } from 'dotenv';
config(); // Load environment variables from .env

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, writeBatch, getDocs, query, doc } from 'firebase/firestore';

async function seedInsurances() {
  console.log("Iniciando el proceso de siembra de obras sociales en Firestore...");

  // Explicitly check for the existence of the essential environment variable
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error("\n❌ ¡ERROR DE CONFIGURACIÓN!");
    console.error("No se encontraron las credenciales de Firebase. El archivo .env parece faltar o está incompleto.");
    console.error("\nPASOS PARA SOLUCIONARLO:");
    console.error("1. Busca el archivo llamado '.env.example' en la carpeta principal de tu proyecto.");
    console.error("2. Haz una copia de este archivo y renómbrala a '.env'.");
    console.error("3. Abre el nuevo archivo '.env' y rellena los valores con tus credenciales de Firebase.");
    console.error("   (Puedes encontrar estas credenciales en la configuración de tu proyecto en la consola de Firebase).");
    console.error("\nDespués de configurar el archivo .env, vuelve a ejecutar 'npm run dev'.\n");
    process.exit(1); // Stop the script
  }


  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };


  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    console.log(`Conectado al proyecto de Firebase: ${firebaseConfig.projectId}`);

    const insurancesCollection = collection(db, 'insurances');

    const q = query(insurancesCollection);
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        console.warn("⚠️ La colección 'insurances' ya contiene datos. No se agregarán nuevos documentos para evitar duplicados.");
        console.log("Para volver a sembrar, por favor, elimina los documentos existentes en la colección 'insurances' desde la consola de Firebase.");
        return;
    }

    const insuranceNames = [
      "OSDE",
      "Swiss Medical",
      "Galeno",
      "Medifé",
      "PAMI",
      "IOMA",
      "Accord Salud",
      "Hospital Italiano",
      "Hospital Alemán",
      "SanCor Salud",
      "Omint",
      "Prevención Salud",
      "William Hope",
      "OSPe",
      "OSAPM",
      "OSDEPYM",
    ];

    const batch = writeBatch(db);

    console.log(`Preparando para agregar ${insuranceNames.length} obras sociales...`);
    insuranceNames.forEach(name => {
      const docRef = doc(insurancesCollection); 
      batch.set(docRef, { name: name });
    });

    await batch.commit();
    console.log(`✅ ¡Éxito! Se agregaron ${insuranceNames.length} obras sociales a la colección 'insurances'.`);

  } catch (error: any) {
    console.error("\n❌ Falló el proceso de siembra de obras sociales.");
     if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission denied"))) {
         console.error("\n👉 CAUSA PROBABLE: ¡Permiso denegado por las Reglas de Seguridad de Firestore!");
         console.error("   Las reglas de seguridad por defecto son restrictivas. Para que la aplicación funcione, necesitas permitir lecturas públicas y escrituras para este script.");
         console.error("\n   PARA SOLUCIONARLO:");
         console.error("   1. Ve a tu Consola de Firebase -> Firestore Database -> Pestaña 'Reglas'.");
         console.error("   2. Reemplaza las reglas existentes con las que se proveen en el archivo README.md.");
         console.error("   3. Vuelve a ejecutar 'npm run seed:insurances'.");
         console.error("   4. ¡IMPORTANTE! Revisa estas reglas para un entorno de producción para asegurar tus datos.");

    } else {
        console.error("Se encontró un error:", error.message);
    }
    console.error("\nError detallado:", error);
    process.exit(1);
  }
}

seedInsurances();
