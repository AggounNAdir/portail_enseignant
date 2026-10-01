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
 * Calcule la moyenne pondérée d'un élève pour une classe ou matière donnée
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

  // Mention d'honneur
  let honorMention: FullReportCard['honorMention'] = null;
  if (studentOverallAverage !== null) {
    if (studentOverallAverage >= 16) honorMention = 'Félicitations';
    else if (studentOverallAverage >= 14) honorMention = 'Compliments';
    else if (studentOverallAverage >= 12 && attSummary.unexcusedAbsenceCount === 0)
      honorMention = 'Encouragements';
    else if (studentOverallAverage < 8 && attSummary.unexcusedAbsenceCount > 2)
      honorMention = 'Avertissement de travail';
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

  if (lines.length < 2) {
    errors.push('Le fichier CSV est vide ou ne contient pas de données après l’en-tête.');
    return { success, errors };
  }

  // Déterminer le séparateur (, ou ;)
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';

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

  // Analyser l'en-tête pour cartographier intelligemment les colonnes
  const headerCols = splitCSVLine(firstLine).map((h) => h.toLowerCase().trim());

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

  headerCols.forEach((col, idx) => {
    if (col.includes('اللقب') || col === 'nom' || col.includes('last') || col === 'nom de famille') {
      lastNameIdx = idx;
    } else if (col.includes('الاسم') || col === 'prenom' || col.includes('first') || col === 'prénom') {
      firstNameIdx = idx;
    } else if (col.includes('تاريخ الميلاد') || col.includes('naissance') || col.includes('birth') || col.includes('date')) {
      birthDateIdx = idx;
    } else if (col.includes('الجنس') || col.includes('genre') || col.includes('sexe') || col.includes('gender')) {
      genderIdx = idx;
    } else if (col.includes('التعريف') || col.includes('nin') || col.includes('national')) {
      nationalIdIdx = idx;
    } else if (col.includes('التسجيل') || col.includes('matricule') || col.includes('inscription')) {
      regNumberIdx = idx;
    } else if (col.includes('الإعادة') || col.includes('اعادة') || col.includes('redoubl')) {
      repeatingIdx = idx;
    } else if (col.includes('الصفة') || col.includes('regime') || col.includes('statut')) {
      boardingIdx = idx;
    } else if (col.includes('الملاحظات') || col.includes('ملاحظ') || col.includes('obs') || col.includes('remarque')) {
      obsIdx = idx;
    } else if (col.includes('هاتف') || col.includes('phone') || col.includes('tel')) {
      phoneIdx = idx;
    } else if (col.includes('البريد') || col.includes('email') || col.includes('mail')) {
      emailIdx = idx;
    } else if (col.includes('العنوان') || col.includes('adresse') || col.includes('address')) {
      addressIdx = idx;
    } else if (col.includes('الفوج') || col.includes('groupe') || col.includes('group')) {
      groupIdx = idx;
    }
  });

  // Fallback si l'en-tête n'est pas standard :
  // Détection du format ministériel algérien classique (الترتيب, رقم التعريف, رقم التسجيل, اللقب, الاسم...)
  if (lastNameIdx === -1 && firstNameIdx === -1) {
    if (headerCols.length >= 7) {
      nationalIdIdx = 1;
      regNumberIdx = 2;
      lastNameIdx = 3;
      firstNameIdx = 4;
      genderIdx = 5;
      birthDateIdx = 6;
      repeatingIdx = 7;
      boardingIdx = 8;
      obsIdx = 10;
    } else {
      lastNameIdx = 0;
      firstNameIdx = 1;
      birthDateIdx = 2;
      genderIdx = 3;
    }
  }

  // Parser chaque ligne d'élève
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cols = splitCSVLine(rawLine);
    if (cols.length < 2) continue;

    const lastName = (lastNameIdx !== -1 ? cols[lastNameIdx] : cols[0])?.trim() || '';
    const firstName = (firstNameIdx !== -1 ? cols[firstNameIdx] : cols[1])?.trim() || '';

    if (!lastName && !firstName) {
      continue;
    }

    // Extraction du Genre (ذكر / أنثى ou M / F)
    let gender: 'M' | 'F' | 'Autre' = 'M';
    if (genderIdx !== -1 && cols[genderIdx]) {
      const gRaw = cols[genderIdx].toLowerCase().trim();
      if (gRaw.includes('أنثى') || gRaw.startsWith('f') || gRaw.includes('fem') || gRaw.includes('fille')) {
        gender = 'F';
      } else if (gRaw.includes('ذكر') || gRaw.startsWith('m') || gRaw.includes('masc') || gRaw.includes('garcon')) {
        gender = 'M';
      }
    }

    // Extraction et normalisation de la Date de Naissance
    let birthDate = '2013-01-01';
    if (birthDateIdx !== -1 && cols[birthDateIdx]) {
      const rawDate = cols[birthDateIdx].trim();
      // Format YYYY-MM-DD
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(rawDate)) {
        birthDate = rawDate;
      }
      // Format DD/MM/YYYY ou DD-MM-YYYY
      else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(rawDate)) {
        const parts = rawDate.split(/[\/\-]/);
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        birthDate = `${year}-${month}-${day}`;
      } else if (!isNaN(Date.parse(rawDate))) {
        birthDate = new Date(rawDate).toISOString().split('T')[0];
      }
    }

    // Champs officiels algériens
    const nationalId = nationalIdIdx !== -1 ? cols[nationalIdIdx]?.trim() : undefined;
    const registrationNumber = regNumberIdx !== -1 ? cols[regNumberIdx]?.trim() : undefined;

    // Redoublant (الإعادة)
    let isRepeating: boolean | undefined = undefined;
    if (repeatingIdx !== -1 && cols[repeatingIdx]) {
      const rRaw = cols[repeatingIdx].trim();
      isRepeating = rRaw.includes('نعم') || rRaw.toLowerCase() === 'oui' || rRaw === '1';
    }

    // Régime / Statut (الصفة)
    const boardingStatus = boardingIdx !== -1 ? cols[boardingIdx]?.trim() : undefined;

    // Observations
    let observations = obsIdx !== -1 ? cols[obsIdx]?.trim() : '';
    if (!observations) {
      const details: string[] = [];
      if (boardingStatus) details.push(`الصفة: ${boardingStatus}`);
      if (isRepeating) details.push('معيد');
      if (registrationNumber) details.push(`رقم التسجيل: ${registrationNumber}`);
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
      lastName,
      firstName,
      birthDate,
      gender,
      studentEmail,
      parentPhone,
      parentEmail,
      address,
      observations,
      group,
      nationalId,
      registrationNumber,
      isRepeating,
      boardingStatus,
      createdAt: new Date().toISOString().split('T')[0],
    });
  }

  if (success.length === 0) {
    errors.push('Aucun élève valide n’a pu être extrait du fichier. Vérifiez les colonnes.');
  }

  return { success, errors };
}
