 (function(){
   const CanvasModule = {
     init(deps){
       this.canvas = deps.canvas;
       this.ctx = this.canvas.getContext('2d');
       this.svgLayer = deps.svgLayer;
       this.cWrap = deps.cWrap;
       this.cHint = deps.cHint;
       this.tool = 'pen';
       this.color = '#1e1b16';
       this.size = 2;
       this.drawing = false;
       this.ox = 0;
       this.oy = 0;
       this.sx = 0;
       this.sy = 0;
       this.currentPath = null;
       this.pathPoints = [];
       this.smoothingFactor = 0.3;
     },
     setTool(t){ this.tool = t },
     setColor(c){ this.color = c },
     setSize(s){ this.size = s },
     onDown(e){
       const p = this.pos(e);
       if(this.tool === 'hand') return;
       if(this.tool === 'text'){
         if(typeof window.createTextInput === 'function'){
           window.createTextInput(p.x, p.y);
         }
         return;
       }
       this.drawing = true;
       this.ox = this.sx = p.x;
       this.oy = this.sy = p.y;
       this.ctx.beginPath();
       this.ctx.moveTo(this.ox, this.oy);
       if(this.tool === 'pen'){
         const svg = this.svgLayer;
         if(svg){
           this.currentPath = document.createElementNS('http://www.w3.org/2000/svg','path');
           this.currentPath.setAttribute('fill','none');
           this.currentPath.setAttribute('stroke', this.color);
           this.currentPath.setAttribute('stroke-width', String(this.size));
           this.currentPath.setAttribute('stroke-linecap','round');
           this.currentPath.setAttribute('stroke-linejoin','round');
           this.pathPoints = [{ x: p.x, y: p.y }];
           this.currentPath.setAttribute('d', 'M' + p.x + ',' + p.y);
           svg.appendChild(this.currentPath);
         }
       }
     },
     onMove(e){
       const p = this.pos(e);
       if(!this.drawing) return;
       if(this.cHint) this.cHint.classList.add('gone');
       if(this.tool === 'pen'){
         this.ctx.globalCompositeOperation = 'source-over';
         this.ctx.strokeStyle = this.color;
         this.ctx.lineWidth = this.size;
         this.ctx.lineCap = 'round';
         this.ctx.lineJoin = 'round';
         this.ctx.lineTo(p.x, p.y);
         this.ctx.stroke();
         this.ox = p.x;
         this.oy = p.y;
         if(this.currentPath){
           this.pathPoints.push({ x: p.x, y: p.y });
           if(this.pathPoints.length >= 2){
             const prev = this.pathPoints[this.pathPoints.length - 2];
             const curr = this.pathPoints[this.pathPoints.length - 1];
             const distance = Math.hypot(curr.x - prev.x, curr.y - prev.y);
             const speed = distance * 10;
             const smoothed = this.smoothPathPoints(this.pathPoints, this.smoothingFactor);
             let d = 'M' + smoothed[0].x + ',' + smoothed[0].y;
             for(let i=1;i<smoothed.length;i++){
               const prevPt = smoothed[i-1];
               const currPt = smoothed[i];
               const cpX = prevPt.x + (currPt.x - prevPt.x) * 0.5;
               const cpY = prevPt.y + (currPt.y - prevPt.y) * 0.5;
               d += 'Q' + cpX + ',' + cpY + ',' + currPt.x + ',' + currPt.y;
             }
             const pressure = this.simulatePenPressure(distance, speed);
             const dynamicWidth = this.size * pressure;
             this.currentPath.setAttribute('stroke-width', String(dynamicWidth));
             this.currentPath.setAttribute('d', d);
           }
         }
       } else if(this.tool === 'eraser'){
         this.ctx.globalCompositeOperation = 'destination-out';
         this.ctx.lineWidth = this.size * 6;
         this.ctx.lineCap = 'round';
         this.ctx.lineTo(p.x, p.y);
         this.ctx.stroke();
         this.ctx.globalCompositeOperation = 'source-over';
         this.ox = p.x;
         this.oy = p.y;
       }
     },
     onUp(e){
       this.drawing = false;
       if(this.tool === 'pen'){
         this.currentPath = null;
         this.pathPoints = [];
       }
     },
     pos(e){
       const r = this.canvas.getBoundingClientRect();
       const s = e.touches ? e.touches[0] : e;
       return { x: s.clientX - r.left, y: s.clientY - r.top };
     },
     simulatePenPressure(distance, speed){
       const base = 0.7;
       const factor = Math.max(0.3, Math.min(1.0, 1.0 - (speed / 2000)));
       return base * factor;
     },
     smoothPathPoints(points, smoothing){
       if(points.length < 3) return points;
       const out = [points[0]];
       for(let i=1;i<points.length-1;i++){
         const prev = points[i-1];
         const curr = points[i];
         const next = points[i+1];
         const x = curr.x + (prev.x + next.x - 2 * curr.x) * smoothing;
         const y = curr.y + (prev.y + next.y - 2 * curr.y) * smoothing;
         out.push({ x, y });
       }
       out.push(points[points.length-1]);
       return out;
     }
   };
   if(typeof window !== 'undefined'){
     window.CanvasModule = CanvasModule;
   }
 })();
