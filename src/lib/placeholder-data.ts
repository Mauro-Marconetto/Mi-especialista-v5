



export type Doctor = {
  id: string;
  title: "Dr." | "Dra.";
  name: string;
  specialty: string;
  province: string;
  insurances: string[];
  photoURL: string;
  bio: string;
  experience: string[];
  education: string[];
  languages: { language: string; level: string; }[];
  price: number;
  rating: number;
  reviewCount: number;
  reviews: {
    id: string;
    author: string;
    date: string;
    rating: number;
    comment: string;
  }[];
  weeklyAvailability: any;
  appointmentDuration?: number;
  status?: 'incomplete' | 'pending' | 'pending_update' | 'approved';
};

export const doctors: Doctor[] = [
  {
    id: "1",
    title: "Dr.",
    name: "Juan Pérez",
    specialty: "Cardiología",
    province: "CABA",
    insurances: ["OSDE", "Swiss Medical"],
    photoURL: "https://placehold.co/400x400.png",
    bio: "El Dr. Juan Pérez es un cardiólogo con más de 15 años de experiencia en el diagnóstico y tratamiento de enfermedades cardiovasculares. Egresado de la Universidad de Buenos Aires, ha completado su residencia en el Hospital Italiano y se especializa en ecocardiografía y cardiología intervencionista.",
    experience: ["Jefe de Cardiología, Hospital Alemán (2018-Presente)", "Cardiólogo de planta, Hospital Italiano (2010-2018)"],
    education: ["Especialista en Cardiología, Universidad de Buenos Aires", "Médico, Universidad de Buenos Aires"],
    languages: [
      { language: 'Español', level: 'Nativo' },
      { language: 'Inglés', level: 'Avanzado' }
    ],
    price: 3500,
    rating: 4.9,
    reviewCount: 124,
    reviews: [
      { id: 'r1', author: 'Mariana G.', date: '2024-05-10', rating: 5, comment: 'Excelente profesional. Muy atento y claro en sus explicaciones.' },
      { id: 'r2', author: 'Carlos R.', date: '2024-04-22', rating: 5, comment: 'Resolvió todas mis dudas. El consultorio es impecable.' }
    ],
    weeklyAvailability: {
      monday: { enabled: true, slots: [{ start: "09:00", end: "13:00" }, { start: "15:00", end: "18:00" }] },
      tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
      wednesday: { enabled: true, slots: [{ start: "09:00", end: "13:00" }] },
      thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
      friday: { enabled: true, slots: [{ start: "09:00", end: "13:00" }] },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] },
    },
    appointmentDuration: 30,
    status: 'approved',
  },
  {
    id: "2",
    title: "Dra.",
    name: "Ana García",
    specialty: "Dermatología",
    province: "Córdoba",
    insurances: ["Galeno", "OSDE"],
    photoURL: "https://placehold.co/400x400.png",
    bio: "La Dra. Ana García es una reconocida dermatóloga especialista en dermatología clínica y estética. Con un enfoque centrado en el paciente, ofrece tratamientos personalizados para una amplia gama de afecciones de la piel, pelo y uñas.",
    experience: ["Directora de Centro Dermatológico PielSana (2015-Presente)", "Dermatóloga, Clínica Reina Fabiola (2010-2015)"],
    education: ["Postgrado en Dermatología Estética, UCA", "Especialista en Dermatología, Universidad Nacional de Córdoba"],
    languages: [{ language: 'Español', level: 'Nativo' }],
    price: 3000,
    rating: 4.8,
    reviewCount: 98,
    reviews: [
        { id: 'r3', author: 'Lucía F.', date: '2024-05-15', rating: 5, comment: 'La doctora es muy amable y me ayudó mucho con mi problema de acné.' },
    ],
    weeklyAvailability: {
      monday: { enabled: false, slots: [] },
      tuesday: { enabled: true, slots: [{ start: "14:00", end: "19:00" }] },
      wednesday: { enabled: true, slots: [{ start: "09:00", end: "14:00" }] },
      thursday: { enabled: true, slots: [{ start: "14:00", end: "19:00" }] },
      friday: { enabled: true, slots: [{ start: "09:00", end: "14:00" }] },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] },
    },
    appointmentDuration: 20,
    status: 'approved',
  },
  {
    id: "3",
    title: "Dr.",
    name: "Carlos Rodríguez",
    specialty: "Pediatría",
    province: "Santa Fe",
    insurances: ["Swiss Medical", "Medifé"],
    photoURL: "https://placehold.co/400x400.png",
    bio: "Con una gran vocación por la salud infantil, el Dr. Carlos Rodríguez se dedica al cuidado integral de niños y adolescentes. Su enfoque se basa en la prevención y el seguimiento del crecimiento y desarrollo saludable.",
    experience: ["Pediatra, Sanatorio de Niños (2012-Presente)"],
    education: ["Especialista en Pediatría, Universidad Nacional de Rosario"],
    languages: [
        { language: 'Español', level: 'Nativo' },
        { language: 'Portugués', level: 'Bilingüe' }
    ],
    price: 2800,
    rating: 5.0,
    reviewCount: 210,
    reviews: [
        { id: 'r4', author: 'Pedro M.', date: '2024-06-01', rating: 5, comment: 'Un genio el doctor, siempre atento con mi hijo.' },
    ],
    weeklyAvailability: {
      monday: { enabled: true, slots: [{ start: "08:00", end: "12:00" }] },
      tuesday: { enabled: true, slots: [{ start: "08:00", end: "12:00" }] },
      wednesday: { enabled: true, slots: [{ start: "15:00", end: "19:00" }] },
      thursday: { enabled: true, slots: [{ start: "08:00", end: "12:00" }] },
      friday: { enabled: true, slots: [{ start: "15:00", end: "19:00" }] },
      saturday: { enabled: false, slots: [] },
      sunday: { enabled: false, slots: [] },
    },
    appointmentDuration: 45,
    status: 'approved',
  },
];

// NOTE: The dates here should be in the future to properly test the booking UI.
// They are hardcoded for demonstration. In a real scenario, this data would come from a live database query.
export const demoBookedAppointments: { doctorId: string; date: string; time: string }[] = [
    { doctorId: '1', date: '2024-08-19', time: '10:00' }, // Future Monday
    { doctorId: '1', date: '2024-08-19', time: '11:30' },
    { doctorId: '1', date: '2024-08-20', time: '15:00' }, // Future Tuesday
    { doctorId: '2', date: '2024-08-21', time: '09:30' }, // Future Wednesday
];


export const specialties = [
  "Cardiología",
  "Dermatología",
  "Pediatría",
  "Ginecología",
  "Oftalmología",
  "Traumatología",
  "Psicología",
];

export const insurances = [
  "OSDE",
  "Swiss Medical",
  "Galeno",
  "Medifé",
  "PAMI",
  "IOMA",
  "Accord Salud",
];

export const provinces = [
    "Buenos Aires",
    "CABA",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Córdoba",
    "Corrientes",
    "Entre Ríos",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquén",
    "Río Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego",
    "Tucumán"
];

export type PatientAppointment = {
  id: string;
  doctorName: string;
  doctorPhotoUrl?: string;
  doctorSpecialty: string;
  patientName: string;
  date: string;
  time: string;
  status: 'Confirmado' | 'Completado' | 'Cancelado';
  location: string;
  type: 'Telemedicina';
  doctorId: string;
  meetingUrl?: string;
  patientReady?: boolean;
  patientJoined?: boolean;
  isReviewed?: boolean;
};

export const patientAppointments: PatientAppointment[] = [
  {
    id: 'appt-1',
    doctorName: 'Dr. Juan Pérez',
    doctorSpecialty: 'Cardiología',
    patientName: 'Laura Sanchez',
    date: '2024-08-15',
    time: '10:00',
    status: 'Confirmado',
    location: 'Videoconsulta',
    type: 'Telemedicina',
    doctorId: '1',
    meetingUrl: 'https://meet.jit.si/UniqueMeetingRoom1',
    patientReady: false,
    isReviewed: false,
  },
  {
    id: 'appt-2',
    doctorName: 'Dra. Ana García',
    doctorSpecialty: 'Dermatología',
    patientName: 'Laura Sanchez',
    date: '2024-07-30',
    time: '15:30',
    status: 'Confirmado',
    location: 'Videoconsulta',
    type: 'Telemedicina',
    doctorId: '2',
    meetingUrl: 'https://meet.jit.si/UniqueMeetingRoom2',
    patientReady: true,
    isReviewed: false,
  },
  {
    id: 'appt-3',
    doctorName: 'Dr. Carlos Rodríguez',
    doctorSpecialty: 'Pediatría',
    patientName: 'Hijo de Laura',
    date: '2024-06-10',
    time: '11:00',
    status: 'Completado',
    location: 'Videoconsulta',
    type: 'Telemedicina',
    doctorId: '3',
    meetingUrl: 'https://meet.jit.si/UniqueMeetingRoom3',
    isReviewed: true,
  },
  {
    id: 'appt-4',
    doctorName: 'Dr. Juan Pérez',
    doctorSpecialty: 'Cardiología',
    patientName: 'Laura Sanchez',
    date: '2024-05-02',
    time: '09:30',
    status: 'Completado',
    location: 'Videoconsulta',
    type: 'Telemedicina',
    doctorId: '1',
    meetingUrl: 'https://meet.jit.si/UniqueMeetingRoom4',
    isReviewed: false,
  },
    {
    id: 'appt-5',
    doctorName: 'Dra. Ana García',
    doctorSpecialty: 'Dermatología',
    patientName: 'Laura Sanchez',
    date: '2024-04-18',
    time: '16:00',
    status: 'Cancelado',
    location: 'Videoconsulta',
    type: 'Telemedicina',
    doctorId: '2',
    meetingUrl: 'https://meet.jit.si/UniqueMeetingRoom5',
    isReviewed: false,
  },
];

export type PatientListItem = {
  id: string; // This will be the main user's UID
  familyMemberDni?: string; // This will be set if the patient is a family member
  name: string;
  email: string; // The contact email, which is always the main user's email
  dni: string;
  lastVisit: string;
  photoUrl: string;
};

export const doctorPatients: PatientListItem[] = [
  {
    id: 'patient-1',
    name: 'Laura Sánchez',
    email: 'laura.sanchez@example.com',
    dni: '29888777',
    lastVisit: '2024-06-10',
    photoUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'patient-2',
    name: 'Carlos Gómez',
    email: 'carlos.gomez@example.com',
    dni: '25111222',
    lastVisit: '2024-05-21',
    photoUrl: 'https://placehold.co/100x100.png',
  },
  {
    id: 'patient-3',
    name: 'Mariana Torres',
    email: 'mariana.torres@example.com',
    dni: '32555666',
    lastVisit: '2024-07-01',
    photoUrl: 'https://placehold.co/100x100.png',
  },
];

export type ClinicalNote = {
  id: string;
  date: string;
  doctorName: string; // In a real scenario, this would be doctorId
  content: string;
  createdAt?: Date;
};

export const clinicalNotes: ClinicalNote[] = [
    {
        id: 'note-1',
        date: '2024-06-10',
        doctorName: 'Dr. Juan Pérez',
        content: 'La paciente consulta por cuadro de faringitis aguda. Se indica reposo y se receta Amoxicilina 875mg cada 12hs por 7 días. Se solicita control en una semana si no mejora.'
    },
    {
        id: 'note-2',
        date: '2024-03-05',
        doctorName: 'Dr. Juan Pérez',
        content: 'Control anual de salud. Paciente refiere sentirse bien. Se solicitan análisis de sangre de rutina. Presión arterial: 120/80 mmHg. Peso estable.'
    }
];

    