import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const URL="https://wbieibfpgumarsbbzmcr.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_ysOqGB_btkqpoIr6rzw4Xg_32q-nehv";
const db=createClient(URL,PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const $=id=>document.getElementById(id);
const msg=text=>$("status").textContent=text;
function show(loggedIn){$("login").hidden=loggedIn;$("dashboard").hidden=!loggedIn}
async function load(){
  msg("Lade Daten …");
  const tables=[["employees","Mitarbeiter"],["time_entries","Arbeitszeiten"],["breaks","Pausen"],["schedules","Wochenpläne"],["audit_log","Protokolle"]];
  const results=await Promise.all(tables.map(async ([table,label])=>{
    const {count,error}=await db.from(table).select("*",{count:"exact",head:true});
    if(error)throw Error(label+": "+error.message);
    return {label,count};
  }));
  $("stats").replaceChildren(...results.map(({label,count})=>{
    const node=document.createElement("div");node.className="stat";
    const number=document.createElement("strong");number.textContent=count;
    const title=document.createElement("span");title.textContent=label;
    node.append(number,title);return node;
  }));
  const {data,error}=await db.from("employees").select("name,active").order("name");
  if(error)throw Error("Mitarbeiterliste: "+error.message);
  $("people").replaceChildren(...data.map(p=>{
    const node=document.createElement("div");node.className="person"+(p.active?"":" inactive");
    node.textContent=p.name+(p.active?"":" (inaktiv)");return node;
  }));
  msg("");
}
$("loginForm").addEventListener("submit",async ev=>{
  ev.preventDefault();msg("Anmeldung wird geprüft …");
  const button=$("loginForm").querySelector("button");button.disabled=true;
  try{
    const {error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
    if(error)throw error;
    $("password").value="";
    show(true);await load();
  }catch(e){msg("Anmeldung oder Datenzugriff fehlgeschlagen: "+e.message);show(false);await db.auth.signOut()}
  finally{button.disabled=false}
});
$("logout").addEventListener("click",async()=>{await db.auth.signOut();$("stats").replaceChildren();$("people").replaceChildren();show(false);msg("Abgemeldet.")});
