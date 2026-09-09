import type {Metadata} from 'next';
export const metadata:Metadata={title:'Free middle-school math sample · Grades 6–8 · Schoolday',description:'Try one original math lesson for grade 6, 7 or 8. No account or card. Explore the Schoolday learning workflow.',alternates:{canonical:'https://schoolday-os.sickyicky.chatgpt.site/try'}};
import {FamilyFlow} from '../family-flow';
export default function TryPage(){return <FamilyFlow initialStep="preview"/>}
