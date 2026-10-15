import { picks, managers, months } from '../data.js';
const ids=new Set(picks.map(p=>p.abbr));
const aliases={NYK:'NY',GSW:'GS',SAS:'SA',NOP:'NO',UTA:'UTAH',WAS:'WSH',PHO:'PHX',BRK:'BKN'};
const normalize = code => aliases[code] || code;
function todayNY(){ return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export function aggregate(events,asOf){
 const cutoff=asOf || todayNY(); const teams=Object.fromEntries(picks.map(p=>[p.abbr,{...p,wins:0,losses:0,monthly:Object.fromEntries(months.map(m=>[m,{wins:0,losses:0}]))}]));
 const seen=new Set(); let games=0;
 for(const ev of events){
  if(!ev || seen.has(ev.id))continue;seen.add(ev.id);
  if(!ev.status?.type?.completed && ev.status?.type?.name!=='STATUS_FINAL')continue;
  if(ev.season?.type!=null && Number(ev.season.type)!==2)continue;
  const game=ev.competitions?.[0];if(!game || game.competitors?.length!==2)continue;
  // NBA Cup championship game is not included in regular-season standings.
  if(/championship/i.test([ev.name,ev.shortName,game.notes?.map(n=>n.headline).join(' ')].join(' ')) && /nba cup|emirates/i.test(JSON.stringify(ev)))continue;
  const dt=(ev.date||game.date||'').slice(0,10);
  // ESPN timestamps are UTC; regular-season game month follows local US Eastern tipoff date.
  const eastDate=ev.date? new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(ev.date)):dt;
  if(eastDate<'2026-10-20'||eastDate>'2027-04-11'||eastDate>cutoff)continue;
  const month=eastDate.slice(0,7); if(!months.includes(month))continue;
  const competitors=game.competitors.map(c=>({abbr:normalize(c.team?.abbreviation),score:Number(c.score)}));
  if(competitors.some(c=>!ids.has(c.abbr)||!Number.isFinite(c.score))||competitors[0].score===competitors[1].score)continue;
  for(const c of competitors){const t=teams[c.abbr];const win=c.score>competitors.find(o=>o!==c).score; t[win?'wins':'losses']++;t.monthly[month][win?'wins':'losses']++;}games++;
 }
 const leaderboard=managers.map(manager=>{let owned=Object.values(teams).filter(t=>t.manager===manager);return {manager,wins:owned.reduce((a,t)=>a+t.wins,0),losses:owned.reduce((a,t)=>a+t.losses,0),line:owned.reduce((a,t)=>a+t.line,0),monthly:Object.fromEntries(months.map(m=>[m,{wins:owned.reduce((a,t)=>a+t.monthly[m].wins,0),losses:owned.reduce((a,t)=>a+t.monthly[m].losses,0)}]))};}).sort((a,b)=>b.wins-a.wins||a.losses-b.losses||a.manager.localeCompare(b.manager));
 return {teams:Object.values(teams).sort((a,b)=>a.pick-b.pick),leaderboard,months,games,asOf:cutoff,source:'ESPN public scoreboard',preseasonSource:'Fanatics Sportsbook article, October 13, 2026'};
}
export async function fetchEvents(fetcher=fetch){
 const cutoff=todayNY(), data=await Promise.all(months.filter(m=>m<=cutoff.slice(0,7)).map(async m=>{
 const url=`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${m.replace('-','')}&limit=500&seasontype=2`;
 const res=await fetcher(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)});if(!res.ok)throw new Error(`ESPN returned ${res.status} for ${m}`);
 const json=await res.json();return json.events||[];
 }));return data.flat();
}
export default async function handler(req,res){
 try{
 const events=await fetchEvents();const result=aggregate(events);res.setHeader('Cache-Control','public, s-maxage=43200, stale-while-revalidate=3600');res.setHeader('Content-Type','application/json; charset=utf-8');return res.status(200).json({...result,refreshedAt:new Date().toISOString()});
 }catch(err){res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'Unable to retrieve verified NBA results. No scores have been fabricated.',details:String(err.message)});}
}
