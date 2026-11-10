// Find a large, connected light paper region; fall back to the full image when uncertain.
export function findReceiptPaper({data,width,height}) {
  const full={left:0,top:0,right:width,bottom:height};
  const mask=new Uint8Array(width*height),queue=new Uint32Array(width*height);
  for(let i=0;i<mask.length;i++){
    const n=i*4,r=data[n],g=data[n+1],b=data[n+2];
    if(Math.min(r,g,b)>120&&Math.max(r,g,b)-Math.min(r,g,b)<60&&(r+g+b)/3>150)mask[i]=1;
  }
  let best=null;
  for(let start=0;start<mask.length;start++){
    if(mask[start]!==1)continue;
    let head=0,tail=0,left=width,right=0,top=height,bottom=0;
    mask[start]=2;queue[tail++]=start;
    while(head<tail){
      const index=queue[head++],x=index%width,y=Math.floor(index/width);
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      const visit=next=>{if(mask[next]===1){mask[next]=2;queue[tail++]=next;}};
      if(x>0)visit(index-1);if(x+1<width)visit(index+1);if(y>0)visit(index-width);if(y+1<height)visit(index+width);
    }
    if(!best||tail>best.area)best={left,right:right+1,top,bottom:bottom+1,area:tail};
  }
  if(!best||best.area<width*height*0.18||(best.right-best.left)<width*0.25||(best.bottom-best.top)<height*0.3||best.area<(best.right-best.left)*(best.bottom-best.top)*0.55)return full;
  const pad=Math.ceil(Math.max(width,height)*0.015);
  return {left:Math.max(0,best.left-pad),right:Math.min(width,best.right+pad),top:Math.max(0,best.top-pad),bottom:Math.min(height,best.bottom+pad)};
}
export function prepareReceiptImage(bitmap) {
  const sample=document.createElement('canvas'),ratio=Math.min(1,640/Math.max(bitmap.width,bitmap.height));
  sample.width=Math.round(bitmap.width*ratio);sample.height=Math.round(bitmap.height*ratio);
  const small=sample.getContext('2d',{willReadFrequently:true});
  small.drawImage(bitmap,0,0,sample.width,sample.height);
  const box=findReceiptPaper(small.getImageData(0,0,sample.width,sample.height));
  const x=box.left/ratio,y=box.top/ratio,w=(box.right-box.left)/ratio,h=(box.bottom-box.top)/ratio;
  const scale=Math.min(4,1600/w,3600/h),canvas=document.createElement('canvas');
  canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bitmap,x,y,w,h,0,0,canvas.width,canvas.height);
  const image=ctx.getImageData(0,0,canvas.width,canvas.height),hist=new Uint32Array(256),values=image.data;
  for(let i=0;i<values.length;i+=4){const gray=Math.round(values[i]*0.299+values[i+1]*0.587+values[i+2]*0.114);hist[gray]++;values[i]=values[i+1]=values[i+2]=gray;}
  const pixels=canvas.width*canvas.height;let count=0,low=0,high=255;
  for(let i=0;i<256;i++){count+=hist[i];if(count>=pixels*0.02){low=i;break;}}
  count=0;for(let i=255;i>=0;i--){count+=hist[i];if(count>=pixels*0.02){high=i;break;}}
  if(high-low>40)for(let i=0;i<values.length;i+=4){const gray=Math.max(0,Math.min(255,Math.round((values[i]-low)*255/(high-low))));values[i]=values[i+1]=values[i+2]=gray;}
  ctx.putImageData(image,0,0);sample.width=sample.height=1;
  return canvas;
}

// Keep the source scale for small, sharp receipts. Enlarging a grid can merge its lines with digits.
export function prepareReceiptReference(bitmap) {
  const scale = Math.min(1, 1600 / bitmap.width, 3600 / bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}
