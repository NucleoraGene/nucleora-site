(function(){
  var root=document.getElementById('mrna-builder');
  if(!root||root.dataset.mbInit)return;root.dataset.mbInit='1';
  var $=function(s){return root.querySelector(s);};
  var MONO="ui-monospace,SFMono-Regular,Menlo,monospace";
  var C={cap:'#a78bfa',u5:'#7dd3fc',koz:'#fbbf24',cds:'#2dd4bf',u3:'#fb7185',pa:'#818cf8'};
  var CAPS={m7g:{n:'m7G',f:'m7G(5′)ppp(5′)G — Cap 0',eff:75,note:'Post-transcriptional capping. Cap 0 retains innate immune signal.'},arca:{n:'ARCA',f:'3′-O-Me-m7G(5′)ppp(5′)G',eff:85,note:'Anti-reverse cap analog — co-transcriptional, correct orientation, Cap 0.'},clean:{n:'CleanCap',f:'CleanCap AG — Cap 1',eff:94,note:'Co-transcriptional Cap 1. Highest efficiency, lowest RIG-I activation.'}};
  var KOZ={strong:{s:'GCCACCAUGG',l:'STRONG',n:'−3 A ✓ · +4 G ✓',ok:2},medium:{s:'GCCUCCAUGG',l:'MEDIUM',n:'−3 U ✗ · +4 G ✓',ok:1},weak:{s:'GCCUCCAUGU',l:'WEAK',n:'−3 U ✗ · +4 U ✗',ok:0},none:{s:'AUG',l:'NONE',n:'bare start codon — leaky scanning',ok:0}};
  var U3={aes:{n:'AES+mtRNR1',len:158,s:10,note:'Amino-terminal enhancer of split + 12S mt-rRNA — best-in-class stability.'},hbb:{n:'HBB 3′UTR',len:132,s:8,note:'Human β-globin 3′ UTR — classic, well characterised.'},custom:{n:'Custom',len:120,s:5,note:'User-supplied 3′ UTR — no stability prior.'}};
  var U5P={hag:'ACUCUUCUGGUCCCCACAGACUCAGAGAGAACCCACC',hbb:'ACAUUUGCUUCUGACACAACUGUGUUCACUAGCAACCUCAAACAGACACC',min:'GGGAAAUAAGAGAGAAAAGAAGAGUAAGAAGAAAUAUAAGA'};
  var PA=[0,80,100,120,150];
  var st={cap:'clean',u5:U5P.hag,koz:'strong',cds:'',u3:'aes',u3n:120,pa:3};
  var scrub=function(s){return(s||'').toUpperCase().replace(/T/g,'U').replace(/[^ACGU]/g,'');};
  var pct=function(s){return s.length?Math.round(((s.match(/[GC]/g)||[]).length/s.length)*100):0;};
  var num=function(n){return n.toLocaleString('en-US');};
  function dG(s){s=s.slice(0,80);if(!s.length)return 0;var gc=(s.match(/[GC]/g)||[]).length,au=s.length-gc;return-(gc*0.33+au*0.095)*(0.6+0.8*(gc/s.length));}
  function fit(t,px,fs){var m=Math.floor(px/(fs*0.605));return t.length<=m?t:(m>1?t.slice(0,m-1)+'…':'');}
  function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function model(){
    var k=KOZ[st.koz],u3=U3[st.u3],u3l=st.u3==='custom'?st.u3n:u3.len,pa=PA[st.pa],cds=st.cds.length||1200,ph=!st.cds.length,g=dG(st.u5+k.s);
    var segs=[
      {id:'cap',nm:'5′ CAP',v:CAPS[st.cap].n,nt:0,w:7.6,c:C.cap,d:'<b>5′ Cap</b> · '+CAPS[st.cap].f+' · <em>'+CAPS[st.cap].eff+'%</em> capping · '+CAPS[st.cap].note},
      {id:'u5',nm:'5′ UTR',v:pct(st.u5)+'% GC',nt:st.u5.length,c:C.u5,d:'<b>5′ UTR</b> · '+st.u5.length+' nt · '+pct(st.u5)+'% GC · ΔG ≈ <em>'+g.toFixed(1)+'</em> kcal/mol'},
      {id:'koz',nm:'KOZAK',v:k.s,nt:k.s.length,c:C.koz,d:'<b>Kozak</b> · '+k.s+' · '+k.l+' · '+k.n},
      {id:'cds',nm:'CDS',v:ph?'YOUR CDS':num(cds)+' nt',nt:cds,c:C.cds,d:ph?'<b>CDS</b> · <em>placeholder 1,200 nt</em>':'<b>CDS</b> · '+num(cds)+' nt · '+num(Math.floor(cds/3))+' codons · '+pct(st.cds)+'% GC'+(cds%3?' · <em>not a multiple of 3</em>':'')},
      {id:'u3',nm:'3′ UTR',v:u3.n,nt:u3l,c:C.u3,d:'<b>3′ UTR</b> · '+u3.n+' · '+u3l+' nt · '+u3.note},
      {id:'pa',nm:'POLY(A)',v:pa?'A×'+pa:'none',nt:pa,c:C.pa,pat:'url(#mbPA)',d:pa?'<b>Poly(A)</b> · '+pa+' nt'+(pa>=100?' · optimal expression window':''):'<b>Poly(A)</b> · <em>absent</em>'}
    ];
    var tot=st.u5.length+(k.s.length-3)+cds+u3l+pa;
    return{segs:segs,k:k,u3:u3,u3l:u3l,pa:pa,cds:cds,ph:ph,g:g,tot:tot,eff:CAPS[st.cap].eff};
  }
  function draw(m){
    var W=1000,P=26,G=6,y=72,h=54,s,i,tw=0,o='',ax='',cum=0;
    for(i=0;i<m.segs.length;i++){s=m.segs[i];s.w=s.w||Math.min(Math.max(Math.sqrt(s.nt),7),42);tw+=s.w;}
    var unit=(W-P*2-G*(m.segs.length-1))/tw,x=P;
    o+='<defs><pattern id="mbPA" width="11" height="11" patternUnits="userSpaceOnUse"><text x="1.5" y="8.5" font-family="'+MONO+'" font-size="8" fill="'+C.pa+'" fill-opacity=".4">A</text></pattern><pattern id="mbCD" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="1" height="9" fill="'+C.cds+'" fill-opacity=".22"/></pattern><linearGradient id="mbSh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".085"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
    o+='<text x="4" y="'+(y+h/2+4)+'" font-family="'+MONO+'" font-size="11" fill="'+C.cap+'" fill-opacity=".8">5′</text><text x="'+(W-4)+'" y="'+(y+h/2+4)+'" text-anchor="end" font-family="'+MONO+'" font-size="11" fill="'+C.pa+'" fill-opacity=".8">3′</text>';
    for(i=0;i<m.segs.length;i++){
      s=m.segs[i];var w=s.w*unit,cx=x+w/2,fs=w>150?12:w>95?10.5:9.5;
      o+='<g class="mb-seg" data-id="'+s.id+'" tabindex="0" role="button" aria-label="'+s.nm+'">';
      o+='<rect class="b" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="'+s.c+'" fill-opacity=".17" stroke="'+s.c+'" stroke-opacity=".55"/>';
      if(s.id==='cds')o+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="url(#mbCD)"/>';
      if(s.pat&&s.nt)o+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="'+s.pat+'"/>';
      o+='<rect x="'+(x+1)+'" y="'+(y+1)+'" width="'+(w-2)+'" height="'+(h/2)+'" rx="4" fill="url(#mbSh)" pointer-events="none"/>';
      o+='<text x="'+cx+'" y="'+(y-13)+'" text-anchor="middle" font-family="'+MONO+'" font-size="9" letter-spacing="1.4" fill="'+s.c+'" fill-opacity=".92">'+fit(s.nm,w,9)+'</text>';
      o+='<text x="'+cx+'" y="'+(y+h/2+4)+'" text-anchor="middle" font-family="'+MONO+'" font-size="'+fs+'" fill="#e8edf3" fill-opacity=".92" pointer-events="none">'+esc(fit(s.v,w-8,fs))+'</text>';
      o+='<text x="'+cx+'" y="'+(y+h+18)+'" text-anchor="middle" font-family="'+MONO+'" font-size="10" fill="#6b7f96">'+(s.nt?num(s.nt)+' nt':'analog')+'</text></g>';
      if(i)o+='<line x1="'+(x-G)+'" y1="'+(y+h/2)+'" x2="'+x+'" y2="'+(y+h/2)+'" stroke="rgba(255,255,255,.16)" stroke-width="1.5"/>';
      ax+='<line x1="'+x+'" y1="153" x2="'+x+'" y2="159" stroke="rgba(255,255,255,.2)"/><text x="'+x+'" y="172" text-anchor="middle" font-family="'+MONO+'" font-size="8.5" fill="#6b7f96" fill-opacity=".8">'+(s.id==='cap'?'cap':num(cum))+'</text>';
      if(s.id!=='cap')cum+=(s.id==='koz'?s.nt-3:s.nt);x+=w+G;
    }
    ax+='<line x1="'+(x-G)+'" y1="153" x2="'+(x-G)+'" y2="159" stroke="rgba(255,255,255,.2)"/><text x="'+(x-G)+'" y="172" text-anchor="end" font-family="'+MONO+'" font-size="8.5" fill="'+C.pa+'" fill-opacity=".85">'+num(m.tot)+'</text>';
    o+='<line x1="'+P+'" y1="153" x2="'+(x-G)+'" y2="153" stroke="rgba(255,255,255,.09)"/>'+ax;
    $('#mbSvg').innerHTML=o;
  }
  function grade(m,ch){
    var sc={0:-40,80:5,100:10,120:10,150:5}[m.pa]+m.u3.s+(m.eff>=94?10:m.eff>=85?7:4)+[0,3,6][m.k.ok]+(Math.abs(m.g)>15?-6:0);
    var g=sc>=32?'A':sc>=24?'B':'C';if(ch.indexOf('fail')>-1)g='C';else if(ch.indexOf('warn')>-1&&g==='A')g='B';
    var why=m.pa===0?'no poly(A)':m.k.ok===0?'sub-consensus Kozak':Math.abs(m.g)>15?'structured 5′ UTR':(m.pa<100||m.pa>130)?'poly(A) outside 100–130 nt':m.eff<85?'Cap 0 chemistry':st.u3==='custom'?'unvalidated 3′ UTR':'all inputs nominal';
    return{g:g,c:g==='A'?'var(--mb-ac)':g==='B'?'#7dd3fc':'var(--mb-am)',why:why,sc:Math.max(0,sc)};
  }
  function rule(el,state,det,txt){el.className='mb-rule '+state;el.querySelector('.mb-rd').textContent=det;var b=el.querySelector('.mb-bg');b.className='mb-bg '+state;b.textContent=txt;}
  function render(){
    var m=model(),k=m.k,structured=Math.abs(m.g)>15,BG={pass:'PASS',warn:'CHECK',fail:'FAIL'};
    var ch=[k.ok===2?'pass':k.ok===1?'warn':'fail',m.pa===0?'fail':(m.pa>=100&&m.pa<=130)?'pass':'warn',structured?'warn':'pass'],gr=grade(m,ch);
    draw(m);
    $('#mbReadout').innerHTML=m.segs[0].d;
    root.querySelectorAll('[data-cap]').forEach(function(b){b.classList.toggle('on',b.dataset.cap===st.cap);});
    $('#mbCapEff').textContent=CAPS[st.cap].eff+'%';$('#mbCapHint').textContent=CAPS[st.cap].f;
    $('#mbU5Len').textContent=st.u5.length+' NT';$('#mbU5Hint').innerHTML=pct(st.u5)+'% GC · ΔG ≈ <b>'+m.g.toFixed(1)+'</b> kcal/mol · '+(st.u5.length<15?'<span class="k">too short</span>':structured?'<span class="k">structured — may impede scanning</span>':'low structure ✓');
    $('#mbKozLen').textContent=k.l;$('#mbKozHint').innerHTML=k.s.replace('AUG','<b class="k">AUG</b>')+' · '+k.n;
    $('#mbU3Len').textContent=m.u3l+' NT';$('#mbU3Hint').textContent=m.u3.note;$('#mbU3n').hidden=st.u3!=='custom';
    $('#mbPa').style.setProperty('--p',(st.pa/4*100)+'%');$('#mbPaLen').textContent=m.pa+' NT';
    $('#mbPaHint').innerHTML=m.pa===0?'<span class="k">absent — not translatable in practice</span>':m.pa<100?'short tail — faster deadenylation':m.pa>130?'long — <span class="k">template instability risk</span>':'optimal window ✓';
    root.querySelectorAll('#mbPaTicks span').forEach(function(t,i){t.innerHTML=i===st.pa?'<b>'+PA[i]+'</b>':PA[i];});
    $('#mbCdsTag').textContent=m.ph?'PLACEHOLDER':num(Math.floor(m.cds/3))+' CODONS';$('#mbCdsRO').value=m.ph?'YOUR CDS (paste in panel below)':num(m.cds)+' nt · '+pct(st.cds)+'% GC';
    $('#mbCdsHint').innerHTML=m.ph?'Modelled at 1,200 nt until a sequence is supplied.':(m.cds%3?'<span class="k">Not a multiple of 3 — out of frame.</span>':'In frame · '+num(Math.floor(m.cds/3))+' codons.');
    $('#mbTot').innerHTML=num(m.tot)+'<u>nt</u>';$('#mbTotSub').textContent='cap+'+st.u5.length+'+'+(k.s.length-3)+'+'+num(m.cds)+'+'+m.u3l+'+'+m.pa+(m.ph?' (CDS assumed)':'');
    $('#mbDg').innerHTML=m.g.toFixed(1)+'<u>kcal/mol</u>';$('#mbDg').style.color=structured?'var(--mb-am)':'var(--mb-ac)';$('#mbDgSub').textContent=structured?'above −15 kcal/mol — refold advised':'within −15 kcal/mol ✓';
    $('#mbGrade').textContent=gr.g;$('#mbGrade').style.color=gr.c;$('#mbGradeU').textContent='score '+gr.sc+'/36';$('#mbGradeSub').textContent='Driver: '+gr.why;
    $('#mbEff').innerHTML=m.eff+'<u>%</u>';$('#mbEffSub').textContent=CAPS[st.cap].n+' · '+(m.eff>=90?'Cap 1, co-transcriptional':m.eff>=85?'Cap 0, co-transcriptional':'Cap 0, enzymatic step');
    rule($('#mbR1'),ch[0],k.s+' · '+k.n,BG[ch[0]]);rule($('#mbR2'),ch[1],m.pa+' nt · target 100–130 nt',BG[ch[1]]);rule($('#mbR3'),ch[2],'ΔG '+m.g.toFixed(1)+' kcal/mol · threshold −15',BG[ch[2]]);
    var pass=root.querySelectorAll('.mb-rule.pass').length;$('#mbDrcSum').textContent=pass+' / 3 PASS';$('#mbDrcSum').style.color=pass===3?'var(--mb-ac)':'var(--mb-am)';
  }
  function focusSeg(id){var m=model(),i;for(i=0;i<m.segs.length;i++)if(m.segs[i].id===id)$('#mbReadout').innerHTML=m.segs[i].d;root.querySelectorAll('.mb-seg').forEach(function(g){g.classList.toggle('on',g.dataset.id===id);});root.querySelectorAll('.mb-ctrl').forEach(function(c){c.classList.toggle('on',c.dataset.seg===id);});}
  $('#mbSvg').addEventListener('mouseover',function(e){var g=e.target.closest('.mb-seg');if(g)focusSeg(g.dataset.id);});
  $('#mbSvg').addEventListener('focusin',function(e){var g=e.target.closest('.mb-seg');if(g)focusSeg(g.dataset.id);});
  root.addEventListener('click',function(e){var b=e.target.closest('[data-cap]'),p=e.target.closest('[data-u5]');if(b){st.cap=b.dataset.cap;render();}if(p){st.u5=U5P[p.dataset.u5];$('#mbU5').value=st.u5;render();}});
  $('#mbU5').addEventListener('input',function(){st.u5=scrub(this.value);render();});$('#mbU5').addEventListener('blur',function(){this.value=st.u5;});
  $('#mbCds').addEventListener('input',function(){st.cds=scrub(this.value);render();});
  $('#mbKoz').addEventListener('change',function(){st.koz=this.value;render();});$('#mbU3').addEventListener('change',function(){st.u3=this.value;render();});
  $('#mbU3n').addEventListener('input',function(){st.u3n=Math.min(400,Math.max(40,+this.value||120));render();});$('#mbPa').addEventListener('input',function(){st.pa=+this.value;render();});
  $('#mbU5').value=st.u5;render();
})();
