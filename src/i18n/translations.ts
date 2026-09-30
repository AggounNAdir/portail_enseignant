export type Language = 'fr' | 'ar';

export interface Translations {
  appName: string;
  appSubtitle: string;
  dashboard: string;
  classes: string;
  students: string;
  grades: string;
  attendance: string;
  reportCards: string;
  analytics: string;
  settings: string;
  welcome: string;
  welcomeSubtitle: string;
  takeAttendance: string;
  addAssessment: string;
  generateReports: string;
  activeClasses: string;
  totalStudents: string;
  generalAverage: string;
  globalAttendance: string;
  classesOverview: string;
  allClasses: string;
  createFirstClass: string;
  customizeProfile: string;
  noClassesYet: string;
  noClassesDescription: string;
  studentsCount: string;
  average: string;
  attendanceRate: string;
  highestGrade: string;
  lowestGrade: string;
  gradeDistribution: string;
  recentAttendance: string;
  noRecentAttendance: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  search: string;
  filterByClass: string;
  all: string;
  actions: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  boy: string;
  girl: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  observations: string;
  addStudent: string;
  importCSV: string;
  exportCSV: string;
  newClass: string;
  className: string;
  level: string;
  subject: string;
  schoolYear: string;
  room: string;
  color: string;
  classDescription: string;
  present: string;
  absent: string;
  late: string;
  excused: string;
  allPresent: string;
  saveAttendance: string;
  sessionSaved: string;
  term: string;
  term1: string;
  term2: string;
  term3: string;
  // Spécifique Algérie CEM
  assessmentType: string;
  cemEvaluation: string; // التقويم المستمر
  cemDevoir1: string;    // الفرض الأول
  cemDevoir2: string;    // الفرض الثاني
  cemExamen: string;     // الاختبار الثلاثي
  cemInterro: string;    // استجواب كتابي
  cemDM: string;         // واجب منزلي
  cemTP: string;         // أعمال تطبيقية
  coefficient: string;
  maxScore: string;
  title: string;
  date: string;
  savedGrades: string;
  score: string;
  rank: string;
  bulletinTitle: string;
  appreciation: string;
  mentionFelicitation: string;
  mentionCompliments: string;
  mentionEncouragement: string;
  mentionWarning: string;
  languageSelect: string;
  french: string;
  arabic: string;
  clearAllData: string;
  exportBackup: string;
  importBackup: string;
  teacherAccount: string;
  schoolName: string;
  mainSubject: string;
  algerianCemNotice: string;
  group: string;
  group1: string;
  group2: string;
  allGroups: string;
  splitGroupsAuto: string;
  splitGroupsAutoDesc: string;
  assignGroup: string;
  filterByGroup: string;
  tdSession: string;
  tdNotice: string;
}

export const translations: Record<Language, Translations> = {
  fr: {
    appName: "ProfPilot",
    appSubtitle: "Portail Enseignant & CEM",
    dashboard: "Tableau de bord",
    classes: "Classes",
    students: "Élèves",
    grades: "Notes & Devoirs",
    attendance: "Appel & Présences",
    reportCards: "Bulletins Trimestriels",
    analytics: "Statistiques",
    settings: "Paramètres",
    welcome: "Bienvenue sur votre espace enseignant",
    welcomeSubtitle: "Gérez vos classes, faites l'appel et saisissez les devoirs selon le système officiel du CEM.",
    takeAttendance: "Faire l'appel du jour",
    addAssessment: "Saisir un devoir / note",
    generateReports: "Générer les bulletins",
    activeClasses: "Classes Actives",
    totalStudents: "Élèves Inscrits",
    generalAverage: "Moyenne Générale",
    globalAttendance: "Taux de Présence",
    classesOverview: "Vue d'ensemble par classe",
    allClasses: "Toutes les classes",
    createFirstClass: "+ Créer ma première classe",
    customizeProfile: "Personnaliser mon compte",
    noClassesYet: "Aucune classe pour le moment",
    noClassesDescription: "Votre espace est vierge. Commencez par créer votre première classe (ex: 1AM, 2AM, 3AM, 4AM) pour y inscrire vos élèves.",
    studentsCount: "Élèves",
    average: "Moyenne",
    attendanceRate: "Présence",
    highestGrade: "Note max",
    lowestGrade: "Note min",
    gradeDistribution: "Distribution des moyennes",
    recentAttendance: "Derniers appels réalisés",
    noRecentAttendance: "Aucun appel enregistré pour l'instant",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    search: "Rechercher...",
    filterByClass: "Filtrer par classe",
    all: "Toutes les classes",
    actions: "Actions",
    firstName: "Prénom",
    lastName: "Nom de famille",
    birthDate: "Date de naissance",
    gender: "Genre",
    boy: "Garçon",
    girl: "Fille",
    parentPhone: "Téléphone des parents",
    parentEmail: "Email des parents",
    address: "Adresse",
    observations: "Observations",
    addStudent: "+ Ajouter un élève",
    importCSV: "Importer CSV / Excel",
    exportCSV: "Exporter la liste",
    newClass: "Nouvelle Classe",
    className: "Nom de la classe (ex: 4AM 1, 3AM 2)",
    level: "Niveau scolaire",
    subject: "Matière",
    schoolYear: "Année scolaire",
    room: "Salle de cours",
    color: "Couleur repère",
    classDescription: "Description",
    present: "Présent",
    absent: "Absent",
    late: "En retard",
    excused: "Justifié",
    allPresent: "Marquer tous présents",
    saveAttendance: "Valider l'appel",
    sessionSaved: "Appel enregistré avec succès !",
    term: "Trimestre",
    term1: "1er Trimestre (الفصل الأول)",
    term2: "2ème Trimestre (الفصل الثاني)",
    term3: "3ème Trimestre (الفصل الثالث)",
    assessmentType: "Type d'évaluation (Barème Algérie CEM)",
    cemEvaluation: "Évaluation continue / التقويم المستمر (Coef 1)",
    cemDevoir1: "Devoir Surveillé 1 / الفرض الأول (Coef 1)",
    cemDevoir2: "Devoir Surveillé 2 / الفرض الثاني (Coef 1)",
    cemExamen: "Composition / الاختبار الثلاثي (Coef 2)",
    cemInterro: "Interrogation / استجواب كتابي",
    cemDM: "Devoir à la maison / واجب منزلي",
    cemTP: "Travaux Pratiques / أعمال تطبيقية",
    coefficient: "Coefficient",
    maxScore: "Barème (sur 20)",
    title: "Titre du devoir",
    date: "Date",
    savedGrades: "Saisie des notes",
    score: "Note",
    rank: "Rang",
    bulletinTitle: "Bulletin de Notes Scolaire - Trimestre",
    appreciation: "Appréciation pédagogique",
    mentionFelicitation: "Félicitations",
    mentionCompliments: "Compliments",
    mentionEncouragement: "Encouragements",
    mentionWarning: "Avertissement",
    languageSelect: "Langue / اللغة",
    french: "Français",
    arabic: "العربية (Algérie)",
    clearAllData: "Vider toutes les données (Base vierge)",
    exportBackup: "Télécharger la sauvegarde (JSON)",
    importBackup: "Restaurer une sauvegarde",
    teacherAccount: "Mon Compte Enseignant",
    schoolName: "Établissement (CEM / Établissement)",
    mainSubject: "Matière principale",
    algerianCemNotice: "Système officiel CEM Algérie appliqué : التقويم المستمر (Coef 1) + الفرض (Coef 1) + الاختبار (Coef 2) / 4",
    group: "Groupe TD / TP",
    group1: "Groupe 1 (الفوج 1)",
    group2: "Groupe 2 (الفوج 2)",
    allGroups: "Toute la classe (القسم كاملاً)",
    splitGroupsAuto: "Diviser en 2 groupes TD (50% / 50%)",
    splitGroupsAutoDesc: "Répartit automatiquement les élèves de la classe en Groupe 1 et Groupe 2 par ordre alphabétique.",
    assignGroup: "Attribuer le groupe",
    filterByGroup: "Filtrer par groupe TD",
    tdSession: "Séance de TD / TP",
    tdNotice: "Gestion par groupes : appel et travaux dirigés par فوج"
  },
  ar: {
    appName: "بروف بايلوت",
    appSubtitle: "بوابة الأستاذ للتعليم المتوسط (CEM)",
    dashboard: "لوحة التحكم",
    classes: "الأقسام والصفوف",
    students: "التلاميذ",
    grades: "النقاط والفروض",
    attendance: "تسجيل الغيابات",
    reportCards: "كشوف النقاط الفصلية",
    analytics: "الإحصائيات",
    settings: "الإعدادات",
    welcome: "مرحباً بك في فضاء الأستاذ",
    welcomeSubtitle: "إدارة الأقسام، تسجيل الحضور، ورصد علامات الفروض والتقويم والاختبارات وفق النظام الرسمي الجزائري.",
    takeAttendance: "تسجيل الحضور اليومي",
    addAssessment: "رصد فرض / اختبار جديد",
    generateReports: "استخراج كشوف النقاط",
    activeClasses: "الأقسام المسندة",
    totalStudents: "مجموع التلاميذ",
    generalAverage: "المعدل العام",
    globalAttendance: "نسبة الحضور العامة",
    classesOverview: "نظرة عامة على الأقسام",
    allClasses: "جميع الأقسام",
    createFirstClass: "+ إنشاء القسم الأول",
    customizeProfile: "تخصيص حساب الأستاذ",
    noClassesYet: "لا يوجد أي قسم مسجل حالياً",
    noClassesDescription: "التطبيق فارغ وجاهز. ابدأ بإنشاء قسمك الأول (مثال: 1 متوسط 1، 4 متوسط 2) لإضافة التلاميذ.",
    studentsCount: "التلاميذ",
    average: "المعدل",
    attendanceRate: "نسبة الحضور",
    highestGrade: "أعلى معدل",
    lowestGrade: "أدنى معدل",
    gradeDistribution: "توزيع المعدلات",
    recentAttendance: "آخر سجلات الغياب",
    noRecentAttendance: "لا يوجد أي تسجيل حضور حتى الآن",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    search: "بحث عن تلميذ...",
    filterByClass: "تصفية حسب القسم",
    all: "كل الأقسام",
    actions: "خيارات",
    firstName: "الاسم",
    lastName: "اللقب",
    birthDate: "تاريخ الميلاد",
    gender: "الجنس",
    boy: "ذكر",
    girl: "أنثى",
    parentPhone: "هاتف الولي",
    parentEmail: "بريد الولي",
    address: "العنوان",
    observations: "ملاحظات",
    addStudent: "+ إضافة تلميذ",
    importCSV: "استيراد قائمة (Excel / CSV)",
    exportCSV: "تصدير القائمة",
    newClass: "قسم جديد",
    className: "اسم القسم (مثال: 4 متوسط 1، 3 متوسط 2)",
    level: "المستوى الدراسي",
    subject: "المادة التعليمية",
    schoolYear: "السنة الدراسية",
    room: "القاعة / الفوج",
    color: "لون التمييز",
    classDescription: "وصف إضافي",
    present: "حاضر",
    absent: "غائب",
    late: "متأخر",
    excused: "غياب مبرر",
    allPresent: "تعيين الكل حاضر",
    saveAttendance: "تأكيد تسجيل الحضور",
    sessionSaved: "تم حفظ ورقة الحضور بنجاح !",
    term: "الفصل الدراسي",
    term1: "الفصل الأول",
    term2: "الفصل الثاني",
    term3: "الفصل الثالث",
    assessmentType: "نوع التقييم (نظام التعليم المتوسط الجزائري CEM)",
    cemEvaluation: "التقويم المستمر (المعامل 1)",
    cemDevoir1: "الفرض الأول (المعامل 1)",
    cemDevoir2: "الفرض الثاني (المعامل 1)",
    cemExamen: "الاختبار الثلاثي (المعامل 2)",
    cemInterro: "استجواب كتابي",
    cemDM: "واجب منزلي",
    cemTP: "أعمال تطبيقية (مخبر)",
    coefficient: "المعامل",
    maxScore: "العلامة القصوى (على 20)",
    title: "عنوان الفرض أو الاختبار",
    date: "التاريخ",
    savedGrades: "رصد العلامات",
    score: "النقطة",
    rank: "الرتبة",
    bulletinTitle: "كشف النقاط الفصلي - التعليم المتوسط",
    appreciation: "ملاحظة الأستاذ",
    mentionFelicitation: "تهنئة وتفوق",
    mentionCompliments: "تشجيع وتنويه",
    mentionEncouragement: "لوحة شرف",
    mentionWarning: "إنذار وتنبيه",
    languageSelect: "اللغة / Langue",
    french: "Français (الفرنسية)",
    arabic: "العربية (الجزائر)",
    clearAllData: "إفراغ كل البيانات (تصفير التطبيق)",
    exportBackup: "تحميل نسخة احتياطية (JSON)",
    importBackup: "استرجاع نسخة سابقة",
    teacherAccount: "حساب وبيانات الأستاذ",
    schoolName: "المتوسطة / المؤسسة التعليمية",
    mainSubject: "المادة المسندة",
    algerianCemNotice: "النظام المطبق: التقويم المستمر (1) + الفرض (1) + الاختبار (2) مقسوم على 4",
    group: "فوج الأعمال الموجهة (TD/TP)",
    group1: "الفوج 1 (Groupe 1)",
    group2: "الفوج 2 (Groupe 2)",
    allGroups: "القسم كاملاً (Toute la classe)",
    splitGroupsAuto: "تقسيم القسم إلى فوجين تلقائياً (50% / 50%)",
    splitGroupsAutoDesc: "توزيع تلاميذ القسم بالتساوي إلى الفوج 1 والفوج 2 حسب الترتيب الأبجدي لحصص الأعمال الموجهة والمخبر.",
    assignGroup: "تعيين الفوج",
    filterByGroup: "تصفية حسب الفوج",
    tdSession: "حصة أعمال موجهة / مخبر (TD/TP)",
    tdNotice: "نظام الأفواج: تسجيل غيابات الأعمال الموجهة حسب الفوج"
  }
};
