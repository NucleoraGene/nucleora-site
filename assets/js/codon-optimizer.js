(function () {
  'use strict';
  var root = document.getElementById('codon-optimizer');
  if (!root) return;

  var W = {
    F:{TTT:[82,80,100,78,100],TTC:[100,100,72,100,70]},
    L:{TTA:[17,15,30,14,97],TTG:[32,32,28,33,100],CTT:[32,33,26,34,45],CTC:[49,50,21,51,21],CTA:[17,20,9,19,48],CTG:[100,100,100,100,38]},
    I:{ATT:[75,71,100,72,100],ATC:[100,100,82,100,57],ATA:[33,30,14,28,59]},
    M:{ATG:[100,100,100,100,100]},
    V:{GTT:[38,36,80,37,100],GTC:[51,51,57,53,54],GTA:[23,22,49,21,54],GTG:[100,100,100,100,49]},
    S:{TCT:[75,79,54,78,100],TCC:[92,96,54,100,62],TCA:[63,58,43,57,81],TCG:[25,25,54,26,38],AGT:[63,63,54,62,62],AGC:[100,100,100,99,42]},
    P:{CCT:[85,92,31,90,74],CCC:[100,100,23,100,36],CCA:[82,82,37,84,100],CCG:[33,33,100,32,29]},
    T:{ACT:[67,69,39,68,100],ACC:[100,100,100,100,63],ACA:[78,79,30,77,86],ACG:[33,34,61,33,37]},
    A:{GCT:[65,71,44,72,100],GCC:[100,100,75,100,58],GCA:[58,59,58,60,76],GCG:[28,26,100,27,29]},
    Y:{TAT:[75,72,100,71,100],TAC:[100,100,75,100,79]},
    H:{CAT:[69,68,100,67,100],CAC:[100,100,75,100,56]},
    Q:{CAA:[33,34,52,32,100],CAG:[100,100,100,100,45]},
    N:{AAT:[85,82,82,80,100],AAC:[100,100,100,100,69]},
    K:{AAA:[72,69,100,67,100],AAG:[100,100,30,100,72]},
    D:{GAT:[85,82,100,81,100],GAC:[100,100,59,100,54]},
    E:{GAA:[72,69,100,68,100],GAG:[100,100,45,100,43]},
    C:{TGT:[82,85,82,84,100],TGC:[100,100,100,100,59]},
    W:{TGG:[100,100,100,100,100]},
    R:{CGT:[38,40,95,42,29],CGC:[90,86,100,88,13],CGA:[52,55,15,56,15],CGG:[100,100,25,98,8],AGA:[95,100,10,100,100],AGG:[95,95,5,93,44]},
    G:{GGT:[47,47,85,48,100],GGC:[100,100,100,100,40],GGA:[74,78,28,80,47],GGG:[74,70,38,71,26]},
    '*':{TAA:[64,60,100,58,100],TAG:[51,48,11,46,49],TGA:[100,100,45,100,64]}
  };
  var AA3={A:'Ala',C:'Cys',D:'Asp',E:'Glu',F:'Phe',G:'Gly',H:'His',I:'Ile',K:'Lys',L:'Leu',M:'Met',N:'Asn',P:'Pro',Q:'Gln',R:'Arg',S:'Ser',T:'Thr',V:'Val',W:'Trp',Y:'Tyr','*':'Stop'};
  var HOSTS=['HOMO SAPIENS','MUS MUSCULUS','E. COLI K-12','CHO / C. GRISEUS','S. CEREVISIAE'];
  var EXAMPLE='MKTAYIAKQRQISFVKSHFSRQLEERLGLI';
  var K=2.2;
  var el={};
  ['coProtein','coSpecies','coMode','coStop','coViewer','coAaCount','coWarn','coHost','coLen','coGC','coCAI','coRare','coBar','coCopy','coExample','coClear'].forEach(function(id){el[id]=document.getElementById(id);});
  function gcOf(s){var m=s.match(/[GC]/g);return m?m.length:0;}
  function maxRun(s){var m=s.match(/(.)\1*/g),x=0,i;for(i=0;m&&i<m.length;i++)if(m[i].length>x)x=m[i].length;return x;}
  function hash(i,sp){var x=Math.sin((i+1)*12.9898+sp*78.233)*43758.5453;return x-Math.floor(x);}
  function choose(aa,sp,i,strict,prev,tail,gc,n){
    var opts=W[aa],keys=Object.keys(opts),sc=[],tot=0,j,c,s,run,f,g;
    for(j=0;j<keys.length;j++){c=keys[j];s=Math.pow(opts[c][sp]/100,strict?1:K);if(c===prev)s*=0.22;run=maxRun(tail+c);if(run>=5)s*=Math.pow(0.18,run-4);if(n>=15){f=gc/n;g=gcOf(c);if(f>0.60)s*=Math.pow(0.6,g);else if(f<0.42)s*=Math.pow(0.6,3-g);}sc.push(s);tot+=s;}
    if(strict){var best=keys[0],bs=-1;for(j=0;j<keys.length;j++)if(sc[j]>bs){bs=sc[j];best=keys[j];}return best;}
    var r=hash(i,sp)*tot,acc=0;for(j=0;j<keys.length;j++){acc+=sc[j];if(r<=acc)return keys[j];}return keys[keys.length-1];
  }
  function optimize(aa,sp,strict){
    var dna='',cells=[],gc=0,prev='',logSum=0,rare=0,i,c,w,t;
    for(i=0;i<aa.length;i++){if(!W[aa[i]])continue;c=choose(aa[i],sp,i,strict,prev,dna.slice(-4),gc,dna.length);w=W[aa[i]][c][sp];t=w>=70?'hi':(w>=40?'mid':'lo');if(t==='lo')rare++;logSum+=Math.log(Math.max(w,1)/100);gc+=gcOf(c);dna+=c;prev=c;cells.push({c:c,a:aa[i],w:w,t:t});}
    return{dna:dna,cells:cells,gc:gc,rare:rare,cai:cells.length?Math.exp(logSum/cells.length):0};
  }
  function cellHtml(x){var title=(AA3[x.a]||x.a)+' · '+x.c+' · '+x.w+'% relative usage'+(x.t==='lo'?' · RARE CODON':'');return'<span class="co-cd co-'+x.t+'" title="'+title+'"><span class="n">'+x.c+'</span><span class="a">'+x.a+'</span></span>';}
  var currentDna='';
  function run(){
    var raw=el.coProtein.value.toUpperCase(),seq=raw.replace(/[^ACDEFGHIKLMNPQRSTVWY*]/g,''),dropped=raw.replace(/\s/g,'').length-seq.length;
    seq=seq.replace(/\*/g,'');var residues=seq.length;if(seq&&el.coStop.checked)seq+='*';
    var sp=parseInt(el.coSpecies.value,10)||0,r=optimize(seq,sp,el.coMode.value==='max');
    currentDna=r.dna;
    el.coAaCount.textContent=residues+' residue'+(residues===1?'':'s')+' · '+r.cells.length+' codon'+(r.cells.length===1?'':'s');
    el.coWarn.textContent=dropped>0?dropped+' invalid char'+(dropped>1?'s':'')+' ignored':'';
    el.coHost.textContent=HOSTS[sp];el.coCopy.disabled=!r.dna;
    if(!r.dna){el.coViewer.innerHTML='<div class="co-empty">Awaiting protein sequence.</div>';el.coLen.innerHTML='0<small>nt</small>';el.coGC.innerHTML='0.0<small>%</small>';el.coCAI.textContent='0.000';el.coRare.innerHTML='0<small>flagged</small>';el.coBar.style.width='0%';return;}
    var rows='',i;for(i=0;i<r.cells.length;i+=10){rows+='<div class="co-row"><span class="co-pos">'+(i*3+1)+'</span><span class="co-cds">'+r.cells.slice(i,i+10).map(cellHtml).join('')+'</span></div>';}
    el.coViewer.innerHTML=rows;
    var gcPct=r.gc/r.dna.length*100;
    el.coLen.innerHTML=r.dna.length+'<small>nt</small>';el.coGC.innerHTML=gcPct.toFixed(1)+'<small>%</small>';el.coCAI.textContent=r.cai.toFixed(3);el.coRare.innerHTML=r.rare+'<small>flagged</small>';
    el.coBar.style.width=Math.min(gcPct,100)+'%';el.coBar.style.background=(gcPct>=40&&gcPct<=60)?'var(--co-hi)':((gcPct>=30&&gcPct<=70)?'var(--co-mid)':'var(--co-lo)');
  }
  el.coProtein.addEventListener('input',run);el.coSpecies.addEventListener('change',run);el.coMode.addEventListener('change',run);el.coStop.addEventListener('change',run);
  el.coExample.addEventListener('click',function(){el.coProtein.value=EXAMPLE;run();});
  el.coClear.addEventListener('click',function(){el.coProtein.value='';run();el.coProtein.focus();});
  el.coCopy.addEventListener('click',function(){if(!currentDna)return;var done=function(){el.coCopy.textContent='COPIED ✓';clearTimeout(el.coCopy._t);el.coCopy._t=setTimeout(function(){el.coCopy.textContent='COPY DNA';},1400);};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(currentDna).then(done,function(){});}else{var ta=document.createElement('textarea');ta.value=currentDna;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){}document.body.removeChild(ta);}});
  run();
})();
