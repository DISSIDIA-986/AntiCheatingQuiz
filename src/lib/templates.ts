/** Downloadable CSV templates/samples for instructors (exact column names). */

/** Starter bank: 10 valid rows the instructor can edit. Keep correct_choice stable when changing numbers. */
export const QUESTION_BANK_TEMPLATE = `question_id,stem_template,n1_min,n1_max,choice_a_template,choice_b_template,choice_c_template,choice_d_template,correct_choice
q01,"If switching cost is about {n1} months of revenue, which force usually strengthens?",1,6,Buyer power,Supplier power,Threat of substitutes only,None of the above,A
q02,"When industry growth slows near {n1} percent, rivalry among existing firms typically:",1,5,Intensifies,Disappears,Becomes irrelevant to strategy,Only helps new entrants,A
q03,"A capital requirement near {n1} million most directly raises:",10,90,Barriers to entry,Buyer power,Substitute attractiveness,Complementor influence,A
q04,"If a key input has only {n1} viable suppliers worldwide, supplier power tends to be:",2,8,Higher,Lower,Unchanged,Illegal to discuss,A
q05,"A substitute that costs about {n1} percent less mainly threatens:",10,40,Pricing power of incumbents,HR compliance,Board independence,Warehouse layout,A
q06,"Spending roughly {n1} percent of revenue on distinctive capabilities most supports:",5,20,Differentiation advantage,Commodity price wars only,Tax avoidance,Inventory write-offs,A
q07,"A structural cost advantage of about {n1} percent versus rivals is primarily a:",5,25,Cost leadership source,Marketing slogan,One-time accounting entry,HR benefit,A
q08,"Expanding into {n1} adjacent segments can create scope economies when capabilities transfer:",2,6,Across businesses,Only within one SKU,Never in services,Only after IPO,A
q09,"Choosing a focused position that forgoes about {n1} percent of broad-market demand is often:",10,40,A deliberate strategy tradeoff,Proof of failure,Illegal under competition law,Irrelevant to positioning,A
q10,"When {n1} activity choices reinforce each other, the firm is building:",3,9,Strategic fit,Random experimentation,Pure financial engineering,Supplier dependency only,A
`;

/** Full demo bank (also valid to upload as-is). */
export const QUESTION_BANK_SAMPLE = `question_id,stem_template,n1_min,n1_max,choice_a_template,choice_b_template,choice_c_template,choice_d_template,correct_choice
q_switch,"If customer switching cost is about {n1} months of revenue, which force usually strengthens?",1,6,Buyer power,Supplier power,Threat of substitutes only,None of the above,A
q_rival,"When industry growth slows near {n1} percent, rivalry among existing firms typically:",1,5,Intensifies,Disappears,Becomes irrelevant to strategy,Only helps new entrants,A
q_entry,"A capital requirement near {n1} million most directly raises:",10,90,Barriers to entry,Buyer power,Substitute attractiveness,Complementor influence,A
q_supplier,"If a key input has only {n1} viable suppliers worldwide, supplier power tends to be:",2,8,Higher,Lower,Unchanged,Illegal to discuss,A
q_subs,"A substitute that costs about {n1} percent less than the focal product mainly threatens:",10,40,Pricing power of incumbents,HR compliance,Board independence,Warehouse layout,A
q_diff,"Spending roughly {n1} percent of revenue on distinctive capabilities most supports:",5,20,Differentiation advantage,Commodity price wars only,Tax avoidance,Inventory write-offs,A
q_cost,"A structural cost advantage of about {n1} percent versus rivals is primarily a:",5,25,Cost leadership source,Marketing slogan,One-time accounting entry,HR benefit,A
q_scope,"Expanding into {n1} adjacent segments can create scope economies when capabilities transfer:",2,6,Across businesses,Only within one SKU,Never in services,Only after IPO,A
q_tradeoff,"Choosing a focused position that forgoes about {n1} percent of broad-market demand is often:",10,40,A deliberate strategy tradeoff,Proof of failure,Illegal under competition law,Irrelevant to positioning,A
q_fit,"When {n1} activity choices reinforce each other, the firm is building:",3,9,Strategic fit,Random experimentation,Pure financial engineering,Supplier dependency only,A
`;

export const STUDENT_LIST_TEMPLATE = `student_name,student_id
Student One,S0001
Student Two,S0002
Student Three,S0003
`;

export const STUDENT_LIST_SAMPLE = `student_name,student_id
Alex Rivera,S1001
Jordan Lee,S1002
Sam Patel,S1003
Casey Nguyen,S1004
Riley Chen,S1005
`;

export type TemplateId =
  | "question-bank-template"
  | "question-bank-sample"
  | "student-list-template"
  | "student-list-sample";

const FILES: Record<TemplateId, { filename: string; body: string }> = {
  "question-bank-template": {
    filename: "question-bank-template.csv",
    body: QUESTION_BANK_TEMPLATE,
  },
  "question-bank-sample": {
    filename: "question-bank-sample.csv",
    body: QUESTION_BANK_SAMPLE,
  },
  "student-list-template": {
    filename: "student-list-template.csv",
    body: STUDENT_LIST_TEMPLATE,
  },
  "student-list-sample": {
    filename: "student-list-sample.csv",
    body: STUDENT_LIST_SAMPLE,
  },
};

export function getTemplate(id: string): { filename: string; body: string } | null {
  if (id in FILES) return FILES[id as TemplateId];
  return null;
}

export function csvDownloadResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "public, max-age=300",
      "referrer-policy": "no-referrer",
    },
  });
}
