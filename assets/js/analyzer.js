(function () {
  'use strict';

  const EXAMPLE_SEQ = 'ATGAAACCCGGGTTTTAAAAAAAAAATTTCCCGGGAAATTTGGGCCCAAAGGGAAACCCTTTTAAAGGGAAACCCGGGTTTTAAACCCGGGAAATTTCCCGGGAAA';

  function initAnalyzer(root) {
    const input   = root.querySelector('.seqInput');
    const lenEl   = root.querySelector('.seq-len');
    const typeEl  = root.querySelector('.seq-type-badge');
    const results = root.querySelector('.seq-results');
    const gcBar   = root.querySelector('.seq-gc-bar-fill');
    const exBtn   = root.querySelector('.seqExampleBtn');
    const clrBtn  = root.querySelector('.seqClearBtn');
    if (!input || !results) return;

    function clean(s) {
      return s.toUpperCase().replace(/[^ATGCUN\s]/g, '').replace(/\s/g, '');
    }

    function detectType(s) {
      if (!s.length) return '';
      const hasU = s.includes('U');
      const hasT = s.includes('T');
      if (hasU && !hasT) return 'RNA';
      if (!hasU && hasT) return 'DNA';
      return 'DNA/RNA';
    }

    function gcContent(s) {
      const gc = (s.match(/[GC]/g) || []).length;
      return s.length ? (gc / s.length) * 100 : 0;
    }

    function longestHomopolymer(s) {
      if (!s.length) return { base: '', len: 0 };
      let max = 1, cur = 1, maxBase = s[0];
      for (let i = 1; i < s.length; i++) {
        if (s[i] === s[i - 1]) { cur++; if (cur > max) { max = cur; maxBase = s[i]; } }
        else cur = 1;
      }
      return { base: maxBase, len: max };
    }

    function hasKozak(s) {
      // Consensus: (A/G)CCATGG or GCCACCATGG
      return /[AG]CC(A|ACC)ATG/i.test(s.slice(0, 60));
    }

    function hasPolyTSignal(s) {
      // TTTTTT+ termination signal (IVT concern)
      return /T{6,}/i.test(s);
    }

    function maxATWindow(s, w) {
      if (s.length < w) return 0;
      let maxAt = 0;
      for (let i = 0; i <= s.length - w; i++) {
        const win = s.slice(i, i + w);
        const at = (win.match(/[AT]/g) || []).length;
        maxAt = Math.max(maxAt, at);
      }
      return (maxAt / w) * 100;
    }

    function runChecks(raw) {
      const s = clean(raw);
      const len = s.length;
      const checks = [];
      if (!len) return null;

      const type  = detectType(s);
      const gc    = gcContent(s);
      const hp    = longestHomopolymer(s);
      const dna   = s.replace(/U/g, 'T');

      checks.push({ kind: 'summary', len, gc, type });

      // GC content
      if (len >= 20) {
        if (gc >= 40 && gc <= 65)
          checks.push({ id: 'DRC-001', kind: 'pass', name: 'GC content in range', detail: gc.toFixed(1) + '% (optimal 40–65%)' });
        else if (gc < 30 || gc > 75)
          checks.push({ id: 'DRC-001', kind: 'fail', name: 'GC content out of range', detail: gc.toFixed(1) + '% — synthesis vendors may reject sequences outside 30–75%' });
        else
          checks.push({ id: 'DRC-001', kind: 'warn', name: 'GC content marginal', detail: gc.toFixed(1) + '% — borderline; check vendor specs' });
      }

      // Homopolymer
      if (len >= 8) {
        if (hp.len >= 9)
          checks.push({ id: 'DRC-014', kind: 'fail', name: 'Homopolymer run detected', detail: hp.base + '×' + hp.len + ' — synthesis vendors reject runs ≥ 8 nt' });
        else if (hp.len >= 6)
          checks.push({ id: 'DRC-014', kind: 'warn', name: 'Homopolymer run (watch)', detail: hp.base + '×' + hp.len + ' — under threshold but worth monitoring' });
        else
          checks.push({ id: 'DRC-014', kind: 'pass', name: 'No long homopolymer runs', detail: 'Longest run: ' + hp.base + '×' + hp.len });
      }

      // Frame check
      if (len >= 9) {
        const rem = len % 3;
        if (rem === 0)
          checks.push({ id: 'DRC-020', kind: 'pass', name: 'Length divisible by 3', detail: Math.floor(len / 3) + ' complete codons' });
        else
          checks.push({ id: 'DRC-020', kind: 'warn', name: 'Length not divisible by 3', detail: rem + ' nt remainder — possible frameshift if this is a CDS' });
      }

      // Start codon
      if (len >= 3) {
        if (dna.startsWith('ATG'))
          checks.push({ id: 'DRC-022', kind: 'pass', name: 'ATG start codon present', detail: 'Found at position 1' });
        else
          checks.push({ id: 'DRC-022', kind: 'info', name: 'No ATG at position 1', detail: 'Not required for UTRs, probes, or non-coding constructs' });
      }

      // Kozak context
      if (len >= 10 && dna.includes('ATG')) {
        if (hasKozak(dna))
          checks.push({ id: 'DRC-023', kind: 'pass', name: 'Kozak context detected', detail: '(A/G)CCATGG pattern found near start — favourable translation initiation' });
        else
          checks.push({ id: 'DRC-023', kind: 'info', name: 'Kozak context not detected', detail: 'Consider adding GCCACC before ATG to improve translation efficiency' });
      }

      // Poly-T (IVT terminator signal)
      if (len >= 20 && hasPolyTSignal(dna))
        checks.push({ id: 'DRC-031', kind: 'warn', name: 'Poly-T run detected', detail: 'T×6+ found — may cause early termination in IVT or pol III transcription' });

      // AT-rich window
      if (len >= 20) {
        const atPct = maxATWindow(dna, 20);
        if (atPct >= 85)
          checks.push({ id: 'DRC-032', kind: 'warn', name: 'AT-rich window', detail: atPct.toFixed(0) + '% AT in a 20 nt window — may affect synthesis fidelity' });
      }

      // Length info
      if (len < 15)
        checks.push({ id: 'DRC-003', kind: 'info', name: 'Short sequence', detail: len + ' nt — some checks require ≥ 15 nt for reliable results' });
      else
        checks.push({ id: 'DRC-003', kind: 'pass', name: 'Sequence length adequate', detail: len + ' nt — sufficient for full analysis' });

      return checks;
    }

    function renderSummary(check, gc) {
      const div = document.createElement('div');
      div.className = 'seq-summary';
      const gcPct = gc.toFixed(1);
      const gcColor = gc < 30 || gc > 75 ? '#ff6b6b' : gc < 40 || gc > 65 ? '#f59e0b' : 'var(--accent)';
      div.innerHTML =
        '<div class="seq-stat"><span class="seq-stat-val">' + check.len + ' nt</span><span class="seq-stat-lbl">Length</span></div>' +
        '<div class="seq-stat">' +
          '<span class="seq-stat-val" style="color:' + gcColor + '">' + gcPct + '%</span>' +
          '<span class="seq-stat-lbl">GC Content</span>' +
          '<div class="seq-gc-bar"><div class="seq-gc-bar-fill" style="width:' + Math.min(gc, 100).toFixed(1) + '%;background:' + gcColor + '"></div></div>' +
        '</div>' +
        '<div class="seq-stat"><span class="seq-stat-val">' + check.type + '</span><span class="seq-stat-lbl">Type</span></div>' +
        '<div class="seq-stat"><span class="seq-stat-val">' + Math.floor(check.len / 3) + '</span><span class="seq-stat-lbl">Codons</span></div>';
      return div;
    }

    function renderCheck(check) {
      if (check.kind === 'summary') return null;
      const div = document.createElement('div');
      div.className = 'seq-check ' + check.kind;
      const icons = { pass: '✓', warn: '⚠', fail: '✕', info: 'i' };
      div.innerHTML =
        '<span class="seq-check-id mono">' + check.id + '</span>' +
        '<div class="seq-check-inner">' +
          '<span class="seq-check-name">' + check.name + '</span>' +
          (check.detail ? '<span class="seq-check-detail mono">' + check.detail + '</span>' : '') +
        '</div>' +
        '<span class="seq-badge ' + check.kind + '">' + (icons[check.kind] || check.kind).toUpperCase() + '</span>';
      return div;
    }

    let debounceTimer;
    function analyze() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const raw = input.value;
        const s   = clean(raw);
        const len = s.length;

        if (lenEl)  lenEl.textContent = len + ' nt';
        if (typeEl) {
          const type = detectType(s);
          typeEl.textContent = type;
          typeEl.classList.toggle('visible', !!type);
        }

        while (results.firstChild) results.removeChild(results.firstChild);

        if (!len) {
          const empty = document.createElement('div');
          empty.className = 'seq-results-empty mono';
          empty.innerHTML = '<span>Paste a sequence above — checks fire instantly.</span>';
          results.appendChild(empty);
          return;
        }

        const checks = runChecks(raw);
        if (!checks) return;

        checks.forEach((check, i) => {
          if (check.kind === 'summary') {
            const el = renderSummary(check, check.gc);
            results.appendChild(el);
          } else {
            const el = renderCheck(check);
            if (el) {
              el.style.animationDelay = (i * 50) + 'ms';
              results.appendChild(el);
            }
          }
        });
      }, 150);
    }

    input.addEventListener('input', analyze);
    if (exBtn) exBtn.addEventListener('click', () => { input.value = EXAMPLE_SEQ; analyze(); input.focus(); });
    if (clrBtn) clrBtn.addEventListener('click', () => { input.value = ''; analyze(); input.focus(); });
  }

  // Init all analyzer instances on the page
  document.querySelectorAll('.seq-analyzer').forEach(initAnalyzer);
})();
