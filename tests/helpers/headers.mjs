export async function headers(){return globalThis.__schooldayTest.headers;}
export async function cookies(){return {get(name){const value=globalThis.__schooldayTest.cookies[name];return value?{value}:undefined;},set(name,value){globalThis.__schooldayTest.cookies[name]=value;}};}
