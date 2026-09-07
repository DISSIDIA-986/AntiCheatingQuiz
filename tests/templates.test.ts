import { describe, expect, it } from "vitest";
import { validateBankCsv, validateRosterCsv } from "../src/lib/bank";
import {
  QUESTION_BANK_SAMPLE,
  QUESTION_BANK_TEMPLATE,
  STUDENT_LIST_SAMPLE,
  STUDENT_LIST_TEMPLATE,
  getTemplate,
} from "../src/lib/templates";

describe("downloadable templates", () => {
  it("bank template and sample validate", () => {
    expect(validateBankCsv(QUESTION_BANK_TEMPLATE).ok).toBe(true);
    expect(validateBankCsv(QUESTION_BANK_SAMPLE).ok).toBe(true);
  });

  it("student template and sample validate", () => {
    expect(validateRosterCsv(STUDENT_LIST_TEMPLATE).ok).toBe(true);
    expect(validateRosterCsv(STUDENT_LIST_SAMPLE).ok).toBe(true);
  });

  it("resolves template ids", () => {
    expect(getTemplate("question-bank-template")?.filename).toBe("question-bank-template.csv");
    expect(getTemplate("missing")).toBeNull();
  });
});
