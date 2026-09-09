import {requireLearningLicense} from './billing';
import {HttpError,runtime,setting} from './server';

// Reading and completing prepared work never requires a fresh generation license.
export async function preparationAccess(profileId:string){
  if(!(runtime().OPENAI_API_KEY||await setting('ai_key')))return {canPrepare:false,preparationMessage:'New lessons are paused while the lesson connection is restored. Your prepared lessons and saved work remain available.'};
  try{await requireLearningLicense(profileId);return {canPrepare:true,preparationMessage:''};}
  catch(error){
    if(error instanceof HttpError&&[402,502,503].includes(error.status))return {canPrepare:false,preparationMessage:'Your adult can review learning access. Continue any prepared lessons and saved work in the meantime.'};
    throw error;
  }
}
