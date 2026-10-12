// One layout calculation is shared by the on-screen SVG and exported PNG.
(() => {
 function fitText(ctx,text,font,width){
  const words=String(text||'').trim().split(/\s+/).filter(Boolean);
  const available=Math.max(16,width-14);let fontSize=Math.min(30,Math.max(16,width*.22)),lines=[];
  for(;fontSize>=7;fontSize--){
   ctx.font=`${fontSize}px ${font}`;lines=[];let line='';
   for(const word of words){const candidate=line?line+' '+word:word;if(line&&ctx.measureText(candidate).width>available){lines.push(line);line=word;}else line=candidate;}
   if(line)lines.push(line);
   if(lines.length<=3&&lines.every(line=>ctx.measureText(line).width<=available))break;
  }
  if(fontSize<7){fontSize=7;ctx.font=`${fontSize}px ${font}`;lines=[];let line='';for(const char of words.join(' ')){if(line&&ctx.measureText(line+char).width>available){lines.push(line);line=char;}else line+=char;}if(line)lines.push(line);}
  const lineHeight=fontSize*1.38,padding=6,height=Math.max(lineHeight,lines.length*lineHeight)+padding*2;
  return {fontSize,lineHeight,height,lines,baselines:lines.map((_,i)=>padding+fontSize+i*lineHeight)};
 }
 function imageBox(width,aspect){const height=Math.min(width*(aspect||1),150);return {width:height/(aspect||1),height};}
 globalThis.SC_LAYOUT={fitText,imageBox};
})();
