export function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export async function sendMail(env,message,key){
 if(env.EMAIL_PROVIDER==='smtp-relay'){
  if(!env.SMTP_RELAY_URL?.startsWith('https://')||!env.SMTP_RELAY_TOKEN)throw Error('Mailbox relay not configured.');
  const res=await fetch(env.SMTP_RELAY_URL,{method:'POST',headers:{Authorization:'Bearer '+env.SMTP_RELAY_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({...message,idempotencyKey:key})});
  if(!res.ok)throw Error('Mailbox relay rejected the email.');return res.json();
 }
 if(!env.RESEND_API_KEY||!env.MAIL_FROM)throw Error('Email service not configured.');
 const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({from:env.MAIL_FROM,reply_to:env.OWNER_EMAIL,...message})});
 if(!res.ok)throw Error('Email service rejected the email.');return res.json();
}
export function emailShell(title,body){return `<div style="font-family:Arial,sans-serif;color:#195b60;max-width:640px;margin:auto;background:#f9fcfa;padding:30px;border-top:6px solid #b7954c"><h1 style="font-family:Georgia,serif">Sassy &amp; Classy</h1><h2>${escapeHTML(title)}</h2>${body}</div>`;}
export async function sendConfirmation(env,customer,apiURL){
 const link=apiURL+'/confirm?token='+encodeURIComponent(customer.confirmation_token);
 await sendMail(env,{to:[customer.email],subject:'Confirm your Sassy & Classy emails',html:emailShell('A little sass in your inbox.',`<p>You requested occasional designs and holiday deals. Please confirm:</p><p><a href="${escapeHTML(link)}">Yes, subscribe me</a></p><p>If you didn’t request this, ignore this email. You are not subscribed yet.</p>`)},'confirm-'+customer.confirmation_token);
}
