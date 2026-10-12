// ĐƯỜNG LINK API GOOGLE SHEETS CỦA BẠN
const API_URL = "https://script.google.com/macros/s/AKfycbxD3BQvETv6EWGHzp-55PedjGzyU9ro-_5rtaMLtQ3jvj4yw_JLPh2ndMCEX-KNJssr/exec";
const SECRET_PASSWORD = "123"; 

let devices = [];
const deviceListEl = document.getElementById('deviceList');
const searchInput = document.getElementById('searchInput');
const dashboardView = document.getElementById('dashboardView');
const listView = document.getElementById('listView');

// Biến lưu trữ biểu đồ để làm mới
let statusChartInstance = null;
let issueChartInstance = null;
let manuChartInstance = null;

const manuals = [
    { name: "Hướng dẫn thao tác MC Schneider", type: "MC", file: "mc-schneider.pdf" },
    { name: "Hướng dẫn thao tác MC Nulec", type: "MC", file: "mc-nulec.pdf" },
    { name: "Hướng dẫn thao tác LBS Entec", type: "LBS", file: "lbs-entec.pdf" },
    { name: "Hướng dẫn thao tác LBS Shinsung", type: "LBS", file: "lbs-shinsung.pdf" },
    { name: "Sổ tay xử lý lỗi Modem/3G", type: "Kênh truyền", file: "huong-dan-modem.pdf" }
];

// ==========================================
// 1. TẢI DỮ LIỆU & VẼ BIỂU ĐỒ
// ==========================================
async function loadData() {
    try {
        const response = await fetch(API_URL, { cache: "no-store" });
        const data = await response.json();
        
        devices = data.map(d => {
            let reportObj = null;
            if (d['Lỗi báo cáo'] || d['Ghi chú báo cáo']) {
                reportObj = { issues: d['Lỗi báo cáo'] ? d['Lỗi báo cáo'].split('|') : [], note: d['Ghi chú báo cáo'] || "", time: d['Thời gian báo cáo'] || "" };
            }
            return {
                id: d['STT'], name: d['Tên thiết bị'], ip: d['Địa chỉ IP'], 
                manufacturer: d['Hãng sản xuất'], connectionStatus: d['Tình trạng kết nối'], 
                operationStatus: d['Tình trạng vận hành'], type: d['Loại thiết bị'], report: reportObj
            };
        });
        
        devices.reverse();
        updateHeaderCounts();
        
        // Ẩn danh sách lúc mới vào & Vẽ Dashboard
        renderList([]); 
        drawDashboard();
        
    } catch (error) {
        alert("Lỗi mạng! Không thể kết nối máy chủ.");
    }
}

// HÀM VẼ BIỂU ĐỒ THỐNG KÊ (DASHBOARD)
function drawDashboard() {
    // 1. Dữ liệu Tình trạng (Tốt / Mất kết nối / Có báo cáo lỗi)
    let good = 0, lost = 0, broken = 0;
    let issuesCount = {};
    let manuCount = {};

    devices.forEach(d => {
        // Phân tích tình trạng
        if (d.report) { broken++; } 
        else if (d.connectionStatus && d.connectionStatus.toLowerCase().includes('mất')) { lost++; } 
        else { good++; }

        // Phân tích Nguyên nhân sự cố
        if (d.report && d.report.issues) {
            d.report.issues.forEach(iss => { issuesCount[iss] = (issuesCount[iss] || 0) + 1; });
        }

        // Phân tích Hãng sản xuất
        let manu = d.manufacturer ? d.manufacturer.trim() : "Khác";
        if(manu !== '') manuCount[manu] = (manuCount[manu] || 0) + 1;
    });

    // Vẽ Biểu đồ 1: Tình trạng kết nối (Doughnut)
    if(statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
            labels: ['Đang vận hành tốt', 'Mất kết nối SCADA', 'Đang báo cáo sự cố'],
            datasets: [{ data: [good, lost, broken], backgroundColor: ['#22c55e', '#9ca3af', '#f97316'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }
    });

    // Vẽ Biểu đồ 2: Top nguyên nhân sự cố (Bar)
    if(issueChartInstance) issueChartInstance.destroy();
    const issueLabels = Object.keys(issuesCount);
    const issueData = Object.values(issuesCount);
    issueChartInstance = new Chart(document.getElementById('issueChart'), {
        type: 'bar',
        data: {
            labels: issueLabels.length > 0 ? issueLabels : ['Chưa có sự cố'],
            datasets: [{ label: 'Số lượng thiết bị', data: issueData.length > 0 ? issueData : [0], backgroundColor: '#ef4444', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

    // Vẽ Biểu đồ 3: Cơ cấu Hãng sản xuất (Pie)
    if(manuChartInstance) manuChartInstance.destroy();
    manuChartInstance = new Chart(document.getElementById('manuChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(manuCount),
            datasets: [{ data: Object.values(manuCount), backgroundColor: ['#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } } }
    });
}

// ==========================================
// 2. LOGIC CHUYỂN TAB ĐIỀU HƯỚNG
// ==========================================
const tabChartBtn = document.getElementById('tabChartBtn');
const tabListBtn = document.getElementById('tabListBtn');

function switchTab(tabName) {
    if (tabName === 'chart') {
        dashboardView.classList.remove('hidden');
        listView.classList.add('hidden');
        tabChartBtn.classList.replace('text-gray-400', 'text-blue-600');
        tabListBtn.classList.replace('text-blue-600', 'text-gray-400');
        drawDashboard(); // Cập nhật lại biểu đồ
    } else {
        dashboardView.classList.add('hidden');
        listView.classList.remove('hidden');
        tabListBtn.classList.replace('text-gray-400', 'text-blue-600');
        tabChartBtn.classList.replace('text-blue-600', 'text-gray-400');
    }
}

tabChartBtn.addEventListener('click', () => switchTab('chart'));
tabListBtn.addEventListener('click', () => switchTab('list'));

// ==========================================
// 3. TÌM KIẾM, LỌC & DANH SÁCH THIẾT BỊ
// ==========================================
async function sendToServer(payload) {
    try { await fetch(API_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) }); } catch(e) {}
}

function updateHeaderCounts() {
    document.getElementById('count-total').textContent = devices.length;
    document.getElementById('count-lbs').textContent = devices.filter(d => d.type && d.type.toUpperCase().includes('LBS')).length;
    document.getElementById('count-mc').textContent = devices.filter(d => d.type && d.type.toUpperCase().includes('MC')).length;
    document.getElementById('count-warning').textContent = devices.filter(d => d.report).length;
}

function renderList(dataToRender) {
    deviceListEl.innerHTML = '';
    dataToRender.forEach(device => {
        const isMC = device.type && device.type.toUpperCase().includes('MC');
        const isGood = device.connectionStatus && device.connectionStatus.toLowerCase().includes('tốt');
        let cardStyle = isGood ? "border-green-300 bg-green-50/40" : "border-gray-200 bg-white";
        let iconStyle = isGood ? "text-green-500 bg-green-100" : "text-gray-400 bg-gray-100";
        let connBadgeStyle = isGood ? "bg-green-100 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200";

        let reportHTML = '';
        if (device.report) {
            cardStyle = "border-orange-400 bg-orange-50/50 shadow-md"; 
            reportHTML = `<div class="mt-3 p-3 bg-orange-100/80 border border-orange-300 rounded-lg text-sm text-orange-900"><div class="font-bold mb-1"><i class="fa-solid fa-triangle-exclamation"></i> Sự cố hiện trường:</div><ul class="list-disc ml-5 mb-1 font-medium">${device.report.issues.map(i => `<li>${i}</li>`).join('')}</ul>${device.report.note ? `<div class="italic text-xs">- Ghi chú: ${device.report.note}</div>` : ''}<div class="text-[10px] text-gray-500 mt-2 font-semibold">⏰ ${device.report.time}</div></div>`;
        }

        const card = `<div class="rounded-2xl p-4 shadow-sm border ${cardStyle}"><div class="flex justify-between items-start mb-3"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg flex items-center justify-center ${iconStyle}"><i class="fa-solid ${isMC ? 'fa-square' : 'fa-diamond'} text-xl"></i></div><div><h3 class="font-bold text-gray-800 text-base leading-tight">${device.name}</h3><p class="text-xs text-gray-500 mt-1"><i class="fa-solid fa-network-wired w-3"></i> ${device.ip}</p></div></div><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${isMC ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}">${device.type}</span></div><div class="flex flex-col gap-1.5 mt-2 pt-3 border-t border-gray-200/60"><div class="flex justify-between items-center text-xs"><span class="text-gray-500">Hãng SX:</span><span class="font-semibold">${device.manufacturer}</span></div><div class="flex justify-between items-center text-xs mt-1"><span class="text-gray-500">Kết nối:</span><span class="px-2 py-0.5 rounded border text-[10px] font-bold ${connBadgeStyle}">${device.connectionStatus || '---'}</span></div></div>${reportHTML}<div class="mt-3 pt-3 border-t border-gray-200/60 flex gap-2"><button onclick="openReport('${device.id}')" class="flex-1 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-100 flex justify-center items-center gap-2"><i class="fa-solid fa-flag text-orange-500"></i> Báo cáo lỗi</button></div></div>`;
        deviceListEl.insertAdjacentHTML('beforeend', card);
    });
}

document.getElementById('filterWarningBtn').addEventListener('click', () => {
    switchTab('list');
    renderList(devices.filter(d => d.report));
});

searchInput.addEventListener('input', (e) => {
    switchTab('list'); // Tự động chuyển qua tab Danh sách khi gõ tìm kiếm
    const keyword = e.target.value.toLowerCase().trim();
    if (keyword === '') {
        renderList([]); 
        document.getElementById('display-count').innerHTML = `Nhập từ khóa để tìm kiếm... <br><span class="text-blue-600 font-bold">Kho dữ liệu: ${devices.length} thiết bị</span>`;
        return;
    }
    const filtered = devices.filter(d => (d.name && d.name.toLowerCase().includes(keyword)) || (d.ip && d.ip.toLowerCase().includes(keyword)));
    renderList(filtered);
    document.getElementById('display-count').textContent = `Tìm thấy ${filtered.length}/${devices.length} thiết bị`;
});

// ==========================================
// 4. CHỨC NĂNG HƯỚNG DẪN VẬN HÀNH & BẢO MẬT (GIỮ NGUYÊN)
// ==========================================
const manualModal = document.getElementById('manualModal');
function renderManuals(list) {
    document.getElementById('manualList').innerHTML = list.length === 0 ? '<p class="text-center text-sm text-gray-500 mt-4">Không tìm thấy tài liệu.</p>' : list.map(item => `<a href="${item.file}" target="_blank" class="block bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:bg-gray-50 flex justify-between items-center mb-3"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center"><i class="fa-solid fa-file-pdf text-xl"></i></div><div><h4 class="font-bold text-gray-800 text-sm leading-tight mb-1">${item.name}</h4><span class="text-[10px] px-2 py-0.5 rounded font-bold uppercase ${item.type === 'MC' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}">${item.type}</span></div></div><i class="fa-solid fa-chevron-right text-gray-300"></i></a>`).join('');
}
document.getElementById('manualBtn').addEventListener('click', () => { document.getElementById('searchManual').value = ''; renderManuals(manuals); manualModal.classList.remove('hidden'); });
document.getElementById('closeManualBtn').addEventListener('click', () => manualModal.classList.add('hidden'));
document.getElementById('searchManual').addEventListener('input', (e) => renderManuals(manuals.filter(m => m.name.toLowerCase().includes(e.target.value.toLowerCase().trim()) || m.type.toLowerCase().includes(e.target.value.toLowerCase().trim()))));

const addModal = document.getElementById('addModal'), passwordModal = document.getElementById('passwordModal');
document.getElementById('addBtn').addEventListener('click', () => { passwordModal.classList.remove('hidden'); document.getElementById('adminPassword').value = ''; });
document.getElementById('cancelPassBtn').addEventListener('click', () => passwordModal.classList.add('hidden'));
document.getElementById('submitPassBtn').addEventListener('click', () => { if (document.getElementById('adminPassword').value === SECRET_PASSWORD) { passwordModal.classList.add('hidden'); addModal.classList.remove('hidden'); } else { alert("Sai mật khẩu!"); document.getElementById('adminPassword').value = ''; } });
document.getElementById('cancelBtn').addEventListener('click', () => addModal.classList.add('hidden'));
document.getElementById('saveBtn').addEventListener('click', () => {
    const name = document.getElementById('inputName').value.trim(), ip = document.getElementById('inputIP').value.trim();
    if(!name || !ip) return alert("Vui lòng nhập Tên và IP!");
    const newDevice = { id: devices.length > 0 ? Math.max(...devices.map(d => parseInt(d.id) || 0)) + 1 : 1, name: name, ip: ip, manufacturer: document.getElementById('inputManufacturer').value, connectionStatus: document.getElementById('inputConnection').value, operationStatus: document.getElementById('inputOperation').value, type: document.getElementById('inputType').value };
    devices.unshift(newDevice);
    addModal.classList.add('hidden'); updateHeaderCounts(); drawDashboard();
    if (searchInput.value.trim() !== '') { searchInput.dispatchEvent(new Event('input')); }
    alert("Đã thêm thành công!"); sendToServer({ action: 'add', ...newDevice }); 
});

const reportModal = document.getElementById('reportModal');
window.openReport = function(id) {
    const device = devices.find(d => d.id == id); if(!device) return;
    document.getElementById('reportDeviceId').value = id; document.getElementById('reportDeviceName').textContent = `Thiết bị: ${device.name}`;
    document.querySelectorAll('.report-cb').forEach(cb => cb.checked = false); document.getElementById('reportNote').value = '';
    if (device.report) { document.querySelectorAll('.report-cb').forEach(cb => { if (device.report.issues.includes(cb.value)) cb.checked = true; }); document.getElementById('reportNote').value = device.report.note || ''; document.getElementById('clearReportBtn').classList.remove('hidden'); } 
    else { document.getElementById('clearReportBtn').classList.add('hidden'); }
    reportModal.classList.remove('hidden');
}
document.getElementById('saveReportBtn').addEventListener('click', () => {
    const id = document.getElementById('reportDeviceId').value, deviceIndex = devices.findIndex(d => d.id == id);
    const checkedIssues = Array.from(document.querySelectorAll('.report-cb')).filter(cb => cb.checked).map(cb => cb.value), note = document.getElementById('reportNote').value.trim();
    if (checkedIssues.length === 0 && note === '') return alert("Hãy chọn ít nhất 1 lỗi!");
    const timeStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
    devices[deviceIndex].report = { issues: checkedIssues, note: note, time: timeStr };
    reportModal.classList.add('hidden'); updateHeaderCounts(); drawDashboard(); searchInput.dispatchEvent(new Event('input'));
    sendToServer({ action: 'report', id: id, report_issues: checkedIssues.join('|'), report_note: note, report_time: timeStr });
});
document.getElementById('clearReportBtn').addEventListener('click', () => {
    if(confirm("Đã sửa xong sự cố này?")) {
        const id = document.getElementById('reportDeviceId').value, deviceIndex = devices.findIndex(d => d.id == id);
        delete devices[deviceIndex].report;
        reportModal.classList.add('hidden'); updateHeaderCounts(); drawDashboard(); searchInput.dispatchEvent(new Event('input'));
        sendToServer({ action: 'clear_report', id: id });
    }
});
document.getElementById('cancelReportBtn').addEventListener('click', () => reportModal.classList.add('hidden'));

// Chạy App
loadData();