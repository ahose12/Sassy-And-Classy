// OPTIONAL adapter: run behind HTTPS on a Node host, with a persistent disk.
// This lets the Worker send through Mary Jane's actual Yahoo/Rocketmail mailbox.
import http from 'node:http';
import {timingSafeEqual,createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import nodemailer from 'nodemailer';
const {SMTP_USER,SMTP_APP_PASSWORD,RELAY_TOKEN}=process.env;
if(!SMTP_USER||!SMTP_APP_PASSWORD||!RELAY_TOKEN||RELAY_TOKEN.length<32)throw Error('Configure SMTP_USER, SMTP_APP_PASSWORD, and a strong RELAY_TOKEN as secrets.');
const db=new DatabaseSync(process.env.RELAY_DB_PATH||'/data/mail-jobs.sqlite');
db.exec('CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,payload_hash TEXT NOT NULL,status TEXT NOT NULL,message_id TEXT,updated_at INTEGER NOT NULL)');
const transporter=nodemailer.createTransport({host:'smtp.mail.yahoo.com',port:465,secure:true,auth:{user:SMTP_USER,pass:SMTP_APP_PASSWORD},connectionTimeout:20000,socketTimeout:30000});
const reply=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
function same(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
http.createServer(async(req,res)=>{
 if(req.url==='/health'&&req.method==='GET')return reply(res,200,{ok:true});
 if(req.url!=='/send'||req.method!=='POST')return reply(res,404,{error:'Not found'});
 if(!same(req.headers.authorization||'','Bearer '+RELAY_TOKEN))return reply(res,401,{error:'Unauthorized'});
 try{
  let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>12*1024*1024)return reply(res,413,{error:'Message is too large'});chunks.push(chunk);}
  const d=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(typeof d.idempotencyKey!=='string'||!/^[-a-zA-Z0-9]{1,160}$/.test(d.idempotencyKey)||!Array.isArray(d.to)||d.to.length!==1||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.to[0])||typeof d.subject!=='string'||/[\r\n]/.test(d.subject)||typeof d.html!=='string')return reply(res,400,{error:'Invalid message'});
  const hash=createHash('sha256').update(JSON.stringify(d)).digest('hex');
  const old=db.prepare('SELECT * FROM jobs WHERE id=?').get(d.idempotencyKey);
  if(old&&old.payload_hash!==hash)return reply(res,409,{error:'Idempotency key reused with different content'});
  if(old?.status==='sent')return reply(res,200,{id:old.message_id});
  // A crashed sending job is intentionally held for manual review instead of risking duplicate mail.
  if(old?.status==='sending')return reply(res,409,{error:'Message is in progress or requires delivery review'});
  db.prepare("INSERT INTO jobs(id,payload_hash,status,updated_at) VALUES(?,?,'sending',?) ON CONFLICT(id) DO UPDATE SET status='sending',updated_at=excluded.updated_at").run(d.idempotencyKey,hash,Date.now());
  const attachments=(d.attachments||[]).map(a=>{if(!['image/png','image/jpeg','image/webp'].includes(a.content_type)||typeof a.content!=='string')throw Error('Invalid attachment');return {filename:String(a.filename).slice(0,180),content:Buffer.from(a.content,'base64'),contentType:a.content_type,cid:a.content_id};});
  let result;try{result=await transporter.sendMail({from:`Sassy & Classy <${SMTP_USER}>`,to:d.to,replyTo:d.reply_to||SMTP_USER,subject:d.subject,html:d.html,attachments,headers:Object.fromEntries(Object.entries(d.headers||{}).filter(([key])=>['List-Unsubscribe','List-Unsubscribe-Post'].includes(key))),disableFileAccess:true,disableUrlAccess:true});}
  catch{db.prepare("UPDATE jobs SET status='failed',updated_at=? WHERE id=?").run(Date.now(),d.idempotencyKey);return reply(res,502,{error:'Mailbox rejected the message'});}
  db.prepare("UPDATE jobs SET status='sent',message_id=?,updated_at=? WHERE id=?").run(result.messageId,Date.now(),d.idempotencyKey);reply(res,200,{id:result.messageId});
 }catch{reply(res,400,{error:'Unable to process message'});}
}).listen(Number(process.env.PORT||3000));
