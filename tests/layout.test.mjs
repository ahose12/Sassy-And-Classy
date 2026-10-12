import test from 'node:test';import assert from 'node:assert/strict';
await import('../docs/text-layout.js');
const ctx={font:'',measureText(text){const size=parseFloat(this.font);return {width:String(text).length*size*.55};}};
test('shirt text fits within its artwork box and uses a bounded line layout',()=>{for(const width of [48,72,160,220])for(const text of ['Stay classy','A really long girls trip shirt idea with several words','A'.repeat(100)]){const layout=SC_LAYOUT.fitText(ctx,text,'Arial',width);ctx.font=layout.fontSize+'px Arial';assert.ok(layout.lines.length);assert.ok(layout.lines.every(line=>ctx.measureText(line).width<=Math.max(16,width-14)));assert.ok(layout.baselines.every(y=>y<=layout.height));}});
test('tall and wide logos retain their aspect ratio and fit the image box',()=>{for(const aspect of [.2,1,5]){const box=SC_LAYOUT.imageBox(160,aspect);assert.ok(box.width<=160);assert.ok(box.height<=150);assert.ok(Math.abs(box.height/box.width-aspect)<.001);}});
