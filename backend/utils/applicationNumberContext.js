const { formatApplicationCode, normalizeApplicationCode } = require('./transportApplicationNumber');

async function resolveCollegeCode(mysqlPool, collegeName) {
    const fallback = process.env.TRANSPORT_DEFAULT_COLLEGE_CODE || 'PYD';
    if (!collegeName) {
        return { collegeCode: fallback, collegeName: null };
    }

    const trimmed = String(collegeName).trim();

    const [exactRows] = await mysqlPool.query(
        `SELECT code, name
         FROM colleges
         WHERE is_active = 1 AND (name = ? OR LOWER(name) = LOWER(?))
         LIMIT 1`,
        [trimmed, trimmed]
    );
    if (exactRows[0]?.code) {
        return {
            collegeCode: formatApplicationCode(exactRows[0].code),
            collegeName: exactRows[0].name,
        };
    }

    const [fuzzyRows] = await mysqlPool.query(
        `SELECT code, name
         FROM colleges
         WHERE is_active = 1
           AND (name LIKE ? OR ? LIKE CONCAT(name, '%'))
         ORDER BY LENGTH(name) DESC
         LIMIT 1`,
        [`%${trimmed}%`, trimmed]
    );
    if (fuzzyRows[0]?.code) {
        return {
            collegeCode: formatApplicationCode(fuzzyRows[0].code),
            collegeName: fuzzyRows[0].name,
        };
    }

    const derived = normalizeApplicationCode(collegeName, fallback);
    return { collegeCode: derived, collegeName: trimmed };
}

async function resolveCourseCode(mysqlPool, courseName) {
    const fallback = 'GEN';
    if (!courseName) {
        return { courseCode: fallback, courseName: null };
    }

    const trimmed = String(courseName).trim();

    // Match exact course name or parent course (e.g. "Diploma In Animal Husbandry" → "Diploma" → DIPLOMA).
    const [matchedRows] = await mysqlPool.query(
        `SELECT code, name
         FROM courses
         WHERE is_active = 1
           AND (
             TRIM(?) = name
             OR TRIM(?) LIKE CONCAT(name, ' %')
           )
         ORDER BY LENGTH(name) ASC
         LIMIT 1`,
        [trimmed, trimmed]
    );
    if (matchedRows[0]?.code) {
        return {
            courseCode: formatApplicationCode(matchedRows[0].code),
            courseName: matchedRows[0].name,
        };
    }

    // Student course may already be a course code (e.g. DAP-PTV stored as code-like value).
    const [codeRows] = await mysqlPool.query(
        `SELECT code, name
         FROM courses
         WHERE is_active = 1 AND UPPER(code) = UPPER(?)
         LIMIT 1`,
        [trimmed]
    );
    if (codeRows[0]?.code) {
        return {
            courseCode: formatApplicationCode(codeRows[0].code),
            courseName: codeRows[0].name,
        };
    }

    return { courseCode: fallback, courseName: trimmed };
}

async function resolveApplicationNumberContext(mysqlPool, { admissionNumber, userType = 'student' } = {}) {
    if (userType === 'employee') {
        return {
            collegeCode: formatApplicationCode(
                process.env.TRANSPORT_EMPLOYEE_COLLEGE_CODE || process.env.TRANSPORT_DEFAULT_COLLEGE_CODE || 'PYD'
            ),
            courseCode: formatApplicationCode(
                process.env.TRANSPORT_EMPLOYEE_COURSE_CODE || 'EMP'
            ),
            collegeName: 'Employee',
            courseName: 'Employee',
        };
    }

    if (!admissionNumber) {
        throw new Error('Admission number is required to generate a transport application number.');
    }

    const [rows] = await mysqlPool.query(
        `SELECT s.college, s.course
         FROM students s
         WHERE s.admission_number = ? OR s.admission_no = ?
         LIMIT 1`,
        [admissionNumber, admissionNumber]
    );
    const student = rows[0];
    if (!student) {
        throw new Error(`Student not found for admission number ${admissionNumber}.`);
    }

    const college = await resolveCollegeCode(mysqlPool, student.college);
    const course = await resolveCourseCode(mysqlPool, student.course);

    return {
        collegeCode: college.collegeCode,
        courseCode: course.courseCode,
        collegeName: college.collegeName || student.college,
        courseName: course.courseName || student.course,
    };
}

module.exports = {
    resolveCollegeCode,
    resolveCourseCode,
    resolveApplicationNumberContext,
};
