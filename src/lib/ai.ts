import { ParsedTask, Priority, TaskCategory, Subtask } from '../types';
import { getTodayLocal } from './dateUtils';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.0-flash-001';

// Get API key from environment variable (set in Vercel)
const BUILTIN_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

if (!BUILTIN_API_KEY) {
  console.warn('OpenRouter API Key missing! AI features will not work until you add VITE_OPENROUTER_API_KEY to your environment variables.');
}

async function callAI(prompt: string): Promise<string> {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BUILTIN_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Do-It AI Productivity',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a task parsing assistant. Always respond with ONLY valid JSON, no markdown, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI API Error:', errorData);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.error('AI call failed:', err);
    throw err;
  }
}

function cleanJSON(str: string): string {
  return str.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
}

export const ai = {
  async parseTask(input: string): Promise<ParsedTask> {
    const today = getTodayLocal();
    const prompt = `Parse this task input into structured data. Today's date is ${today}.

Input: "${input}"

Respond with ONLY this valid JSON object:
{
  "title": "clean readable task title (translate to English if needed)",
  "dueDate": "YYYY-MM-DD",
  "dueTime": "HH:MM in 24h format or empty string",
  "priority": "high",
  "category": "personal"
}

CRITICAL RULES:
- "title": Always provide a clean, readable title in English. Capitalize first letter.
- "dueDate": ALWAYS return a date. If no date is mentioned, use today's date "${today}". For "tomorrow", add 1 day. For "next friday", calculate the next Friday.
- "dueTime": Extract time if mentioned (7 PM = "19:00", 9 AM = "09:00", morning = "09:00", noon = "12:00", evening = "18:00", night = "21:00"). If no time, return empty string "".
- "priority": Choose ONE of "high" (urgent, ASAP, important deadline), "medium" (default), or "low" (casual, sometime).
- "category": Choose ONE of "work", "study", "personal", "shopping", "health" based on the task content.
- Understand both English and Bengali input.`;

    try {
      const result = await callAI(prompt);
      const parsed = JSON.parse(cleanJSON(result));
      
      let finalDueDate = parsed.dueDate;
      
      // Post-processing: If AI returns a relative date or nothing, calculate it client-side.
      if (!finalDueDate || finalDueDate.toLowerCase() === 'today') {
        finalDueDate = today;
      } else if (finalDueDate.toLowerCase() === 'tomorrow') {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        finalDueDate = d.toISOString().split('T')[0];
      }
      
      return {
        title: parsed.title || input,
        dueDate: finalDueDate,
        dueTime: parsed.dueTime || undefined,
        priority: (['high', 'medium', 'low'].includes(parsed.priority) ? parsed.priority : 'medium') as Priority,
        category: (['work', 'study', 'personal', 'shopping', 'health'].includes(parsed.category) ? parsed.category : 'personal') as TaskCategory,
        reminder: parsed.reminder || undefined
      };
    } catch (e) {
      console.error('AI parse error:', e);
      return {
        title: input,
        dueDate: today,
        priority: 'medium' as Priority,
        category: 'personal' as TaskCategory,
      };
    }
  },

  async generateSubtasks(taskTitle: string): Promise<Subtask[]> {
    const prompt = `Break this task into 3-5 actionable subtasks: "${taskTitle}"

Respond with ONLY this valid JSON object:
{
  "subtasks": [
    { "title": "First specific actionable step" },
    { "title": "Second specific actionable step" },
    { "title": "Third specific actionable step" }
  ]
}

RULES:
- Generate AT LEAST 3 subtasks, max 5.
- Each subtask must be a specific, actionable step (start with a verb).
- Order them logically.
- Keep each title under 60 characters.
- Be concrete and practical.`;

    try {
      const result = await callAI(prompt);
      const parsed = JSON.parse(cleanJSON(result));
      const subs = parsed.subtasks || [];
      
      if (!Array.isArray(subs) || subs.length === 0) {
        return [
          { id: `sub_${Date.now()}_0`, title: `Plan: ${taskTitle}`, completed: false },
          { id: `sub_${Date.now()}_1`, title: `Start: ${taskTitle}`, completed: false },
          { id: `sub_${Date.now()}_2`, title: `Complete: ${taskTitle}`, completed: false },
        ];
      }
      
      return subs.map((s: any, i: number) => ({
        id: `sub_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        title: typeof s === 'string' ? s : (s.title || s.text || `Step ${i + 1}`),
        completed: false,
      }));
    } catch (e) {
      console.error('Subtask generation error:', e);
      return [
        { id: `sub_${Date.now()}_0`, title: `Plan: ${taskTitle}`, completed: false },
        { id: `sub_${Date.now()}_1`, title: `Start working on ${taskTitle}`, completed: false },
        { id: `sub_${Date.now()}_2`, title: `Finish ${taskTitle}`, completed: false },
      ];
    }
  },

  async suggestImprovements(tasks: string[]): Promise<string> {
    const prompt = `Based on these tasks, suggest 2 productivity improvements:
Tasks: ${tasks.slice(0, 10).join(', ')}

Respond with ONLY this JSON:
{
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    try {
      const result = await callAI(prompt);
      const parsed = JSON.parse(cleanJSON(result));
      return parsed.suggestions?.join('\n\n') || 'Keep up the great work!';
    } catch {
      return 'AI suggestions are currently unavailable.';
    }
  }
};
