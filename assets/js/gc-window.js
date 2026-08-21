(function () {
  var $ = function (id) { return document.getElementById(id); };
  var ta = $('gcw-seq'); if (!ta) return;
  var win = $('gcw-win'), winVal = $('gcw-winval'), barsG = $('gcw-bars'), xaxis = $('gcw-xaxis'),
      track = $('gcw-track'), tip = $('gcw-tip'), cursor = $('gcw-cursor'), svg = $('gcw-chart'),
      wrap = $('gcw-chartwrap'), statusEl = $('gcw-status'), emptyEl = $('gcw-empty');
  var DEMO = ta.value.trim(), NS = 'http://www.w3.org/2000/svg';
  var L=44,R=886,BOT=230,PW=R-L,PH=BOT-12,st={vals:[],n:0,bw:1,step:1,w:30},timer=null;
  function yOf(v){return BOT-v/100*PH;}
  function klass(v){return(v<30||v>75)?'bad':(v<40||v>65)?'warn':'ok';}
  function parse(raw){var up=raw.replace(/^\s*>.*$/gm,'').toUpperCase().replace(/[^A-Z]/g,''),seq=up.replace(/[^ACGTUN]/g,'');return{seq:seq.replace(/U/g,'T'),bad:up.length-seq.length,rna:seq.indexOf('U')>-1&&seq.indexOf('T')===-1};}
  function windows(s,w){var out=[],g=0,i,c;for(i=0;i<s.length;i++){c=s.charCodeAt(i);if(c===71||c===67)g++;if(i>=w){c=s.charCodeAt(i-w);if(c===71||c===67)g--;}if(i>=w-1)out.push(g/w*100);}return out;}
  function drawBars(vals,step){
    var n=Math.ceil(vals.length/step),bw=PW/n,w=Math.max(bw-(bw>2.2?.6:.1),.45),i,r,v;
    while(barsG.childNodes.length>n)barsG.removeChild(barsG.lastChild);
    for(i=0;i<n;i++){r=barsG.childNodes[i];if(!r){r=document.createElementNS(NS,'rect');r.setAttribute('rx','.7');barsG.appendChild(r);}v=vals[i*step];r.setAttribute('x',(L+i*bw).toFixed(2));r.setAttribute('width',w.toFixed(2));r.setAttribute('y',yOf(v).toFixed(2));r.setAttribute('height',Math.max(BOT-yOf(v),.9).toFixed(2));r.setAttribute('class','gcw-bar '+klass(v));}
    st.n=n;st.bw=bw;st.step=step;st.vals=vals;
  }
  function drawAxis(len,w){var t='',i,x,p,a;for(i=0;i<=5;i++){x=L+i/5*PW;p=Math.round(i/5*(len-w))+1;a=i===0?'start':i===5?'end':'middle';t+='<line class="gcw-tick" x1="'+x.toFixed(1)+'" y1="230" x2="'+x.toFixed(1)+'" y2="235"/><text class="gcw-axl" x="'+x.toFixed(1)+'" y="247" text-anchor="'+a+'">'+p+'</text>';}t+='<text class="gcw-axl" x="465" y="259" text-anchor="middle" opacity=".5">WINDOW START POSITION (nt)</text>';xaxis.innerHTML=t;}
  function drawTrack(seq,vals,w){var half=w>>1,cap=Math.min(seq.length,12000),rows=[],i,j,k,run,rc,html,ruler='';for(i=1;i<=6;i++)ruler+=('        '+i*10).slice(-10);rows.push('<div class="gcw-line gcw-ruler"><span class="gcw-num"></span><span class="gcw-bases">'+ruler+'</span></div>');for(i=0;i<cap;i+=60){html='';run='';rc='';for(j=i;j<i+60&&j<cap;j++){k=vals.length?klass(vals[Math.min(Math.max(j-half,0),vals.length-1)]):'na';if(k!==rc){if(run)html+='<span class="'+rc+'">'+run+'</span>';rc=k;run='';}run+=seq.charAt(j);}if(run)html+='<span class="'+rc+'">'+run+'</span>';rows.push('<div class="gcw-line"><span class="gcw-num">'+(i+1)+'</span><span class="gcw-bases">'+html+'</span></div>');}if(seq.length>cap)rows.push('<div class="gcw-line gcw-trunc"><span class="gcw-num"></span><span class="gcw-bases">+ '+(seq.length-cap).toLocaleString()+' nt not rendered</span></div>');track.innerHTML=rows.join('');}
  function setStat(id,val,note,cls){$(id).textContent=val;if(note!==null)$(id+'-n').textContent=note;$(id).parentNode.className='gcw-stat'+(cls?' '+cls:'');}
  function hideTip(){tip.hidden=true;cursor.style.opacity=0;}
  function render(){
    var p=parse(ta.value),seq=p.seq,w=+win.value,i,v,run=0,best=0,gc=0,prob=0,crit=0;
    st.w=w;winVal.textContent=w;win.style.setProperty('--p',((w-10)/90*100).toFixed(1)+'%');
    $('gcw-len').textContent=seq.length.toLocaleString()+' nt';$('gcw-type').textContent=seq.length?(p.rna?'RNA':'DNA'):'—';
    $('gcw-warn').hidden=!p.bad;if(p.bad)$('gcw-warn').textContent='⚠ '+p.bad+' non-nucleotide char'+(p.bad>1?'s':'')+' ignored';
    if(seq.length<w){barsG.textContent='';xaxis.textContent='';st.n=0;hideTip();emptyEl.hidden=false;emptyEl.textContent=seq.length?'SEQUENCE SHORTER THAN WINDOW — NEED '+w+' nt':'PASTE A SEQUENCE TO BEGIN';['gcw-overall','gcw-prob','gcw-clean','gcw-count'].forEach(function(k){setStat(k,'—',null,'');});statusEl.textContent='IDLE';statusEl.dataset.s='idle';drawTrack(seq,[],w);return;}
    emptyEl.hidden=true;
    for(i=0;i<seq.length;i++){v=seq.charAt(i);if(v==='G'||v==='C')gc++;}
    var vals=windows(seq,w);for(i=0;i<vals.length;i++){v=vals[i];if(v<30||v>75)crit++;if(v<40||v>65){prob++;run=0;}else{run++;if(run>best)best=run;}}
    var overall=gc/seq.length*100,pct=prob/vals.length*100;
    drawBars(vals,Math.max(1,Math.ceil(vals.length/900)));drawAxis(seq.length,w);drawTrack(seq,vals,w);
    setStat('gcw-overall',overall.toFixed(1)+'%',gc.toLocaleString()+' G+C of '+seq.length.toLocaleString(),klass(overall));
    setStat('gcw-prob',prob.toLocaleString(),crit+' critical · '+pct.toFixed(0)+'% of scan',crit?'bad':prob?'warn':'');
    setStat('gcw-clean',best?(best+w-1)+' nt':'0 nt',best?best+' consecutive windows':'no in-spec window',best>=100?'':best?'warn':'bad');
    setStat('gcw-count',vals.length.toLocaleString(),'window '+w+' nt · step 1 nt','');
    statusEl.textContent=crit?'FLAGGED':prob?'MARGINAL':'CLEAN';statusEl.dataset.s=crit?'bad':prob?'warn':'ok';
  }
  wrap.addEventListener('pointermove',function(e){if(!st.n)return;var b=svg.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),sx=(e.clientX-b.left)/b.width*900;if(sx<L||sx>R)return hideTip();var i=Math.min(st.n-1,Math.max(0,Math.floor((sx-L)/st.bw))),vi=Math.min(st.vals.length-1,i*st.step),v=st.vals[vi],x=L+(i+.5)*st.bw;cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);cursor.style.opacity=.5;tip.hidden=false;tip.className='gcw-tip mono '+klass(v);tip.innerHTML='<b>'+v.toFixed(1)+'%</b> GC <span>nt '+(vi+1)+'–'+(vi+st.w)+'</span>';tip.style.left=(b.left-wr.left+wrap.scrollLeft+Math.max(64,Math.min(b.width-64,x/900*b.width)))+'px';});
  wrap.addEventListener('pointerleave',hideTip);
  ta.addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(render,90);});
  win.addEventListener('input',render);
  $('gcw-demo').addEventListener('click',function(){ta.value=DEMO;render();});
  $('gcw-clear').addEventListener('click',function(){ta.value='';ta.focus();render();});
  render();
})();
