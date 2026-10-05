import {
  Student,
  Assessment,
  Grade,
  AttendanceRecord,
  Classroom,
  Teacher,
  StudentStats,
  ClassStats,
  FullReportCard,
  ReportCardSubjectRow,
  StudentAttendanceSummary
} from '../types';

/**
 * Calcule la moyenne d'un élève pour une classe ou matière donnée.
 * Si les devoirs correspondent au système officiel algérien (التقويم, الفرض, الاختبار),
 * applique la formule officielle du Ministère de l'Éducation Nationale :
 * Moyenne = (التقويم المستمر + معدل الفروض + الاختبار × 2) / 4
 */
export function calculateStudentAverage(
  studentId: string,
  assessments: Assessment[],
  grades: Grade[]
): number | null {
  const studentGrades = grades.filter(
    (g) => g.studentId === studentId && g.score !== null && !g.isAbsent
  );

  if (studentGrades.length === 0) return null;

  // Détection des composantes du système officiel algérien (التقويم / الفرض / الاختبار)
  let taqwimScore: number | null = null;
  const fardhScores: number[] = [];
  let ikhtibarScore: number | null = null;

  for (const grade of studentGrades) {
    const assessment = assessments.find((a) => a.id === grade.assessmentId);
    if (!assessment || grade.score === null) continue;

    const normalized = (grade.score / assessment.maxScore) * 20;
    const typeLower = (assessment.type || '').toLowerCase();
    const titleLower = (assessment.title || '').toLowerCase();

    const isTaqwim = typeLower.includes('تقويم') || titleLower.includes('تقويم') || typeLower.includes('continu');
    const isFardh = typeLower.includes('فرض') || titleLower.includes('فرض') || typeLower.includes('ds');
    const isIkhtibar = typeLower.includes('اختبار') || titleLower.includes('اختبار') || typeLower.includes('composition') || typeLower.includes('examen');

    if (isTaqwim && taqwimScore === null) {
      taqwimScore = normalized;
    } else if (isFardh) {
      fardhScores.push(normalized);
    } else if (isIkhtibar && ikhtibarScore === null) {
      ikhtibarScore = normalized;
    }
  }

  // Si au moins 2 composantes officielles sont présentes (ex: التقويم + الفرض أو الاختبار),
  // appliquer la formule ministérielle algérienne
  const hasOfficialComponents =
    (taqwimScore !== null && fardhScores.length > 0) ||
    (ikhtibarScore !== null && (taqwimScore !== null || fardhScores.length > 0));

  if (hasOfficialComponents) {
    let totalScore = 0;
    let totalDivisor = 0;

    if (taqwimScore !== null) {
      totalScore += taqwimScore;
      totalDivisor += 1;
    }

    if (fardhScores.length > 0) {
      const avgFardh = fardhScores.reduce((a, b) => a + b, 0) / fardhScores.length;
      totalScore += avgFardh;
      totalDivisor += 1;
    }

    if (ikhtibarScore !== null) {
      totalScore += ikhtibarScore * 2;
      totalDivisor += 2;
    }

    if (totalDivisor > 0) {
      return Number((totalScore / totalDivisor).toFixed(2));
    }
  }

  // Calcul classique par moyenne pondérée standard si devoirs personnalisés
  let totalWeightedScore = 0;
  let totalCoefficients = 0;

  for (const grade of studentGrades) {
    const assessment = assessments.find((a) => a.id === grade.assessmentId);
    if (assessment && grade.score !== null) {
      // Normaliser sur 20 si le barème diffère
      const normalizedScore = (grade.score / assessment.maxScore) * 20;
      totalWeightedScore += normalizedScore * assessment.coefficient;
      totalCoefficients += assessment.coefficient;
    }
  }

  if (totalCoefficients === 0) return null;
  return Number((totalWeightedScore / totalCoefficients).toFixed(2));
}

/**
 * Calcule les statistiques complètes de la classe
 */
export function calculateClassStats(
  classId: string,
  students: Student[],
  assessments: Assessment[],
  grades: Grade[],
  attendanceRecords: AttendanceRecord[]
): ClassStats {
  const classStudents = students.filter((s) => s.classId === classId);
  const classAssessments = assessments.filter((a) => a.classId === classId);

  const averages: number[] = [];
  for (const student of classStudents) {
    const avg = calculateStudentAverage(student.id, classAssessments, grades);
    if (avg !== null) averages.push(avg);
  }

  const classAverage =
    averages.length > 0
      ? Number((averages.reduce((sum, v) => sum + v, 0) / averages.length).toFixed(2))
      : null;

  const highestAverage = averages.length > 0 ? Math.max(...averages) : null;
  const lowestAverage = averages.length > 0 ? Math.min(...averages) : null;

  // Assiduité
  const studentIds = new Set(classStudents.map((s) => s.id));
  const relevantAttendance = attendanceRecords.filter((r) => studentIds.has(r.studentId));
  
  let overallAttendanceRate = 100;
  if (relevantAttendance.length > 0) {
    const presentOrLate = relevantAttendance.filter(
      (r) => r.status === 'present' || r.status === 'late'
    ).length;
    overallAttendanceRate = Math.round((presentOrLate / relevantAttendance.length) * 100);
  }

  return {
    classId,
    studentCount: classStudents.length,
    classAverage,
    highestAverage,
    lowestAverage,
    overallAttendanceRate,
    assessmentsCount: classAssessments.length,
  };
}

/**
 * Calcule les statistiques d'un élève
 */
export function calculateStudentStats(
  studentId: string,
  classId: string,
  students: Student[],
  assessments: Assessment[],
  grades: Grade[],
  attendanceRecords: AttendanceRecord[]
): StudentStats {
  const classStudents = students.filter((s) => s.classId === classId);
  const classAssessments = assessments.filter((a) => a.classId === classId);

  // Moyennes pour déterminer le rang
  const studentAverages: { studentId: string; avg: number | null }[] = classStudents.map((s) => ({
    studentId: s.id,
    avg: calculateStudentAverage(s.id, classAssessments, grades),
  }));

  studentAverages.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  const rankIndex = studentAverages.findIndex((item) => item.studentId === studentId);
  const rank = rankIndex !== -1 ? rankIndex + 1 : 1;

  const currentAverage = calculateStudentAverage(studentId, classAssessments, grades);

  const studentGrades = grades.filter((g) => g.studentId === studentId && g.score !== null);

  const attSummary = calculateStudentAttendance(studentId, attendanceRecords);

  return {
    studentId,
    average: currentAverage,
    gradesCount: studentGrades.length,
    rank,
    attendanceRate: attSummary.attendanceRate,
    absencesCount: attSummary.absentCount,
    unexcusedAbsences: attSummary.unexcusedAbsenceCount,
    latesCount: attSummary.lateCount,
  };
}

/**
 * Calcule le bilan d'assiduité d'un élève
 */
export function calculateStudentAttendance(
  studentId: string,
  records: AttendanceRecord[]
): StudentAttendanceSummary {
  const studentRecords = records.filter((r) => r.studentId === studentId);
  const total = studentRecords.length;

  if (total === 0) {
    return {
      studentId,
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      unexcusedAbsenceCount: 0,
      lateCount: 0,
      totalLateMinutes: 0,
      attendanceRate: 100,
    };
  }

  let present = 0;
  let absent = 0;
  let unexcused = 0;
  let late = 0;
  let lateMinutes = 0;

  for (const r of studentRecords) {
    if (r.status === 'present') {
      present++;
    } else if (r.status === 'absent') {
      absent++;
      if (!r.justification || r.justification.toLowerCase().includes('non justifi')) {
        unexcused++;
      }
    } else if (r.status === 'excused') {
      absent++;
    } else if (r.status === 'late') {
      late++;
      lateMinutes += r.lateMinutes || 5;
    }
  }

  // Taux de présence : (présents + retards) / total
  const rate = Math.round(((present + late) / total) * 100);

  return {
    studentId,
    totalSessions: total,
    presentCount: present,
    absentCount: absent,
    unexcusedAbsenceCount: unexcused,
    lateCount: late,
    totalLateMinutes: lateMinutes,
    attendanceRate: rate,
  };
}

/**
 * Distribution des notes d'une classe par tranches
 */
export function getGradeDistribution(
  classId: string,
  students: Student[],
  assessments: Assessment[],
  grades: Grade[]
) {
  const classStudents = students.filter((s) => s.classId === classId);
  const classAssessments = assessments.filter((a) => a.classId === classId);

  const distribution = [
    { label: '< 8', count: 0, color: '#EF4444' },
    { label: '8 - 9.9', count: 0, color: '#F97316' },
    { label: '10 - 11.9', count: 0, color: '#EAB308' },
    { label: '12 - 13.9', count: 0, color: '#3B82F6' },
    { label: '14 - 15.9', count: 0, color: '#6366F1' },
    { label: '16 - 20', count: 0, color: '#10B981' },
  ];

  for (const student of classStudents) {
    const avg = calculateStudentAverage(student.id, classAssessments, grades);
    if (avg === null) continue;

    if (avg < 8) distribution[0].count++;
    else if (avg < 10) distribution[1].count++;
    else if (avg < 12) distribution[2].count++;
    else if (avg < 14) distribution[3].count++;
    else if (avg < 16) distribution[4].count++;
    else distribution[5].count++;
  }

  return distribution;
}

/**
 * Génère le bulletin scolaire complet d'un élève
 */
export function generateFullReportCard(
  student: Student,
  classroom: Classroom,
  teacher: Teacher,
  term: string,
  allStudents: Student[],
  assessments: Assessment[],
  grades: Grade[],
  attendanceRecords: AttendanceRecord[]
): FullReportCard {
  const classStudents = allStudents.filter((s) => s.classId === classroom.id);
  const classAssessments = assessments.filter((a) => a.classId === classroom.id);

  // Regrouper par matière (même si enseignant mono-matière, support multi-matière propre)
  const subjectsMap = new Map<string, Assessment[]>();
  for (const a of classAssessments) {
    const list = subjectsMap.get(a.subject) || [];
    list.push(a);
    subjectsMap.set(a.subject, list);
  }

  // Si aucun devoir n'a de matière spécifique, utiliser la matière de la classe
  if (subjectsMap.size === 0) {
    subjectsMap.set(classroom.subject, []);
  }

  const subjectRows: ReportCardSubjectRow[] = [];
  let totalStudentWeighted = 0;
  let totalStudentCoef = 0;

  subjectsMap.forEach((subjectAssessments, subject) => {
    // Moyenne élève pour cette matière
    const studentAvg = calculateStudentAverage(student.id, subjectAssessments, grades);

    // Moyennes des autres élèves de la classe pour cette matière
    const otherAverages: number[] = [];
    for (const other of classStudents) {
      const avg = calculateStudentAverage(other.id, subjectAssessments, grades);
      if (avg !== null) otherAverages.push(avg);
    }

    const classAvg =
      otherAverages.length > 0
        ? Number((otherAverages.reduce((a, b) => a + b, 0) / otherAverages.length).toFixed(2))
        : null;
    const minAvg = otherAverages.length > 0 ? Math.min(...otherAverages) : null;
    const maxAvg = otherAverages.length > 0 ? Math.max(...otherAverages) : null;

    const coefTotal = subjectAssessments.reduce((acc, a) => acc + a.coefficient, 0) || 1;

    // Déterminer appréciation personnalisée basée sur la moyenne
    let appreciation = 'Travail régulier. Poursuivez vos efforts.';
    if (studentAvg !== null) {
      if (studentAvg >= 16) {
        appreciation = 'Excellent trimestre. Travail d’une grande rigueur et participation très active.';
      } else if (studentAvg >= 14) {
        appreciation = 'Très bon trimestre. Les notions sont solides et la réflexion est pertinente.';
      } else if (studentAvg >= 12) {
        appreciation = 'Bon ensemble. Les résultats sont satisfaisants, continuez avec la même régularité.';
      } else if (studentAvg >= 10) {
        appreciation = 'Ensemble convenable mais perfectible. Intensifiez l’apprentissage du cours.';
      } else if (studentAvg >= 8) {
        appreciation = 'Des difficultés persistantes. Un travail plus rigoureux et soutenu est indispensable.';
      } else {
        appreciation = 'Résultats insuffisants. Ne vous découragez pas et sollicitez de l’aide aux devoirs.';
      }
    }

    subjectRows.push({
      subject,
      studentAverage: studentAvg,
      classAverage: classAvg,
      minAverage: minAvg,
      maxAverage: maxAvg,
      coefficient: coefTotal,
      gradesCount: subjectAssessments.length,
      teacherComment: appreciation,
    });

    if (studentAvg !== null) {
      totalStudentWeighted += studentAvg * coefTotal;
      totalStudentCoef += coefTotal;
    }
  });

  const studentOverallAverage =
    totalStudentCoef > 0 ? Number((totalStudentWeighted / totalStudentCoef).toFixed(2)) : null;

  // Calcul moyenne générale classe
  const classAverages = classStudents
    .map((s) => calculateStudentAverage(s.id, classAssessments, grades))
    .filter((v): v is number => v !== null);

  const classOverallAverage =
    classAverages.length > 0
      ? Number((classAverages.reduce((a, b) => a + b, 0) / classAverages.length).toFixed(2))
      : null;

  // Classement
  const sortedStudents = [...classStudents].sort((a, b) => {
    const avgA = calculateStudentAverage(a.id, classAssessments, grades) ?? -1;
    const avgB = calculateStudentAverage(b.id, classAssessments, grades) ?? -1;
    return avgB - avgA;
  });

  const rank = sortedStudents.findIndex((s) => s.id === student.id) + 1;

  // Assiduité
  const attSummary = calculateStudentAttendance(student.id, attendanceRecords);

  // Mention d'honneur (conforme réglementation officielle MEN Algérie)
  let honorMention: FullReportCard['honorMention'] = null;
  let honorMentionAr: string | undefined = undefined;

  if (studentOverallAverage !== null) {
    if (studentOverallAverage >= 18) {
      honorMention = 'Félicitations';
      honorMentionAr = 'تهنئة مع تنويه شرفي';
    } else if (studentOverallAverage >= 15) {
      honorMention = 'Félicitations';
      honorMentionAr = 'تهنئة';
    } else if (studentOverallAverage >= 12) {
      honorMention = 'Compliments';
      honorMentionAr = 'لوحة شرف';
    } else if (studentOverallAverage >= 10) {
      honorMention = 'Encouragements';
      honorMentionAr = 'تشجيع';
    } else if (studentOverallAverage >= 9) {
      honorMention = 'Avertissement de travail';
      honorMentionAr = 'إنذار في العمل';
    } else {
      honorMention = 'Avertissement de travail';
      honorMentionAr = 'توبيخ';
    }
  }

  // Appréciation globale du conseil
  let councilAppreciation = 'Bilan positif pour ce trimestre. Attitude attentive en classe.';
  if (studentOverallAverage !== null) {
    if (studentOverallAverage >= 16) {
      councilAppreciation =
        'Félicitations du conseil de classe pour ces remarquables résultats et l’attitude exemplaire.';
    } else if (studentOverallAverage >= 14) {
      councilAppreciation =
        'Très bon trimestre. Les compliments du conseil de classe viennent récompenser votre investissement.';
    } else if (studentOverallAverage >= 12) {
      councilAppreciation =
        'Bon trimestre. Des bases solides, continuez ainsi pour progresser encore.';
    } else if (studentOverallAverage >= 10) {
      councilAppreciation =
        'Trimestre juste moyen. Approfondissez le travail personnel pour aborder le trimestre suivant avec sérénité.';
    } else {
      councilAppreciation =
        'Résultats fragiles. Il est urgent de réagir, de revoir les méthodes de travail et d’éviter les dispersions.';
    }
  }

  return {
    student,
    classroom,
    teacher,
    term,
    schoolYear: classroom.academicYear,
    subjectRows,
    studentOverallAverage,
    classOverallAverage,
    rank,
    totalStudents: classStudents.length,
    attendance: {
      totalAbsences: attSummary.absentCount,
      unexcusedAbsences: attSummary.unexcusedAbsenceCount,
      latesCount: attSummary.lateCount,
    },
    councilAppreciation,
    honorMention,
    honorMentionAr,
  };
}

/**
 * Exporte une liste d'élèves au format CSV
 */
export function exportStudentsToCSV(students: Student[], classroom?: Classroom): string {
  const headers = [
    'Nom',
    'Prénom',
    'Classe',
    'Date de Naissance',
    'Genre',
    'Email Élève',
    'Téléphone Parents',
    'Email Parents',
    'Adresse',
    'Observations',
  ];

  const rows = students.map((s) => [
    `"${s.lastName.replace(/"/g, '""')}"`,
    `"${s.firstName.replace(/"/g, '""')}"`,
    `"${classroom?.name || s.classId}"`,
    `"${s.birthDate}"`,
    `"${s.gender}"`,
    `"${s.studentEmail || ''}"`,
    `"${s.parentPhone}"`,
    `"${s.parentEmail || ''}"`,
    `"${(s.address || '').replace(/"/g, '""')}"`,
    `"${(s.observations || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}

/**
 * Parse un fichier CSV importé pour créer des élèves
 * Compatible avec les exports officiels de la plateforme du Ministère de l'Éducation Nationale (Algérie)
 * ainsi que les formats CSV français et internationaux standards.
 */
export function parseStudentsCSV(
  csvText: string,
  targetClassId: string
): { success: Student[]; errors: string[] } {
  // Nettoyer les caractères BOM UTF-8 éventuels
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const success: Student[] = [];
  const errors: string[] = [];

  if (lines.length === 0) {
    errors.push('Le texte ou fichier est vide.');
    return { success, errors };
  }

  // Déterminer le séparateur (\t pour Excel, ; ou ,)
  const firstLine = lines[0];
  let separator = ',';
  if (firstLine.includes('\t')) {
    separator = '\t';
  } else if (firstLine.includes(';')) {
    separator = ';';
  } else {
    separator = ',';
  }

  // Fonction helper pour découper une ligne CSV avec gestion des guillemets
  const splitCSVLine = (lineStr: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let c = 0; c < lineStr.length; c++) {
      const char = lineStr[c];
      if (char === '"') {
        if (inQuotes && lineStr[c + 1] === '"') {
          current += '"';
          c++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Déterminer si la première ligne est un en-tête ou déjà un élève
  const isHeaderLine = (line: string): boolean => {
    const l = line.toLowerCase();
    return (
      l.includes('اللقب') ||
      l.includes('الاسم') ||
      l.includes('nom') ||
      l.includes('prenom') ||
      l.includes('التعريف') ||
      l.includes('التسجيل')
    );
  };

  const hasHeader = isHeaderLine(firstLine);
  const startRowIndex = hasHeader ? 1 : 0;

  let lastNameIdx = -1;
  let firstNameIdx = -1;
  let birthDateIdx = -1;
  let genderIdx = -1;
  let nationalIdIdx = -1; // رقم التعريف الوطني (NIN)
  let regNumberIdx = -1; // رقم التسجيل
  let repeatingIdx = -1; // الإعادة
  let boardingIdx = -1; // الصفة (ن.داخلي / خارجي)
  let obsIdx = -1; // الملاحظات
  let phoneIdx = -1;
  let emailIdx = -1;
  let addressIdx = -1;
  let groupIdx = -1;

  if (hasHeader) {
    const headerCols = splitCSVLine(firstLine).map((h) => h.toLowerCase().trim());

    headerCols.forEach((col, idx) => {
      const cleanCol = col.replace(/[\s\-_]/g, '');
      if (cleanCol.includes('اللقب') || cleanCol === 'nom' || cleanCol.includes('lastname') || cleanCol === 'nomdefamille') {
        lastNameIdx = idx;
      } else if (
        (cleanCol.includes('الاسم') || cleanCol.includes('إسم') || cleanCol === 'prenom' || cleanCol === 'firstname') &&
        !cleanCol.includes('اللقب') &&
        !cleanCol.includes('المؤسسة')
      ) {
        firstNameIdx = idx;
      } else if (cleanCol.includes('تاريخالميلاد') || cleanCol.includes('ميلاد') || cleanCol.includes('naissance') || cleanCol.includes('birth')) {
        birthDateIdx = idx;
      } else if (cleanCol.includes('الجنس') || cleanCol.includes('genre') || cleanCol.includes('sexe') || cleanCol.includes('gender')) {
        genderIdx = idx;
      } else if (cleanCol.includes('التعريف') || cleanCol.includes('nin') || cleanCol.includes('national')) {
        nationalIdIdx = idx;
      } else if (cleanCol.includes('التسجيل') || cleanCol.includes('matricule') || cleanCol.includes('inscription')) {
        regNumberIdx = idx;
      } else if (cleanCol.includes('الإعادة') || cleanCol.includes('اعادة') || cleanCol.includes('redoubl')) {
        repeatingIdx = idx;
      } else if (cleanCol.includes('الصفة') || cleanCol.includes('regime') || cleanCol.includes('statut')) {
        boardingIdx = idx;
      } else if (cleanCol.includes('الملاحظات') || cleanCol.includes('ملاحظ') || cleanCol.includes('obs') || cleanCol.includes('remarque')) {
        obsIdx = idx;
      } else if (cleanCol.includes('هاتف') || cleanCol.includes('phone') || cleanCol.includes('tel')) {
        phoneIdx = idx;
      } else if (cleanCol.includes('البريد') || cleanCol.includes('email') || cleanCol.includes('mail')) {
        emailIdx = idx;
      } else if (cleanCol.includes('العنوان') || cleanCol.includes('adresse') || cleanCol.includes('address')) {
        addressIdx = idx;
      } else if (cleanCol.includes('الفوج') || cleanCol.includes('groupe') || cleanCol.includes('group')) {
        groupIdx = idx;
      }
    });
  }

  // Helpers pour vérifier si une valeur est textuelle ou numérique
  const isAllDigits = (val: string) => /^\d+$/.test(val.trim());
  const hasLetters = (val: string) => /[\p{L}]/u.test(val.trim());

  // Parser chaque ligne d'élève
  for (let i = startRowIndex; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cols = splitCSVLine(rawLine);
    if (cols.length < 2) continue;

    // Détection de secours intelligente selon le contenu de la ligne
    let finalLastName = '';
    let finalFirstName = '';
    let finalRegNumber = '';
    let finalNationalId = '';

    // Si on a les index détectés de l'en-tête
    if (lastNameIdx !== -1 && cols[lastNameIdx]) {
      finalLastName = cols[lastNameIdx].trim();
    }
    if (firstNameIdx !== -1 && cols[firstNameIdx]) {
      finalFirstName = cols[firstNameIdx].trim();
    }
    if (regNumberIdx !== -1 && cols[regNumberIdx]) {
      finalRegNumber = cols[regNumberIdx].trim();
    }
    if (nationalIdIdx !== -1 && cols[nationalIdIdx]) {
      finalNationalId = cols[nationalIdIdx].trim();
    }

    // AUTO-CORRECTION : Si le nom ou prénom est un chiffre pur (ex: "325") alors que la ligne contient des noms en lettres
    // (ex format algérien: 1, 1101315011146700, 325, أحنوش, تزيري...)
    if (!finalLastName || isAllDigits(finalLastName) || !hasLetters(finalLastName)) {
      // Trouver les colonnes qui contiennent de vraies lettres
      const letterCols = cols
        .map((val, idx) => ({ val: val.trim(), idx }))
        .filter((item) => hasLetters(item.val) && !/^\d{4}-\d{1,2}-\d{1,2}$/.test(item.val) && item.val !== 'أنثى' && item.val !== 'ذكر' && item.val !== 'لا' && item.val !== 'نعم' && item.val !== 'ن.داخلي' && item.val !== 'خارجي');

      if (letterCols.length >= 2) {
        // En format algérien standard : [3] est le nom (اللقب) et [4] est le prénom (الاسم)
        finalLastName = letterCols[0].val;
        finalFirstName = letterCols[1].val;
      } else if (letterCols.length === 1) {
        finalLastName = letterCols[0].val;
        finalFirstName = '';
      }
    }

    // Récupérer le numéro d'inscription si absent ou mal positionné
    if (!finalRegNumber) {
      if (cols[2] && isAllDigits(cols[2]) && cols[2].length <= 5) {
        finalRegNumber = cols[2].trim();
      } else if (cols[1] && isAllDigits(cols[1]) && cols[1].length <= 5) {
        finalRegNumber = cols[1].trim();
      }
    }

    // Récupérer le NIN (16 chiffres)
    if (!finalNationalId) {
      const ninCol = cols.find((c) => isAllDigits(c) && c.length >= 12);
      if (ninCol) finalNationalId = ninCol.trim();
    }

    if (!finalLastName && !finalFirstName) {
      continue;
    }

    // Extraction du Genre (ذكر / أنثى ou M / F)
    let gender: 'M' | 'F' | 'Autre' = 'M';
    const foundGender = cols.find(
      (c) => c.includes('أنثى') || c.includes('ذكر') || c.toUpperCase() === 'F' || c.toUpperCase() === 'M'
    );
    if (foundGender) {
      const gRaw = foundGender.toLowerCase().trim();
      if (gRaw.includes('أنثى') || gRaw === 'f') {
        gender = 'F';
      } else {
        gender = 'M';
      }
    }

    // Extraction et normalisation de la Date de Naissance
    let birthDate = '2013-01-01';
    const dateCol = cols.find(
      (c) => /^\d{4}-\d{1,2}-\d{1,2}$/.test(c.trim()) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(c.trim())
    );
    if (dateCol) {
      const rawDate = dateCol.trim();
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(rawDate)) {
        birthDate = rawDate;
      } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(rawDate)) {
        const parts = rawDate.split(/[\/\-]/);
        birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // Redoublant (الإعادة)
    const isRepeating = cols.some((c) => c.includes('نعم') || c.toLowerCase() === 'oui');

    // Régime / Statut (الصفة)
    let boardingStatus: string | undefined = undefined;
    if (cols.some((c) => c.includes('ن.داخلي') || c.includes('نصف داخلي'))) {
      boardingStatus = 'نصف داخلي';
    } else if (cols.some((c) => c.includes('خارجي'))) {
      boardingStatus = 'خارجي';
    } else if (cols.some((c) => c.includes('داخلي'))) {
      boardingStatus = 'داخلي';
    }

    // Observations
    let observations = obsIdx !== -1 ? cols[obsIdx]?.trim() : '';
    if (!observations) {
      const details: string[] = [];
      if (boardingStatus) details.push(`الصفة: ${boardingStatus}`);
      if (isRepeating) details.push('معيد');
      if (finalRegNumber) details.push(`رقم التسجيل: ${finalRegNumber}`);
      observations = details.join(' • ');
    }

    // Contact
    const parentPhone = phoneIdx !== -1 && cols[phoneIdx] ? cols[phoneIdx].trim() : '';
    const parentEmail = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx].trim() : '';
    const studentEmail = emailIdx !== -1 && cols[emailIdx] ? cols[emailIdx].trim() : '';
    const address = addressIdx !== -1 && cols[addressIdx] ? cols[addressIdx].trim() : '';

    // Groupe TD (si spécifié dans le fichier ou par défaut '1')
    let group: '1' | '2' = '1';
    if (groupIdx !== -1 && cols[groupIdx]) {
      const gStr = cols[groupIdx].trim();
      if (gStr === '2' || gStr.includes('2')) group = '2';
    }

    success.push({
      id: `std-imp-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      classId: targetClassId,
      lastName: finalLastName,
      firstName: finalFirstName,
      birthDate,
      gender,
      studentEmail,
      parentPhone,
      parentEmail,
      address,
      observations,
      group,
      nationalId: finalNationalId || undefined,
      registrationNumber: finalRegNumber || undefined,
      isRepeating,
      boardingStatus,
      createdAt: new Date().toISOString().split('T')[0],
    });
  }

  if (success.length === 0) {
    errors.push('Aucun élève valide n’a pu être extrait du fichier. Vérifiez les données.');
  }

  return { success, errors };
}

export interface AlgerianRaqmanaStudentData {
  studentId: string;
  nationalId: string;
  registrationNumber: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  group: string;
  taqwim: number | null;
  fardh1: number | null;
  fardh2: number | null;
  ikhtibar: number | null;
  moyenne: number | null;
  mentionAr: string;
  mentionFr: string;
}

/**
 * Extrait les données structurées pour la plateforme de numérisation de l'Éducation Nationale (الرقمنة)
 */
export function extractAlgerianRaqmanaData(
  students: Student[],
  assessments: Assessment[],
  grades: Grade[]
): AlgerianRaqmanaStudentData[] {
  const sorted = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'));

  return sorted.map((st) => {
    const studentGrades = grades.filter((g) => g.studentId === st.id && g.score !== null && !g.isAbsent);

    let taqwim: number | null = null;
    let fardh1: number | null = null;
    let fardh2: number | null = null;
    let ikhtibar: number | null = null;

    for (const g of studentGrades) {
      const a = assessments.find((ass) => ass.id === g.assessmentId);
      if (!a || g.score === null) continue;

      const norm = Number(((g.score / a.maxScore) * 20).toFixed(2));
      const t = (a.type || '').toLowerCase();
      const title = (a.title || '').toLowerCase();

      if (t.includes('تقويم') || title.includes('تقويم')) {
        taqwim = norm;
      } else if (t.includes('فرض 2') || title.includes('فرض 2') || title.includes('ثاني')) {
        fardh2 = norm;
      } else if (t.includes('فرض') || title.includes('فرض')) {
        if (fardh1 === null) fardh1 = norm;
        else fardh2 = norm;
      } else if (t.includes('اختبار') || title.includes('اختبار') || t.includes('composition')) {
        ikhtibar = norm;
      }
    }

    const moyenne = calculateStudentAverage(st.id, assessments, grades);
    let mentionAr = 'عادي';
    let mentionFr = 'Passable';

    if (moyenne !== null) {
      if (moyenne >= 18) {
        mentionAr = 'تهنئة مع تنويه';
        mentionFr = 'Félicitations avec distinction';
      } else if (moyenne >= 15) {
        mentionAr = 'تهنئة';
        mentionFr = 'Félicitations';
      } else if (moyenne >= 12) {
        mentionAr = 'لوحة شرف';
        mentionFr = 'Tableau d’honneur';
      } else if (moyenne >= 10) {
        mentionAr = 'تشجيع';
        mentionFr = 'Encouragements';
      } else if (moyenne >= 9) {
        mentionAr = 'إنذار';
        mentionFr = 'Avertissement';
      } else {
        mentionAr = 'توبيخ';
        mentionFr = 'Blâme';
      }
    }

    return {
      studentId: st.id,
      nationalId: st.nationalId || '',
      registrationNumber: st.registrationNumber || '',
      lastName: st.lastName,
      firstName: st.firstName,
      birthDate: st.birthDate || '',
      group: st.group ? `فوج ${st.group}` : 'الفوج 1',
      taqwim,
      fardh1,
      fardh2,
      ikhtibar,
      moyenne,
      mentionAr,
      mentionFr,
    };
  });
}

/**
 * Télécharge un fichier CSV optimisé pour la plate-forme de numérisation de l'Éducation Nationale
 * avec UTF-8 BOM pour un affichage parfait dans Microsoft Excel sans caractères arabes corrompus.
 */
export function downloadAlgerianRaqmanaCSV(
  className: string,
  subject: string,
  data: AlgerianRaqmanaStudentData[]
): void {
  const headers = [
    'رقم التعريف الوطني (NIN)',
    'رقم التسجيل',
    'اللقب',
    'الاسم',
    'تاريخ الميلاد',
    'الفوج',
    'التقويم المستمر (20)',
    'الفرض 1 (20)',
    'الفرض 2 (20)',
    'الاختبار (20)',
    'معدل المادة (20)',
    'الملاحظة الرسمية'
  ];

  const rows = data.map((r) => [
    `"${r.nationalId}"`,
    `"${r.registrationNumber}"`,
    `"${r.lastName}"`,
    `"${r.firstName}"`,
    `"${r.birthDate}"`,
    `"${r.group}"`,
    r.taqwim !== null ? r.taqwim : '',
    r.fardh1 !== null ? r.fardh1 : '',
    r.fardh2 !== null ? r.fardh2 : '',
    r.ikhtibar !== null ? r.ikhtibar : '',
    r.moyenne !== null ? r.moyenne : '',
    `"${r.mentionAr}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeClassName = className.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `كشف_نقاط_الرقمنة_${safeClassName}_${subject}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

