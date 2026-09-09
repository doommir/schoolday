import {db,hash,HttpError} from './server';
import {reviewsPass} from './quality';
export async function assertReleased(a:Record<string,unknown>){
 if(!a.payload||!['ready','complete'].includes(String(a.status)))throw new HttpError('This lesson is not ready for learning.',409);
 // Historical pilot content remains readable, explicitly marked unverified by the UI.
 if(!a.standard_id)return;
 let valid=false;try{const snapshot=JSON.parse(String(a.standard_snapshot)),lesson=JSON.parse(String(a.payload));valid=snapshot.id===a.standard_id&&lesson.alignment?.standardId===a.standard_id&&reviewsPass(JSON.parse(String(a.reviews)),true)&&a.content_hash===await hash(String(a.payload)+'|'+String(a.standard_snapshot));}catch{}
 if(!valid){await db().prepare("UPDATE activities SET status='held',phase='held',lock_token=NULL,locked_until=0,error='Lesson integrity check failed. Educator review is required.' WHERE id=? AND status='ready'").bind(a.id).run();throw new HttpError('This lesson needs an integrity review before it can be opened. Saved work is preserved.',409);}
}
