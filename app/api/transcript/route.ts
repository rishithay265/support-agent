import { db } from '@/lib/db';
export const runtime = 'nodejs';
// Explicitly supplied transcripts only; YouTube captions download requires authorization.
export async function POST(request: Request) {
  if (process.env.VERCEL) return Response.json({error:'Transcript uploads are disabled in the Vercel preview. Connect persistent storage and secure admin access first.'}, {status:503});
  let input: {id?:unknown; transcript?:unknown};
  try { input = await request.json(); } catch { return Response.json({error:'Invalid request.'}, {status:400}); }
  const id = typeof input.id === 'string' ? input.id.trim() : '';
  const transcript = typeof input.transcript === 'string' ? input.transcript.trim() : '';
  if (!/^[\w-]{11}$/.test(id) || !transcript || transcript.length > 250000) return Response.json({error:'Provide a valid video ID and a transcript under 250,000 characters.'}, {status:400});
  const database = db();
  try {
    const exists = database.prepare('SELECT id FROM videos WHERE id=?').get(id);
    if (!exists) return Response.json({error:'Video is not in this playlist.'}, {status:404});
    database.prepare("UPDATE videos SET transcript=?,summary=NULL,status='transcript',error=NULL,updated_at=? WHERE id=?").run(transcript,new Date().toISOString(),id);
    return Response.json({message:'Transcript saved. It is now available to the agent for basic keyword retrieval.'});
  } finally { database.close(); }
}
