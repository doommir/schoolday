export const familyGuideVersion='ca-family-2026-09-08';
export const familyOffer={amount:2900,currency:'usd',interval:'month',intervalCount:1};
export const familySources=[
 {title:'California private school requirements',url:'https://www.cde.ca.gov/sp/ps/psaffedcode.asp'},
 {title:'File or retrieve a Private School Affidavit',url:'https://www.cde.ca.gov/sp/ps/affidavit.asp'},
 {title:'Grade 6 areas of study · Education Code 51210',url:'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=EDC&sectionNum=51210.'},
 {title:'Grades 7–12 areas of study · Education Code 51220',url:'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=EDC&sectionNum=51220.'}
];
export const familyChecklist=[
 {id:'pathway',label:'Confirm who operates the school',detail:'For a home-based private school, the parent operates the school. A PSP, private school, charter, or district program has its own enrollment and record rules. Keep the current arrangement in place until the transition is arranged.'},
 {id:'affidavit',label:'Keep the current filing or enrollment record',detail:'For your own California private school, file the annual PSA and retain a copy. The statutory window is October 1–15; CDE opens the system August 1–June 30 for new schools. Filing alone is not state approval or a complete attendance exemption.'},
 {id:'instruction',label:'Arrange actual instruction and a course of study',detail:'California’s private-school exemption calls for a full-time day school, instruction by people capable of teaching, generally in English, and the required branches of study. Complete the subject plan below, including work outside this app.'},
 {id:'records',label:'Keep school records together',detail:'Keep your attendance register with half-day and full-day absences, courses of study, and instructor names, addresses, and qualifications. Keep enrollment, transfer, and other applicable student records with your school. Store sensitive documents privately; add only a reference here.'},
 {id:'services',label:'Resolve your child’s individual requirements',detail:'Confirm applicable health records, special education or other services, and any district verification or program requirements. This organizer is not an exhaustive legal determination; use the official guidance or qualified advice for your situation.'}
] as const;
export function familySubjects(grade:number){return [
 {id:'english',label:'English',coverage:'A mapped 180-day literacy and writing sequence; add sustained reading and actual discussion or presentation audiences as needed.'},
 {id:'math',label:'Mathematics',coverage:'A mapped grade-level sequence with unit reviews and target tracking. Review understanding and provide additional teaching when needed.'},
 {id:'science',label:'Science',coverage:'A mapped California integrated science sequence. Add investigations, materials, and firsthand experiences where needed.'},
 {id:'social',label:'Social sciences',coverage:'A mapped grade-level history sequence with source analysis. Review the breadth and depth of the actual course of study.'},
 {id:'arts',label:'Visual and performing arts',coverage:'Arrange dance, music, theatre, and visual arts outside the generated core. Studio writing is not a complete arts program.'},
 {id:'pe',label:'Physical education',coverage:'Arrange actual physical education. The app’s movement break and screen time do not verify PE instruction.'},
 ...(grade===6?[{id:'health',label:'Health',coverage:'Arrange an age-appropriate health course outside the generated core.'}]:[
 {id:'language',label:'World language',coverage:'Arrange language learning beginning by grade 7; no generated world-language course is included.'},
 {id:'applied',label:'Applied arts and career learning',coverage:'Plan age-appropriate practical and career learning. Review the full grades 7–12 course requirements with your program; this app does not provide every course in that span.'}])
 ];}
