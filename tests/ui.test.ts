import { describe, expect, it } from "vitest";
import { examAppHtml } from "../src/ui";

describe("desktop authoring UI", () => {
  const html = examAppHtml("test-token");

  it("groups each required CSV with its template and accessible label", () => {
    expect(html).toContain('<label for="bank">Question bank CSV</label>');
    expect(html).toContain('<label for="roster">Student roster CSV</label>');
    expect(html).toContain("/templates/question-bank-template.csv");
    expect(html).toContain("/templates/student-list-template.csv");
  });

  it("starts generation disabled and explains what is missing", () => {
    expect(html).toContain('<button id="btnGen" disabled>');
    expect(html).toContain("Choose both CSV files to continue.");
    expect(html).toContain("Question bank selected. Add the student roster.");
    expect(html).toContain("Student roster selected. Add the question bank.");
    expect(html).toContain("Ready — both files are selected.");
  });

  it("prevents duplicate generation and restores controls", () => {
    expect(html).toContain("let generating = false");
    expect(html).toContain("genButton.disabled = generating || !hasBank || !hasRoster");
    expect(html).toContain("bankInput.disabled = generating");
    expect(html).toContain("rosterInput.disabled = generating");
    expect(html).toContain('document.getElementById("forceGen").disabled = generating');
    expect(html).toContain("const bankFile = bankInput.files && bankInput.files[0]");
    expect(html).toContain("const rosterFile = rosterInput.files && rosterInput.files[0]");
    expect(html).toContain("finally {");
    expect(html).toContain("generating = false");
  });

  it("renders validation issues as an accessible, actionable summary", () => {
    expect(html).toContain('role="status" aria-live="polite" tabindex="-1"');
    expect(html).toContain('id="genReadiness" class="readiness" role="status" aria-live="polite"');
    expect(html).toContain("Please fix the ");
    expect(html).toContain("Row ");
    expect(html).toContain("compare your file with the blank template or sample above");
    expect(html).not.toContain("JSON.stringify(err, null, 2)");
  });

  it("keeps printing guidance available without dominating the main flow", () => {
    expect(html).toContain('<details class="print-guide">');
    expect(html).toContain("Combined PDF — print the whole roster");
    expect(html).toContain("<summary>How to print</summary>");
  });

  it("does not trigger a missing favicon request", () => {
    expect(html).toContain('<link rel="icon" href="data:,"');
  });

  it("preserves lowercase legacy sheet IDs pasted from historical QR URLs", () => {
    expect(html).toContain("rawCode.toLowerCase()");
    expect(html).toContain("/^[0-9a-fA-F]{32}$/.test(rawCode)");
  });
});