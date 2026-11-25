import { db } from '@/lib/db';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  let question = '';
  try { const body = await request.json(); question = typeof body.question === 'string' ? body.question.trim().slice(0,4000) : ''; } catch { return Response.json({error:'Invalid request'}, {status:400}); }
  if (!question) return Response.json({error:'Please enter a question.'}, {status:400});
  const database = db();
  const rows = database.prepare("SELECT id,title,transcript FROM videos WHERE transcript IS NOT NULL AND transcript != ''").all() as {id:string,title:string,transcript:string}[];
  database.close();
  // Refuse to guess when there is no indexed source or no matching source.
  const terms = question.toLowerCase().match(/[a-z0-9]{4,}/g) || [];
  const matches = rows.map(row=>({row, score:terms.reduce((n,t)=>n+(row.transcript.toLowerCase().includes(t)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  if (!matches.length) return Response.json({answer:'I couldn’t find this in the indexed training materials yet. Ask an admin to add transcripts and complete indexing, then try again.', citations:[]});
  if (!process.env.GEMINI_API_KEY) return Response.json({error:'The AI agent is not configured. Add GEMINI_API_KEY on the server.'}, {status:503});
  const model = process.env.GEMINI_MODEL || 'models/gemini-4-hydrogen';
  const key = encodeURIComponent(process.env.GEMINI_API_KEY);
  try {
    const verify = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}?key=${key}`);
    if (!verify.ok) return Response.json({error:`Configured model ${model} is unavailable. Choose an available model in GEMINI_MODEL.`}, {status:503});
    const context = matches.map(({row})=>`Video: ${row.title || row.id}\nURL: https://www.youtube.com/watch?v=${row.id}&t=0s\nTranscript: ${row.transcript.slice(0,12000)}`).join('\n\n');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/interactions?key=${key}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,input:`Answer only using the following training transcripts. If they do not answer the question, say so. Cite the video title and timestamp if present; do not invent timestamps.\n\n${context}\n\nQuestion: ${question}`})});
    if (!response.ok) throw new Error('Gemini request failed');
    const result = await response.json();
    const answer = (result.outputs || []).filter((o:{type:string})=>o.type==='text').map((o:{text:string})=>o.text).join('\n');
    if (!answer) throw new Error('Empty model response');
    return Response.json({answer,citations:matches.map(({row})=>({title:row.title || row.id,url:`https://www.youtube.com/watch?v=${row.id}&t=0s`}))});
  } catch { return Response.json({error:'Unable to reach the configured AI service.'}, {status:502}); }
}
