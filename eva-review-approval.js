/**
 * EVA Review & Approval — Google Sheet is the single source of truth.
 * Deploy google-apps-script/ReviewApproval.gs and set RA_SCRIPT_URL to your /exec URL.
 */
(function (global) {
  'use strict';

  var RA_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbyQD9vVaArp5F4xv9kDcgFM4dXDnLx3WYNOEBFOXO2y9x1P9vxg1lBWpWWpEkGgz7pz/exec';

  var RA_SLOTS = [
    { c: 'pm', s: 'main', lbl: 'Project Manager', prefix: null },
    { c: 'mep', s: 'main', lbl: 'MEP Section Head', prefix: null },
    { c: 'dd', s: 'hvac', lbl: 'Design Dept — HVAC', prefix: 'HVAC: ' },
    { c: 'dd', s: 'plumb', lbl: 'Design Dept — Plumbing', prefix: 'Plumb: ' },
    { c: 'fm', s: 'main', lbl: 'Facility Management', prefix: null },
    { c: 'cr', s: 'main', lbl: 'Client Representative', prefix: null }
  ];

  var RA_DECISION_LABELS = {
    approved: 'Approved',
    comments: 'With Comments',
    rejected: 'Rejected'
  };

  var RA_DECISION_COLORS = {
    approved: '#1e7e34',
    comments: '#e65100',
    rejected: '#c5221f'
  };

  var RA_DECISION_BG = {
    approved: '#e6f4ea',
    comments: '#fff3e0',
    rejected: '#fce8e6'
  };

  var RA_DECISION_BORDER = {
    approved: '#34a853',
    comments: '#fbbc04',
    rejected: '#ea4335'
  };

  /* ── HARDCODED APPROVED RECORDS ─────────────────────────────────────────
     These 5 approvals are permanently embedded in the portal.
     The Client Representative (cr_main) stays live for Mr. Sultan CEO.
  ──────────────────────────────────────────────────────────────────────── */
  var RA_HARDCODED = [
    { category: 'pm',  subtab: 'main',  name: 'Wassib Ullah',
      designation: 'Project Manager',             department: 'IHCC-Operations',
      decision: 'approved',  comment: '',  timestamp: '17 Jun 2026, 15:54' },
    { category: 'dd',  subtab: 'hvac',  name: 'Qasim Shahzad',
      designation: 'Section Head HVAC',           department: 'Mechanical',
      decision: 'approved',  comment: '',  timestamp: '18 Jun 2026, 15:55' },
    { category: 'dd',  subtab: 'plumb', name: 'Rehan Ahmad',
      designation: 'Section Head Plumbing & Fire', department: '3C-Design',
      decision: 'approved',  comment: '',  timestamp: '21 Jun 2026, 00:46' },
    { category: 'mep', subtab: 'main',  name: 'Talal AL Manasir',
      designation: 'Head of MEP',                 department: 'MEP Business unit',
      decision: 'approved',  comment: '',  timestamp: '25 Jun 2026, 16:57' },
    { category: 'fm',  subtab: 'main',  name: 'Muhammad Ibrahim',
      designation: 'Senior Engineer Maintenance', department: 'Facilities Management',
      decision: 'comments',
      comment: 'I have completed my initial review and would like to provide my preliminary approval of the portal structure, navigation, and overall layout. The portal is well organized and provides a good foundation for the final handover.\n\nMy observations are as follows:\n\n* Several reports and supporting documents are still pending upload.\n* Warranty certificates for the installed equipment are yet to be added.\n* Some Testing & Commissioning (T&C) forms and pre-commissioning checklists are still marked as Pending and should be completed before final submission.\n\nOnce the above documents are uploaded and all pending items are completed, I will be pleased to provide my final approval.',
      timestamp: '09 Jul 2026, 13:58' }
  ];

  /* Pre-seed records so locked forms show instantly without waiting for server */
  var _seedRecords = {};
  RA_HARDCODED.forEach(function (row) {
    _seedRecords[row.category + '_' + row.subtab] = row;
  });

  global.RA_STATE = {
    masterLocked: false,
    lockedAt: '',
    records: _seedRecords,
    loaded: true,
    syncing: false
  };

  function raSlotKey(c, s) {
    return c + '_' + s;
  }

  function raStorageKey(c, s) {
    return 'ra_lock_' + c + '_' + s;
  }

  function raNormalizeStatus(data) {
    if (Array.isArray(data)) {
      return { masterLocked: false, lockedAt: '', records: data };
    }
    return {
      masterLocked: !!(data && data.masterLocked),
      lockedAt: (data && data.lockedAt) || '',
      records: (data && data.records) || []
    };
  }

  function raApplyStatus(status) {
    var normalized = raNormalizeStatus(status);
    global.RA_STATE.masterLocked = normalized.masterLocked;
    global.RA_STATE.lockedAt = normalized.lockedAt;

    /* Always re-seed hardcoded records first so they survive every sync */
    global.RA_STATE.records = {};
    RA_HARDCODED.forEach(function (row) {
      global.RA_STATE.records[row.category + '_' + row.subtab] = row;
    });

    (normalized.records || []).forEach(function (row) {
      if (!row || !row.category || !row.subtab) return;
      var key = raSlotKey(row.category, row.subtab);
      global.RA_STATE.records[key] = row;
      try {
        localStorage.setItem(raStorageKey(row.category, row.subtab), JSON.stringify(row));
      } catch (e) {}
    });

    if (normalized.masterLocked) {
      try {
        localStorage.setItem('ra_master_locked', '1');
        if (normalized.lockedAt) localStorage.setItem('ra_master_locked_at', normalized.lockedAt);
      } catch (e) {}
    }

    global.RA_STATE.loaded = true;
  }

  function raFetchStatus() {
    if (!RA_SCRIPT_URL || RA_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL') {
      return Promise.reject(new Error('Approval backend not configured'));
    }

    return fetch(RA_SCRIPT_URL + '?action=getStatus', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .catch(function () {
        return fetch(RA_SCRIPT_URL + '?action=getAll', { cache: 'no-store' }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        });
      });
  }

  function raSyncFromSheet(done) {
    if (global.RA_STATE.syncing) {
      if (done) setTimeout(function () { raSyncFromSheet(done); }, 200);
      return;
    }
    global.RA_STATE.syncing = true;

    raFetchStatus()
      .then(function (data) {
        raApplyStatus(data);
        raRefreshPg3Status();
        raApplyMasterLockUI();
        if (done) done(null, data);
      })
      .catch(function (err) {
        console.warn('Approval sync failed — using cached data if available', err);
        RA_SLOTS.forEach(function (slot) {
          var cached = null;
          try {
            var raw = localStorage.getItem(raStorageKey(slot.c, slot.s));
            if (raw) cached = JSON.parse(raw);
          } catch (e) {}
          if (cached) global.RA_STATE.records[raSlotKey(slot.c, slot.s)] = cached;
        });
        try {
          global.RA_STATE.masterLocked = localStorage.getItem('ra_master_locked') === '1';
          global.RA_STATE.lockedAt = localStorage.getItem('ra_master_locked_at') || '';
        } catch (e) {}
        global.RA_STATE.loaded = true;
        raRefreshPg3Status();
        raApplyMasterLockUI();
        if (done) done(err);
      })
      .finally(function () {
        global.RA_STATE.syncing = false;
      });
  }

  function raGetLock(c, s) {
    var key = raSlotKey(c, s);
    if (global.RA_STATE.records[key]) return global.RA_STATE.records[key];
    try {
      var raw = localStorage.getItem(raStorageKey(c, s));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function raCompleteCount() {
    var n = 0;
    RA_SLOTS.forEach(function (slot) {
      if (raGetLock(slot.c, slot.s)) n++;
    });
    return n;
  }

  function raPillText(slot, lock) {
    var prefix = slot.prefix || '';
    if (!lock || !lock.decision) return prefix + 'Pending';
    return prefix + (RA_DECISION_LABELS[lock.decision] || lock.decision);
  }

  function raStylePill(el, lock) {
    if (!el) return;
    if (!lock || !lock.decision) {
      el.style.background = '#f0f0f0';
      el.style.color = '#666';
      return;
    }
    el.style.background = RA_DECISION_BG[lock.decision] || '#f0f0f0';
    el.style.color = RA_DECISION_COLORS[lock.decision] || '#666';
  }

  function raUpdateLandingPills() {
    RA_SLOTS.forEach(function (slot) {
      var pill = document.getElementById('ra_pill_' + slot.c + '_' + slot.s);
      if (!pill) return;
      var lock = raGetLock(slot.c, slot.s);
      pill.textContent = raPillText(slot, lock);
      raStylePill(pill, lock);
    });
  }

  function raRefreshPg3Status() {
    var progress = document.getElementById('ra_pg3_progress');
    var btn = document.getElementById('pg3-review-btn');
    var circle = document.getElementById('ra_pg3_circle');
    var count = raCompleteCount();
    var total = RA_SLOTS.length;

    if (progress) {
      if (!global.RA_STATE.loaded && !global.RA_STATE.syncing) {
        progress.textContent = 'Open to load approval status';
      } else if (global.RA_STATE.masterLocked) {
        progress.textContent = total + '/' + total + ' complete — permanently locked';
        progress.classList.add('is-complete');
      } else {
        progress.textContent = count + '/' + total + ' reviewers submitted';
        progress.classList.toggle('is-complete', count === total);
      }
    }

    if (btn) btn.classList.toggle('is-master-locked', global.RA_STATE.masterLocked);
    if (circle && global.RA_STATE.masterLocked) {
      circle.style.borderColor = 'rgba(52,168,83,0.9)';
      circle.style.background = 'rgba(52,168,83,0.18)';
    }
  }

  function raApplyMasterLockUI() {
    var banner = document.getElementById('ra_master_banner');
    if (banner) {
      if (global.RA_STATE.masterLocked) {
        banner.style.display = 'block';
        banner.innerHTML =
          '<strong>All 6 approvals complete — permanently locked.</strong>' +
          (global.RA_STATE.lockedAt ? ' Locked on ' + global.RA_STATE.lockedAt + '.' : '') +
          ' Decisions cannot be changed. This record is kept for future reference.';
      } else {
        banner.style.display = 'none';
        banner.innerHTML = '';
      }
    }

    document.querySelectorAll('.ra-submit').forEach(function (btn) {
      if (global.RA_STATE.masterLocked) {
        btn.disabled = true;
        btn.style.opacity = '0.45';
        btn.style.cursor = 'not-allowed';
      }
    });
  }

  function raLoadLanding() {
    if (typeof siGoTo === 'function') siGoTo('pg_ra_land');
    /* Show pills instantly from hardcoded data */
    raUpdateLandingPills();
    raApplyMasterLockUI();
    /* Then sync in background to pick up any new submission (CR) */
    raSyncFromSheet(function () {
      raUpdateLandingPills();
      raApplyMasterLockUI();
    });
  }

  function raBackToLanding() {
    if (typeof siGoTo === 'function') siGoTo('pg_ra_land');
    raSyncFromSheet(function () {
      raUpdateLandingPills();
      raApplyMasterLockUI();
    });
  }

  function raGoForm(sid, c, s) {
    if (typeof siGoTo === 'function') siGoTo(sid);
    /* Render immediately from hardcoded data */
    raRenderForm(c, s);
    raApplyMasterLockUI();
    /* Only sync server for CR (Client Rep) — all others are hardcoded and locked */
    if (c === 'cr') {
      raSyncFromSheet(function () {
        raRenderForm(c, s);
        raApplyMasterLockUI();
      });
    }
  }

  function raRenderForm(c, s) {
    var lock = raGetLock(c, s);
    var fd = document.getElementById('ra_form_' + c + '_' + s);
    var ld = document.getElementById('ra_locked_' + c + '_' + s);
    if (!fd) return;

    if (lock) {
      fd.style.display = 'none';
      if (ld) {
        ld.style.display = 'block';
        var q = function (id) {
          return document.getElementById(id);
        };
        var ln = q('ra_ln_' + c + '_' + s);
        if (ln) ln.textContent = lock.name || '—';
        var ld2 = q('ra_ld_' + c + '_' + s);
        if (ld2) ld2.textContent = lock.designation || '—';
        var le = q('ra_le_' + c + '_' + s);
        if (le) le.textContent = lock.department || '—';
        var lt = q('ra_lt_' + c + '_' + s);
        if (lt) lt.textContent = lock.timestamp || '—';
        var dd = q('ra_ldec_' + c + '_' + s);
        if (dd) {
          var dec = lock.decision;
          dd.style.background = RA_DECISION_BG[dec] || '#f5f5f5';
          dd.style.borderColor = RA_DECISION_BORDER[dec] || '#ddd';
          var dl = dd.querySelector('.ra-ldec-lbl');
          if (dl) {
            var icons = { approved: '✓ Approved', comments: '💬 Approved with Comments', rejected: '✗ Rejected' };
            dl.textContent = icons[dec] || dec;
            dl.style.color = RA_DECISION_COLORS[dec] || '#555';
          }
          var dc = dd.querySelector('.ra-ldec-cmt');
          if (dc) {
            var cmt = lock.comment || 'No comments.';
            dc.innerHTML = cmt
              .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/\n/g, '<br>');
          }
        }
      }
    } else {
      if (global.RA_STATE.masterLocked) {
        fd.style.display = 'none';
        if (ld) ld.style.display = 'block';
      } else {
        fd.style.display = 'block';
        if (ld) ld.style.display = 'none';
      }
    }
  }

  function raSelectDec(c, s, dec) {
    if (global.RA_STATE.masterLocked || raGetLock(c, s)) return;
    ['approved', 'comments', 'rejected'].forEach(function (d) {
      var b = document.getElementById('ra_dec_' + d + '_' + c + '_' + s);
      if (b) b.classList.toggle('ra-dec-sel', d === dec);
    });
    var cb = document.getElementById('ra_cb_' + c + '_' + s);
    if (cb) cb.style.display = dec === 'comments' || dec === 'rejected' ? 'block' : 'none';
    var fd = document.getElementById('ra_form_' + c + '_' + s);
    if (fd) fd.dataset.decision = dec;
  }

  function raSubmit(c, s) {
    if (global.RA_STATE.masterLocked) {
      alert('All 6 approvals are complete. This module is permanently locked.');
      return;
    }
    if (raGetLock(c, s)) {
      alert('This role has already submitted a decision. It cannot be changed.');
      return;
    }

    var g = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    var name = g('ra_name_' + c + '_' + s);
    var desig = g('ra_desig_' + c + '_' + s);
    var dept = g('ra_dept_' + c + '_' + s);
    var comment = g('ra_comment_' + c + '_' + s);
    var fd = document.getElementById('ra_form_' + c + '_' + s);
    var dec = fd ? fd.dataset.decision : '';

    if (!name || !desig || !dept) {
      alert('Please fill Name, Designation and Department.');
      return;
    }
    if (!dec) {
      alert('Please select a decision: Approved, With Comments, or Rejected.');
      return;
    }
    if ((dec === 'comments' || dec === 'rejected') && !comment) {
      alert('Please write your comments or rejection reason.');
      return;
    }

    var ts = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    var payload = {
      action: 'submit',
      category: c,
      subtab: s,
      name: name,
      designation: desig,
      department: dept,
      decision: dec,
      comment: comment,
      timestamp: ts
    };

    var submitBtn = fd ? fd.querySelector('.ra-submit') : null;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving to server…';
    }

    fetch(RA_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (res && res.ok === false) throw new Error(res.error || 'Save rejected');
        if (res && res.status) {
          raApplyStatus(res.status);
          return null;
        }
        return raFetchStatus();
      })
      .then(function (data) {
        if (data) raApplyStatus(data);
        raRenderForm(c, s);
        raUpdateLandingPills();
        raRefreshPg3Status();
        raApplyMasterLockUI();
        if (global.RA_STATE.masterLocked) {
          alert('Your decision is saved. All 6 reviewers have now completed — approvals are permanently locked.');
        } else {
          alert('Your decision was saved successfully. It is now visible to all reviewers.');
        }
      })
      .catch(function (err) {
        console.error('Approval submit failed', err);
        alert(
          'Could not save to the approval server. Please check your internet connection and try again.\n\n' +
            (err && err.message ? err.message : '')
        );
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = global.RA_STATE.masterLocked;
          submitBtn.textContent = 'Submit Decision';
        }
      });
  }

  function raSummaryLoad() {
    if (typeof siGoTo === 'function') siGoTo('pg_ra_summary');
    raSyncFromSheet(function () {
      raRenderSummary();
    });
  }

  function raRenderSummary() {
    var cats = RA_SLOTS.map(function (slot) {
      return { c: slot.c, s: slot.s, lbl: slot.lbl };
    });
    var cont = document.getElementById('ra_sum_rows');
    if (!cont) return;

    cont.innerHTML =
      '<div style="color:#888;font-size:13px;text-align:center;padding:20px;">Loading approval record…</div>';

    function renderRows() {
      cont.innerHTML = '';
      if (global.RA_STATE.masterLocked) {
        var hdr = document.createElement('div');
        hdr.style.cssText =
          'background:#e6f4ea;border:1px solid #34a853;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:13px;color:#1e7e34;font-weight:600;text-align:center;';
        hdr.textContent = 'All approvals complete — permanent locked record';
        cont.appendChild(hdr);
      }

      cats.forEach(function (m) {
        var av = m.lbl
          .replace(/[—\-]/g, ' ')
          .split(/\s+/)
          .map(function (w) {
            return w[0] || '';
          })
          .join('')
          .toUpperCase()
          .slice(0, 2);
        var row = document.createElement('div');
        row.className = 'ra-sum-row';
        var match = raGetLock(m.c, m.s);
        if (match && match.decision) {
          row.innerHTML =
            '<div class="ra-sum-av">' +
            av +
            '</div><div style="flex:1;min-width:0"><div class="ra-sum-name">' +
            (match.name || '—') +
            '</div><div class="ra-sum-role">' +
            m.lbl +
            '</div>' +
            (match.comment
              ? '<div class="ra-sum-cmt">“' + match.comment + '”</div>'
              : '<div class="ra-sum-cmt">' + (match.timestamp || '') + '</div>') +
            '</div><span class="ra-sum-pill" style="background:' +
            (RA_DECISION_BG[match.decision] || '#f0f0f0') +
            ';color:' +
            (RA_DECISION_COLORS[match.decision] || '#666') +
            '">' +
            (RA_DECISION_LABELS[match.decision] || match.decision) +
            '</span>';
        } else {
          row.innerHTML =
            '<div class="ra-sum-av" style="background:#f5f5f5;color:#aaa">' +
            av +
            '</div><div style="flex:1;min-width:0"><div class="ra-sum-name" style="color:#aaa">Not submitted yet</div><div class="ra-sum-role">' +
            m.lbl +
            '</div></div><span class="ra-sum-pill">Pending</span>';
        }
        cont.appendChild(row);
      });
    }

    renderRows();
  }

  function raRenderDD(sub) {
    ['hvac', 'plumb'].forEach(function (t) {
      var tb = document.getElementById('ra_ddt_' + t);
      if (tb) tb.classList.toggle('active', t === sub);
      var fc = document.getElementById('ra_ddc_' + t);
      if (fc) fc.style.display = t === sub ? 'block' : 'none';
    });
    raRenderForm('dd', sub);
  }

  function raGoDesign(sub) {
    if (typeof siGoTo === 'function') siGoTo('pg_ra_dd');
    /* Render immediately from hardcoded data — no server sync needed */
    raRenderDD(sub);
    raApplyMasterLockUI();
  }

  function raInitApproval() {
    raRefreshPg3Status();
    raUpdateLandingPills();
    raApplyMasterLockUI();

    /* Map each form page → render function */
    var formMap = {
      'pg_ra_pm':      function () { raRenderForm('pm',  'main'); },
      'pg_ra_mep':     function () { raRenderForm('mep', 'main'); },
      'pg_ra_fm':      function () { raRenderForm('fm',  'main'); },
      'pg_ra_cr':      function () { raRenderForm('cr',  'main'); },
      'pg_ra_dd':      function () { raRenderForm('dd', 'hvac'); raRenderForm('dd', 'plumb'); },
      'pg_ra_summary': function () { if (typeof raRenderSummary === 'function') raRenderSummary(); }
    };

    /* Render whichever form is visible right now (handles default screen + hash) */
    function renderVisible() {
      var vis = document.querySelector('.screen.visible');
      if (vis && formMap[vis.id]) { formMap[vis.id](); return; }
      var h = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
      if (h && formMap[h]) formMap[h]();
    }

    renderVisible();

    /* Sync only to check if CR (Mr. Sultan) has submitted — locked forms don't need it */
    var vis = document.querySelector('.screen.visible');
    var currentId = vis ? vis.id : (location.hash ? decodeURIComponent(location.hash.slice(1)) : '');
    var isCRPage = (currentId === 'pg_ra_cr' || currentId === 'pg_ra_land' || currentId === 'pg_ra_summary' || currentId === 'pg3');
    if (isCRPage || !currentId) {
      raSyncFromSheet(function () {
        raRefreshPg3Status();
        raUpdateLandingPills();
        raApplyMasterLockUI();
        var v2 = document.querySelector('.screen.visible');
        if (v2 && formMap[v2.id]) formMap[v2.id]();
      });
    }
  }

  function raGoHomeFromApproval() {
    var pg3 = document.getElementById('pg3');
    if (pg3 && typeof siGoTo === 'function') {
      siGoTo('pg3');
      setTimeout(raRefreshPg3Status, 250);
    } else {
      window.location.href = 'EVA-CORE.html#pg3';
    }
  }

  global.RA_SCRIPT_URL = RA_SCRIPT_URL;
  global.raSyncFromSheet = raSyncFromSheet;
  global.raLoadLanding = raLoadLanding;
  global.raBackToLanding = raBackToLanding;
  global.raUpdateLandingPills = raUpdateLandingPills;
  global.raGoForm = raGoForm;
  global.raRenderForm = raRenderForm;
  global.raSelectDec = raSelectDec;
  global.raSubmit = raSubmit;
  global.raSummaryLoad = raSummaryLoad;
  global.raRenderSummary = raRenderSummary;
  global.raRenderDD = raRenderDD;
  global.raRefreshPg3Status = raRefreshPg3Status;
  global.raGoDesign = raGoDesign;
  global.raInitApproval = raInitApproval;
  global.raGoHomeFromApproval = raGoHomeFromApproval;
  global.raGetLock = raGetLock;
})(window);
