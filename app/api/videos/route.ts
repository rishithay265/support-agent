import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { const database = db(); const videos = database.prepare('SELECT id,title,description,duration,status,error,summary FROM videos ORDER BY rowid').all(); database.close(); return Response.json({videos, storage: process.env.VERCEL ? 'preview' : 'sqlite'}); }
  catch { return Response.json({error:'Could not load the video library.'}, {status:500}); }
}
