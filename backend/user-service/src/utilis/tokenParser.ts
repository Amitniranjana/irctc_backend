
export async function tokenParser(rawTokenString:string){
    const rawTokenObj:Record<string,string>={};
    if(!rawTokenString){
        return {};
    }
    const parts=rawTokenString.split(';')
    parts.map((part)=>{
        const[key,...rest]=part.trim().split('=');
        if(key){
            rawTokenObj[key]=rest.join('=');
        }
    })
    return rawTokenObj
}