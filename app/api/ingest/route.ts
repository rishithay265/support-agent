import { db } from '@/lib/db';
export const runtime = 'nodejs';
// This MVP only imports public metadata. Captions require a separate authorized source.
export async function POST() {
  if (process.env.VERCEL) return Response.json({error:'Metadata sync is disabled in the Vercel preview. Connect persistent storage and secure admin access first.'}, {status:503});
  if (!process.env.YOUTUBE_API_KEY) return Response.json({error:'Add YOUTUBE_API_KEY on the server to sync video metadata.'}, {status:503});
  const database = db();
  try {
    const videos = database.prepare('SELECT id FROM videos').all() as {id:string}[];
    let updated = 0;
    for (let i=0; i<videos.length; i+=50) {
      const ids = videos.slice(i,i+50).map(v=>v.id).join(',');
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${encodeURIComponent(ids)}&key=${encodeURIComponent(process.env.YOUTUBE_API_KEY)}`, {cache:'no-store'});
      if (!res.ok) throw new Error(`YouTube API returned ${res.status}`);
      const body = await res.json();
      const update = database.prepare("UPDATE videos SET title=?,description=?,duration=?,status=CASE WHEN transcript IS NOT NULL AND transcript != '' THEN 'transcript' ELSE 'metadata' END,error=CASE WHEN transcript IS NOT NULL AND transcript != '' THEN NULL ELSE 'Transcript not indexed' END,updated_at=? WHERE id=?");
      for (const v of body.items || []) { update.run(v.snippet.title,v.snippet.description,v.contentDetails.duration,new Date().toISOString(),v.id); updated++; }
    }
    return Response.json({updated, message:'Metadata synced. Transcripts still need to be supplied before AI answers can be grounded.'});
  } catch(e) { return Response.json({error:e instanceof Error ? e.message : 'Sync failed'}, {status:502}); }
  finally { database.close(); }
}
