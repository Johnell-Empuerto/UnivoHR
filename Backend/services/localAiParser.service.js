const http = require("http");

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:0.5b";
const MIN_CONFIDENCE = 0.3;

const VALID_TIME_PERIODS = ["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "this_cutoff", "last_cutoff"];

const SUPPORTED_INTENTS = [
  "dashboard_summary",
  "attendance_summary",
  "payroll_summary",
  "anomaly_summary",
  "forecast_summary",
  "late_employees",
  "absence_summary",
  "employee_attendance",
  "employee_payroll",
  "employee_overtime",
  "employee_leave",
  "employee_late_records",
  "employee_profile",
  "employee_anomalies",
  "employee_forecast",
  "department_summary",
  "branch_summary",
  "hr_policy_qa",
  "unknown",
];

const SYSTEM_PROMPT = `Return ONLY valid JSON. No explanation. All 9 entity fields required.

Examples:
"give me my payroll" -> {"intent":"employee_payroll","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":true,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":null},"confidence":0.95}
"show my payroll last cutoff" -> {"intent":"employee_payroll","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":true,"dateFrom":null,"dateTo":null,"timePeriod":"last_cutoff","category":null},"confidence":0.95}
"Payroll for Alberto Garcia" -> {"intent":"employee_payroll","entities":{"employeeName":"Alberto Garcia","employeeCode":null,"branchName":null,"department":null,"isSelf":false,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":null},"confidence":0.9}
"show my attendance" -> {"intent":"employee_attendance","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":true,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":null},"confidence":0.95}
"show my overtime" -> {"intent":"employee_overtime","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":true,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":null},"confidence":0.95}
"show my leave" -> {"intent":"employee_leave","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":true,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":null},"confidence":0.95}
"show my profile" -> {"intent":"employee_profile","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":true,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":null},"confidence":0.95}
"how much is my salary this cutoff" -> {"intent":"employee_payroll","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":true,"dateFrom":null,"dateTo":null,"timePeriod":"this_cutoff","category":null},"confidence":0.95}
"show attendance summary" -> {"intent":"attendance_summary","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":false,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":null},"confidence":0.9}
"who is late today" -> {"intent":"late_employees","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":false,"dateFrom":null,"dateTo":null,"timePeriod":"today","category":null},"confidence":0.95}
"what is my paryll" -> {"intent":"employee_payroll","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":true,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":null},"confidence":0.85}
"show my payslip" -> {"intent":"employee_payroll","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":true,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":null},"confidence":0.95}
"what is leave policy" -> {"intent":"hr_policy_qa","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":false,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":"leave"},"confidence":0.95}
"what is attendance policy" -> {"intent":"hr_policy_qa","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":false,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":"attendance"},"confidence":0.95}
"how does overtime work" -> {"intent":"hr_policy_qa","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":false,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":"overtime"},"confidence":0.95}
"can I share my password" -> {"intent":"hr_policy_qa","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":false,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":"security"},"confidence":0.95}
"what is company policy" -> {"intent":"hr_policy_qa","entities":{"employeeName":null,"employeeCode":null,"branchName":null,"department":null,"isSelf":false,"dateFrom":null,"dateTo":null,"timePeriod":null,"category":"company"},"confidence":0.9}

Intents: dashboard_summary attendance_summary payroll_summary anomaly_summary forecast_summary late_employees absence_summary employee_attendance employee_payroll employee_overtime employee_leave employee_late_records employee_profile employee_anomalies employee_forecast department_summary branch_summary hr_policy_qa unknown

RULES:
- Word "my" or "me" in question -> isSelf MUST be true
- Named person like "Alberto Garcia" -> isSelf:false, fill employeeName
- No person mentioned, no "my"/"me" -> isSelf:false
- timePeriod: today yesterday this_week last_week this_month last_month this_cutoff last_cutoff null
- For questions with no time mentioned -> timePeriod:null
- "my salary THIS CUTOFF" -> timePeriod:"this_cutoff"
- "my payroll LAST CUTOFF" -> timePeriod:"last_cutoff"
- For policy questions, set intent to hr_policy_qa and fill category based on topic
- category values: leave attendance overtime security payroll privacy company null
- For general policy questions with no specific category, set category to "company"

Output format: {"intent":"str","entities":{"employeeName":null|"str","employeeCode":null|"str","branchName":null|"str","department":null|"str","isSelf":true|false,"dateFrom":null|"str","dateTo":null|"str","timePeriod":null|"str","category":null|"str"},"confidence":num}`;

const callOllama = (systemPrompt, userMessage) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: false,
      temperature: 0.1,
    });

    const url = new URL("/api/chat", OLLAMA_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 30000,
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve(body);
        } else {
          reject(
            new Error(
              `Ollama returned status ${res.statusCode}: ${body.substring(0, 200)}`
            )
          );
        }
      });
    });

    req.on("error", (err) =>
      reject(new Error(`Ollama connection failed: ${err.message}`))
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Ollama request timed out"));
    });
    req.write(data);
    req.end();
  });
};

const cleanEntityValue = (val) => {
  if (val === null || val === undefined) return null;
  let s = String(val).trim();
  if (s === "" || s === "null" || s === "none" || s === "n/a") return null;
  // Clean common AI artifacts
  s = s.replace(/\|/g, ", ");
  return s || null;
};

const detectIsSelf = (question) => {
  return /\b(my|me|mine|myself)\b/i.test(question);
};

const parseResponse = (raw, question) => {
  try {
    const parsed = JSON.parse(raw);
    const content = parsed.message && parsed.message.content;
    if (!content) return null;

    let jsonStr = content.trim();
    const jsonStart = jsonStr.indexOf("{");
    const jsonEnd = jsonStr.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }

    const result = JSON.parse(jsonStr);

    if (!result.intent || !SUPPORTED_INTENTS.includes(result.intent)) {
      return null;
    }

    if (!result.entities || typeof result.entities !== "object") {
      return null;
    }

    const confidence =
      typeof result.confidence === "number" ? result.confidence : 0;

    if (confidence < MIN_CONFIDENCE) {
      return null;
    }

    // Clean entities
    const rawName = cleanEntityValue(result.entities.employeeName);
    const rawCode = cleanEntityValue(result.entities.employeeCode);
    const rawBranch = cleanEntityValue(result.entities.branchName);
    const rawDept = cleanEntityValue(result.entities.department);
    let rawTimePeriod = cleanEntityValue(result.entities.timePeriod);
    const rawCategory = cleanEntityValue(result.entities.category);

    // Validate timePeriod
    if (rawTimePeriod && !VALID_TIME_PERIODS.includes(rawTimePeriod)) {
      rawTimePeriod = null;
    }

    // Override isSelf based on question content (more reliable)
    const hasMy = detectIsSelf(question);
    const isSelf = hasMy;

    return {
      intent: result.intent,
      entities: {
        employeeName: rawName,
        employeeCode: rawCode,
        branchName: rawBranch,
        department: rawDept,
        isSelf,
        dateFrom: cleanEntityValue(result.entities.dateFrom),
        dateTo: cleanEntityValue(result.entities.dateTo),
        timePeriod: rawTimePeriod,
        category: rawCategory,
      },
      confidence,
    };
  } catch (err) {
    return null;
  }
};

const parseWithOllama = async (question, context = {}) => {
  try {
    let prompt = SYSTEM_PROMPT;
    if (context.lastIntent) {
      prompt += `\nPrevious intent: ${context.lastIntent}`;
    }
    if (context.lastQuestion) {
      prompt += `\nPrevious question: ${context.lastQuestion}`;
    }

    const rawResponse = await callOllama(prompt, `Question: ${question}`);
    if (!rawResponse) return null;

    const result = parseResponse(rawResponse, question);
    if (!result) return null;

    return result;
  } catch (err) {
    console.error("[AI Parser] Ollama error:", err.message);
    return null;
  }
};

module.exports = { parseWithOllama };
