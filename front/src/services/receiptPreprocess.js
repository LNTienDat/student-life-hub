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
function normalizeIllumination(grays, width, height) {
  const cell = Math.max(32, Math.floor(Math.min(width, height) / 12));
  const cols = Math.max(2, Math.ceil(width / cell));
  const rows = Math.max(2, Math.ceil(height / cell));
  const grid = new Float32Array(rows * cols);
  const hist = new Uint32Array(256);
  for (let gy = 0; gy < rows; gy++) {
    const y0 = Math.floor((gy * height) / rows);
    const y1 = Math.floor(((gy + 1) * height) / rows);
    for (let gx = 0; gx < cols; gx++) {
      const x0 = Math.floor((gx * width) / cols);
      const x1 = Math.floor(((gx + 1) * width) / cols);
      hist.fill(0);
      let samples = 0;
      const step = Math.max(1, Math.floor(Math.min(x1 - x0, y1 - y0) / 16));
      for (let y = y0; y < y1; y += step) {
        const rowOff = y * width;
        for (let x = x0; x < x1; x += step) {
          hist[grays[rowOff + x]]++;
          samples++;
        }
      }
      const target = Math.max(1, Math.floor(samples * 0.85));
      let acc = 0, bg = 240;
      for (let v = 0; v < 256; v++) {
        acc += hist[v];
        if (acc >= target) { bg = v; break; }
      }
      grid[gy * cols + gx] = Math.max(48, bg);
    }
  }
  for (let y = 0; y < height; y++) {
    const fy = Math.min(rows - 1.0001, Math.max(0, ((y + 0.5) * rows) / height - 0.5));
    const gy0 = Math.floor(fy), gy1 = Math.min(rows - 1, gy0 + 1), ty = fy - gy0;
    const rowOff = y * width;
    for (let x = 0; x < width; x++) {
      const fx = Math.min(cols - 1.0001, Math.max(0, ((x + 0.5) * cols) / width - 0.5));
      const gx0 = Math.floor(fx), gx1 = Math.min(cols - 1, gx0 + 1), tx = fx - gx0;
      const top = grid[gy0 * cols + gx0] * (1 - tx) + grid[gy0 * cols + gx1] * tx;
      const bot = grid[gy1 * cols + gx0] * (1 - tx) + grid[gy1 * cols + gx1] * tx;
      const bg = top * (1 - ty) + bot * ty;
      grays[rowOff + x] = Math.max(0, Math.min(255, Math.round((grays[rowOff + x] * 245) / bg)));
    }
  }
}

export function prepareReceiptImage(bitmap) {
  const sample=document.createElement('canvas'),ratio=Math.min(1,640/Math.max(bitmap.width,bitmap.height));
  sample.width=Math.round(bitmap.width*ratio);sample.height=Math.round(bitmap.height*ratio);
  const small=sample.getContext('2d',{willReadFrequently:true});
  small.drawImage(bitmap,0,0,sample.width,sample.height);
  const box=findReceiptPaper(small.getImageData(0,0,sample.width,sample.height));
  const x=box.left/ratio,y=box.top/ratio,w=(box.right-box.left)/ratio,h=(box.bottom-box.top)/ratio;
  const scale=Math.min(3,1600/w,3600/h),canvas=document.createElement('canvas');
  canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bitmap,x,y,w,h,0,0,canvas.width,canvas.height);
  const image=ctx.getImageData(0,0,canvas.width,canvas.height),values=image.data;
  const pixels=canvas.width*canvas.height,grays=new Uint8Array(pixels);
  for(let i=0,p=0;i<values.length;i+=4,p++)grays[p]=Math.round(values[i]*0.299+values[i+1]*0.587+values[i+2]*0.114);
  normalizeIllumination(grays,canvas.width,canvas.height);
  const hist=new Uint32Array(256);
  for(let p=0;p<pixels;p++)hist[grays[p]]++;
  let count=0,low=0,high=255;
  for(let i=0;i<256;i++){count+=hist[i];if(count>=pixels*0.015){low=i;break;}}
  count=0;for(let i=255;i>=0;i--){count+=hist[i];if(count>=pixels*0.08){high=i;break;}}
  const span=high-low>35?high-low:255,base=high-low>35?low:0;
  for(let i=0,p=0;i<values.length;i+=4,p++){
    const gray=Math.max(0,Math.min(255,Math.round((grays[p]-base)*255/span)));
    values[i]=values[i+1]=values[i+2]=gray;
  }
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
