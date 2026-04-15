// ==========================================
// 🌾 FARMER DATABASE - MAIN APPLICATION
// ==========================================

let currentUser = null;
let D = []; // Farmer data
let pg = 1;
const PP = 10;

// ============ AUTH CHECK ============
function checkAuth() {
    const session = localStorage.getItem('currentUser');
    if (!session) {
        window.location.href = 'index.html';
        return false;
    }
    currentUser = JSON.parse(session);
    document.getElementById('userName').textContent = currentUser.name;
    return true;
}

// ============ LOGOUT ============
function logout() {
    if (confirm('🚪 Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// ============ PROFILE ============
function showProfile() {
    const users = JSON.parse(localStorage.getItem('allUsers') || '{}');
    const user = users[currentUser.mobile];
    if (!user) return;

    document.getElementById('profileContent').innerHTML = `
        <div class="profile-card">
            <div class="profile-avatar">👤</div>
            <h3>${user.name}</h3>
            <p>📱 ${user.mobile}</p>
            <p>🏢 ${user.org || 'Not specified'}</p>
            <p style="font-size:0.75rem;color:#aaa;margin-top:8px;">
                📅 Registered: ${user.createdAt}<br>
                🔑 Last Login: ${user.lastLogin || 'First time'}
            </p>
            <div class="profile-stats">
                <div class="profile-stat">
                    <div class="val">${D.length}</div>
                    <div class="lbl">Total Farmers</div>
                </div>
                <div class="profile-stat">
                    <div class="val">${D.filter(f=>f.s==='Active').length}</div>
                    <div class="lbl">Active</div>
                </div>
                <div class="profile-stat">
                    <div class="val">${D.filter(f=>f.s==='Inactive').length}</div>
                    <div class="lbl">Inactive</div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('pMdl').classList.add('on');
}

function cP() { document.getElementById('pMdl').classList.remove('on'); }

function changePassword() {
    const oldPass = prompt('Enter current password:');
    if (!oldPass) return;

    const users = JSON.parse(localStorage.getItem('allUsers') || '{}');
    const user = users[currentUser.mobile];

    if (atob(user.password) !== oldPass) {
        alert('❌ Wrong current password!');
        return;
    }

    const newPass = prompt('Enter new password (min 4 chars):');
    if (!newPass || newPass.length < 4) {
        alert('❌ Password must be at least 4 characters!');
        return;
    }

    const confirmPass = prompt('Confirm new password:');
    if (newPass !== confirmPass) {
        alert('❌ Passwords do not match!');
        return;
    }

    users[currentUser.mobile].password = btoa(newPass);
    localStorage.setItem('allUsers', JSON.stringify(users));
    alert('✅ Password changed successfully!');
    cP();
}

// ============ DATA MANAGEMENT ============
// Each user has their own data key: farmers_MOBILENUMBER
function getDataKey() {
    return 'farmers_' + currentUser.mobile;
}

function loadData() {
    try {
        const saved = localStorage.getItem(getDataKey());
        if (saved) D = JSON.parse(saved);
        else D = [];
    } catch (e) {
        D = [];
    }
}

function saveData() {
    try {
        localStorage.setItem(getDataKey(), JSON.stringify(D));
    } catch (e) {
        toast('⚠️ Storage full! Export data first.', 'e');
    }
}

// ============ FORMAT AADHAR ============
function fmtA(inp) {
    let v = inp.value.replace(/\D/g, '');
    if (v.length > 12) v = v.substring(0, 12);
    let f = '';
    for (let i = 0; i < v.length; i++) {
        if (i > 0 && i % 4 === 0) f += '-';
        f += v[i];
    }
    inp.value = f;
}

// ============ STATS ============
function stats() {
    document.getElementById('sT').textContent = D.length;
    document.getElementById('sA').textContent = D.filter(f => f.s === 'Active').length;
    document.getElementById('sI').textContent = D.filter(f => f.s === 'Inactive').length;
    document.getElementById('sP').textContent = D.filter(f => f.s === 'Pending').length;
}

// ============ RENDER TABLE ============
function render() {
    const s = document.getElementById('search').value.toLowerCase();
    const sf = document.getElementById('filter').value;

    let F = D.filter(f => {
        const ms = !s || f.n.toLowerCase().includes(s) || f.c.toLowerCase().includes(s) ||
            f.a.includes(s) || f.m.includes(s) || f.b.toLowerCase().includes(s) ||
            f.ad.toLowerCase().includes(s);
        const mf = sf === 'all' || f.s === sf;
        return ms && mf;
    });

    const tp = Math.ceil(F.length / PP) || 1;
    if (pg > tp) pg = 1;
    const st = (pg - 1) * PP;
    const pd = F.slice(st, st + PP);
    const tb = document.getElementById('tb');

    if (F.length === 0) {
        tb.innerHTML = `<tr><td colspan="12"><div class="nodata"><span>🌾</span><p>No farmers found! Click "➕ Add Farmer" to start.</p></div></td></tr>`;
        document.getElementById('pgn').innerHTML = '';
        stats();
        return;
    }

    tb.innerHTML = pd.map((f, i) => {
        const gi = D.indexOf(f);
        const bc = f.s === 'Active' ? 'b1' : f.s === 'Inactive' ? 'b2' : 'b3';
        return `<tr>
            <td><b>${st + i + 1}</b></td>
            <td><b style="color:#0a3d1f">${f.c}</b></td>
            <td>${f.n}</td><td>${f.a}</td>
            <td title="${f.ad}">${f.ad.length > 18 ? f.ad.substring(0, 18) + '...' : f.ad}</td>
            <td>${f.b}</td><td>${f.ac}</td><td><code>${f.if}</code></td>
            <td>${f.br || '-'}</td>
            <td><a href="tel:${f.m}">📞${f.m}</a></td>
            <td><span class="bdg ${bc}">${f.s}</span></td>
            <td><div class="acts">
                <button class="btn sm sv" onclick="vw(${gi})">👁️</button>
                <button class="btn sm sed" onclick="ed(${gi})">✏️</button>
                <button class="btn sm sdl" onclick="dl(${gi})">🗑️</button>
            </div></td>
        </tr>`;
    }).join('');

    // Pagination
    let ph = '';
    if (tp > 1) {
        ph += `<button onclick="gP(${pg - 1})" ${pg === 1 ? 'disabled' : ''}>◀</button>`;
        let startP = Math.max(1, pg - 2), endP = Math.min(tp, pg + 2);
        if (startP > 1) ph += `<button onclick="gP(1)">1</button>`;
        if (startP > 2) ph += `<button disabled>...</button>`;
        for (let i = startP; i <= endP; i++) {
            ph += `<button onclick="gP(${i})" class="${i === pg ? 'act' : ''}">${i}</button>`;
        }
        if (endP < tp - 1) ph += `<button disabled>...</button>`;
        if (endP < tp) ph += `<button onclick="gP(${tp})">${tp}</button>`;
        ph += `<button onclick="gP(${pg + 1})" ${pg === tp ? 'disabled' : ''}>▶</button>`;
    }
    document.getElementById('pgn').innerHTML = ph;
    stats();
}

function gP(p) { pg = p; render(); }

// ============ ADD / EDIT ============
function openAdd() {
    document.getElementById('mT').textContent = '➕ Add New Farmer';
    document.getElementById('eI').value = -1;
    clr();
    // Auto generate code
    let maxNum = 0;
    D.forEach(f => {
        const num = parseInt(f.c.replace(/\D/g, ''));
        if (num > maxNum) maxNum = num;
    });
    document.getElementById('i1').value = 'FR-' + String(maxNum + 1).padStart(3, '0');
    document.getElementById('fMdl').classList.add('on');
    document.getElementById('i2').focus();
}

function cF() { document.getElementById('fMdl').classList.remove('on'); }
function cV() { document.getElementById('vMdl').classList.remove('on'); }

function clr() {
    ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('i10').value = 'Active';
}

// ============ VALIDATE ============
function val() {
    const req = [
        { id: 'i1', n: 'Farmer Code' }, { id: 'i2', n: 'Farmer Name' },
        { id: 'i3', n: 'Aadhar' }, { id: 'i4', n: 'Mobile' },
        { id: 'i5', n: 'Address' }, { id: 'i6', n: 'Bank Name' },
        { id: 'i7', n: 'Bank A/C' }, { id: 'i8', n: 'IFSC Code' }
    ];
    for (let f of req) {
        if (!document.getElementById(f.id).value.trim()) {
            toast('❌ ' + f.n + ' required!', 'e');
            document.getElementById(f.id).focus();
            return false;
        }
    }
    const aadhar = document.getElementById('i3').value.replace(/\D/g, '');
    if (aadhar.length !== 12) { toast('❌ Aadhar must be 12 digits!', 'e'); return false; }
    if (!/^\d{10}$/.test(document.getElementById('i4').value.trim())) {
        toast('❌ Mobile must be 10 digits!', 'e'); return false;
    }
    return true;
}

// ============ SAVE ============
function save() {
    if (!val()) return;

    const d = {
        c: document.getElementById('i1').value.trim(),
        n: document.getElementById('i2').value.trim(),
        a: document.getElementById('i3').value.trim(),
        m: document.getElementById('i4').value.trim(),
        ad: document.getElementById('i5').value.trim(),
        b: document.getElementById('i6').value.trim(),
        ac: document.getElementById('i7').value.trim(),
        if: document.getElementById('i8').value.trim().toUpperCase(),
        br: document.getElementById('i9').value.trim(),
        s: document.getElementById('i10').value,
        du: new Date().toLocaleString('en-IN')
    };

    const idx = parseInt(document.getElementById('eI').value);

    if (idx === -1) {
        // Check duplicate code
        if (D.find(f => f.c === d.c)) {
            toast('❌ Farmer Code already exists!', 'e');
            return;
        }
        d.da = new Date().toLocaleString('en-IN');
        D.push(d);
        toast('✅ Farmer added successfully!', 's');
    } else {
        d.da = D[idx].da;
        D[idx] = d;
        toast('✅ Farmer updated successfully!', 's');
    }

    saveData();
    render();
    cF();
}

// ============ VIEW ============
function vw(i) {
    const f = D[i];
    const bc = f.s === 'Active' ? 'b1' : f.s === 'Inactive' ? 'b2' : 'b3';
    document.getElementById('vC').innerHTML = `
        <div class="vi"><label>Farmer Code</label><p>${f.c}</p></div>
        <div class="vi"><label>Farmer Name</label><p>${f.n}</p></div>
        <div class="vi"><label>Aadhar Number</label><p>${f.a}</p></div>
        <div class="vi"><label>Mobile</label><p>📞 ${f.m}</p></div>
        <div class="vi fw"><label>Address</label><p>${f.ad}</p></div>
        <div class="vi"><label>Bank Name</label><p>🏦 ${f.b}</p></div>
        <div class="vi"><label>Bank A/C</label><p>${f.ac}</p></div>
        <div class="vi"><label>IFSC Code</label><p><code>${f.if}</code></p></div>
        <div class="vi"><label>Branch</label><p>${f.br || 'N/A'}</p></div>
        <div class="vi"><label>Status</label><p><span class="bdg ${bc}">${f.s}</span></p></div>
        <div class="vi"><label>Date Added</label><p>📅 ${f.da || 'N/A'}</p></div>
        <div class="vi"><label>Last Updated</label><p>🔄 ${f.du || 'N/A'}</p></div>
    `;
    document.getElementById('vMdl').classList.add('on');
}

// ============ EDIT ============
function ed(i) {
    const f = D[i];
    document.getElementById('mT').textContent = '✏️ Edit Farmer';
    document.getElementById('eI').value = i;
    document.getElementById('i1').value = f.c;
    document.getElementById('i2').value = f.n;
    document.getElementById('i3').value = f.a;
    document.getElementById('i4').value = f.m;
    document.getElementById('i5').value = f.ad;
    document.getElementById('i6').value = f.b;
    document.getElementById('i7').value = f.ac;
    document.getElementById('i8').value = f.if;
    document.getElementById('i9').value = f.br || '';
    document.getElementById('i10').value = f.s;
    document.getElementById('fMdl').classList.add('on');
}

// ============ DELETE ============
function dl(i) {
    if (!confirm(`⚠️ Delete farmer "${D[i].n}" (${D[i].c})?\n\nThis cannot be undone!`)) return;
    D.splice(i, 1);
    saveData();
    render();
    toast('🗑️ Farmer deleted!', 's');
}

// ============ EXPORT CSV ============
function exportCSV() {
    if (D.length === 0) { toast('❌ No data to export!', 'e'); return; }

    const h = ['S.No.', 'Farmer Code', 'Farmer Name', 'Aadhar Number', 'Address',
        'Bank Name', 'Bank A/C', 'IFSC Code', 'Branch', 'Mobile No.', 'Status',
        'Date Added', 'Last Updated'];
    let csv = '\uFEFF' + h.join(',') + '\n';

    D.forEach((f, i) => {
        csv += [
            i + 1, q(f.c), q(f.n), q(f.a), q(f.ad), q(f.b),
            q(f.ac), q(f.if), q(f.br), q(f.m), q(f.s),
            q(f.da || ''), q(f.du || '')
        ].join(',') + '\n';
    });

    dlF(csv, `Farmers_${currentUser.name}_${gD()}.csv`, 'text/csv;charset=utf-8');
    toast('📗 Excel exported!', 's');
}

function q(v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }
function gD() { return new Date().toISOString().slice(0, 10); }

function dlF(c, n, t) {
    const b = new Blob([c], { type: t });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = n;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(u);
}

// ============ BACKUP ============
function backup() {
    if (D.length === 0) { toast('❌ No data to backup!', 'e'); return; }
    const backupData = {
        user: currentUser.name,
        mobile: currentUser.mobile,
        date: new Date().toLocaleString('en-IN'),
        count: D.length,
        data: D
    };
    dlF(
        JSON.stringify(backupData, null, 2),
        `Backup_${currentUser.name}_${gD()}.json`,
        'application/json'
    );
    toast('💾 Backup saved!', 's');
}

// ============ RESTORE ============
function restore() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.data && Array.isArray(data.data)) {
                    const msg = `⚠️ This will replace your current ${D.length} farmers with ${data.data.length} farmers from backup.\n\nBackup by: ${data.user || 'Unknown'}\nDate: ${data.date || 'Unknown'}\n\nContinue?`;
                    if (confirm(msg)) {
                        D = data.data;
                        saveData();
                        render();
                        toast(`✅ Restored ${D.length} farmers!`, 's');
                    }
                } else {
                    toast('❌ Invalid backup file!', 'e');
                }
            } catch (err) {
                toast('❌ Error reading file!', 'e');
            }
        };
        reader.readAsText(file);
    };
    inp.click();
}

// ============ TOAST ============
function toast(m, t) {
    const e = document.createElement('div');
    e.className = 'toast ' + (t === 's' ? 'ts' : t === 'e' ? 'te' : 'tw');
    e.textContent = m;
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 3500);
}

// ============ MODAL CLOSE HANDLERS ============
document.getElementById('fMdl').addEventListener('click', function (e) { if (e.target === this) cF(); });
document.getElementById('vMdl').addEventListener('click', function (e) { if (e.target === this) cV(); });
document.getElementById('pMdl').addEventListener('click', function (e) { if (e.target === this) cP(); });

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { cF(); cV(); cP(); }
});

// ============ AUTO SAVE ============
setInterval(function () {
    if (D.length > 0 && currentUser) saveData();
}, 30000);

// ============ INIT ============
if (checkAuth()) {
    loadData();
    render();
}