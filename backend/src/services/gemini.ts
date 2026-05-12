import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function summarizeIncident(incident: {
  title: string;
  severity: string;
  attackType: string;
  sourceIps: string[];
  affectedSystems: string[];
  timelineEvents: any[];
}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a senior SOC analyst. Write a concise, professional incident summary for this cybersecurity incident.

Incident: ${incident.title}
Severity: ${incident.severity}
Attack Type: ${incident.attackType}
Source IPs: ${incident.sourceIps.join(', ')}
Affected Systems: ${incident.affectedSystems.join(', ')}
Timeline:
${incident.timelineEvents.map((e: any) => `- ${e.timestamp}: ${e.description}`).join('\n')}

Write a 3-4 sentence executive summary covering: what happened, the scope of impact, likely attacker intent, and immediate recommended actions. Be direct and actionable.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
