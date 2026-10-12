(() => {
 const cfg = window.SC_CONFIG;
 const demo = !cfg.apiBase;
 const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const samples = [
 {id:'everyday',title:'The everyday favorite',category:'Everyday',description:'A soft-script saying, a favorite color, and a little everyday personality.',text:'Stay classy',color:'#fffdf7',style:'Classic crew tee',badge:'Make it yours'},
 {id:'celebrate',title:'Made for your moment',category:'Celebrations',description:'Birthdays, bridal parties, girls’ trips, and all the reasons to celebrate.',text:'The good times',color:'#e7c8cc',style:'Comfort-fit tee',badge:'Celebrate together'},
 {id:'team',title:'Your crew. Your colors.',category:'Groups & Teams',description:'Matching shirts and custom logos for your team, family, or business.',text:'Our kind of crew',color:'#195b60',style:'Classic crew tee',badge:'Better together'}
 ];
 const deals = [
 {id:'seasonal',title:'Your next holiday, personalized.',description:'Have a festive idea? Start a custom request and let’s bring it to life.',image:'assets/insta-highlight-1.jpg',badge:'Seasonal inspiration'},
 {id:'groups',title:'Something for the whole crew.',description:'Family gatherings, clubs, and teams—ask Mary Jane about a group quote.',image:'assets/insta-highlight-4.jpg',badge:'Group quotes'}
 ];
 function localGet(key, fallback){try{return JSON.parse(localStorage.getItem(key)) || fallback;}catch{return fallback;}}
 function localPut(key,data){try{localStorage.setItem(key,JSON.stringify(data));}catch{throw Error('Browser storage is full. Use a smaller image or reset the preview.');}}
 let token = ''; // Owner bearer token stays in memory; never persisted to localStorage.
 async function api(path, options={}){
  const headers = {...options.headers};
  if(token) headers.Authorization = 'Bearer '+token;
  if(options.body && !(options.body instanceof FormData)) headers['Content-Type']='application/json';
  const response=await fetch(cfg.apiBase.replace(/\/$/,'')+path,{...options,headers});
  const data=await response.json().catch(()=>({error:'Unexpected service response.'}));
  if(!response.ok) {if(response.status===401)token='';throw Error(data.error || 'Please try again.');}
  return data;
 }
 async function catalog(){return demo ? {products:localGet('sc-demo-products',samples),deals:localGet('sc-demo-deals',deals),settings:publicLinks(localGet('sc-demo-settings',cfg.socialLinks||{}))} : api('/catalog');}
 function safeImage(url){return /^(assets\/|https:\/\/|data:image\/(png|jpeg|webp);base64,)/.test(url||'')?url:'';}
 function validLink(key,value){try{const u=new URL(value);const hosts={instagram:['instagram.com'],facebook:['facebook.com','fb.com'],tiktok:['tiktok.com'],pinterest:['pinterest.com'],driveFolder:['drive.google.com']}[key]||[];return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&hosts.some(host=>u.hostname===host||u.hostname==='www.'+host)&&(key!=='driveFolder'||u.pathname.startsWith('/drive/folders/'));}catch{return false;}}
 function publicLinks(settings){return Object.fromEntries(['instagram','facebook','tiktok','pinterest'].filter(key=>validLink(key,settings[key])).map(key=>[key,settings[key]]));}
 function shirtSVG(product){const dark=product.color==='#195b60',width=170,ctx=document.createElement('canvas').getContext('2d');const layout=SC_LAYOUT.fitText(ctx,product.text||'Your design','Allura',width);return `<svg viewBox="0 0 400 460" aria-hidden="true"><path d="M122 52 L160 35 Q200 61 240 35 L278 52 L365 122 L319 185 L279 162 L279 418 Q200 434 121 418 L121 162 L81 185 L35 122 Z" fill="${esc(/^#[a-fA-F0-9]{6}$/.test(product.color)?product.color:'#fffdf7')}" stroke="#00000012" stroke-width="2"/><path d="M160 35 Q200 90 240 35" fill="none" stroke="#00000015" stroke-width="4"/><text text-anchor="middle" fill="${dark?'#fffdf7':'#195b60'}" font-family="Allura, cursive" font-size="${layout.fontSize}">${layout.lines.map((line,i)=>`<tspan x="200" y="${220-layout.height/2+layout.baselines[i]}">${esc(line)}</tspan>`).join('')}</text></svg>`;}
 function toast(message){const el=document.querySelector('#toast');if(!el)return;el.textContent=message;el.hidden=false;setTimeout(()=>el.hidden=true,4000);}
 function download(name,blob){const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function readImage(file){if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Please choose a PNG, JPG, or WebP image.');if(file.size>4*1024*1024)throw Error('Choose an image smaller than 4 MB.');return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read image.'));reader.readAsDataURL(file);});}
 let widgets={};
 function initTurnstile(ids){if(demo || !cfg.turnstileSiteKey)return;window.scTurnstileReady=()=>ids.forEach(id=>{widgets[id]=window.turnstile.render('#'+id,{sitekey:cfg.turnstileSiteKey});});const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=scTurnstileReady&render=explicit';script.async=true;document.head.appendChild(script);}
 function challenge(id){return widgets[id]!==undefined?window.turnstile.getResponse(widgets[id]):'';}
 function resetChallenge(id){if(widgets[id]!==undefined)window.turnstile.reset(widgets[id]);}
 window.SC={cfg,demo,esc,samples,deals,localGet,localPut,api,catalog,safeImage,shirtSVG,toast,download,readImage,initTurnstile,challenge,resetChallenge,setToken:t=>token=t,validLink,publicLinks};
})();
