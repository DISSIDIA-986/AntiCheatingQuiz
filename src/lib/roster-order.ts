import type { ExamInstanceMap } from "./generate";

/** Rebuild sheet list in CSV roster order (DB query order must not decide print order). */
export function orderInstancesByRoster(
  roster: Array<{ student_id: string }>,
  byStudentId: Map<string, ExamInstanceMap>,
): ExamInstanceMap[] {
  return roster.map((student) => {
    const instance = byStudentId.get(student.student_id);
    if (!instance) {
      throw new Error(`Generated sheet set is incomplete for ${student.student_id}`);
    }
    return instance;
  });
}
