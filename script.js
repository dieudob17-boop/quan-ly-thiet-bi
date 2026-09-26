// DÁN LINK GOOGLE APPS SCRIPT CỦA BẠN VÀO GIỮA 2 DẤU NGOẶC KÉP Ở DÒNG DƯỚI:
const API_URL = "https://docs.google.com/spreadsheets/d/1xLrD61rgZi5NxPvnFeMDryfLFxWB15w2EfwV8v9D6Bk/edit?usp=sharing";

const SECRET_PASSWORD = "123"; 

let devices = [];
const deviceListEl = document.getElementById('deviceList');
const searchInput = document.getElementById('searchInput');

// HÀM TẢI DỮ LIỆU TỪ GOOGLE SHEETS
async function loadData() {
    deviceListEl.innerHTML = '<div class="text-center py-10 text-blue-600 font-bold"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3"></i><br>Đang tải dữ liệu từ máy chủ...</div>';
    try {
        const response = await fetch(API_URL, { cache: "no-store" });
        const data = await response.json();
        
        devices = data.map(d => {
            let reportObj = null;
            if (d.report_issues || d.report_note) {
                reportObj = {
                    issues: d.report_issues ? d.report_issues.split('|') : [],
                    note: d.report_note || "",
                    time: d.report_time || ""
                };
            }
            return {
                id: d.id, name: d.name, ip: d.ip, manufacturer: d.manufacturer,
                connectionStatus: d.connectionStatus, operationStatus: d.operationStatus,
                type: d.type, report: reportObj
            };
        });
        // Sắp xếp ID mới nhất lên đầu
        devices.reverse();
        renderList([]); 
        searchInput.dispatchEvent(new Event('input'));
    } catch (error) {
        deviceListEl.innerHTML = '<div class="text-center py-10 text-red-500 font-bold">Lỗi mạng! Không thể kết nối máy chủ.</div>';
    }
}

// HÀM GỬI DỮ LIỆU LÊN GOOGLE SHEETS
// HÀM GỬI DỮ LIỆU LÊN GOOGLE SHEETS
async function sendToServer(payload) {
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors", // Bắt buộc phải có dòng này để Google không chặn
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });
    } catch(e) {
        console.error("Lỗi đồng bộ máy chủ", e);
    }
}

function renderList(dataToRender) {
    deviceListEl.innerHTML = '';
    
    dataToRender.forEach(device => {
        const isMC = device.type && device.type.toUpperCase().includes('MC');
        const iconShape = isMC ? 'fa-square' : 'fa-diamond';
        const typeBadgeColor = isMC ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700';
        const isGood = device.connectionStatus && device.connectionStatus.toLowerCase().includes('tốt');
        
        let cardStyle = isGood ? "border-green-300 bg-green-50/40" : "border-gray-200 bg-white";
        let iconStyle = isGood ? "text-green-500 bg-green-100" : "text-gray-400 bg-gray-100";
        let connBadgeStyle = isGood ? "bg-green-100 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200";

        let reportHTML = '';
        if (device.report) {
            cardStyle = "border-orange-400 bg-orange-50/50 shadow-md"; 
            reportHTML = `
                <div class="mt-3 p-3 bg-orange-100/80 border border-orange-300 rounded-lg text-sm text-orange-900 relative">
                    <div class="font-bold mb-1"><i class="fa-solid fa-triangle-exclamation"></i> Sự cố hiện trường:</div>
                    <ul class="list-disc ml-5 mb-1 font-medium">
                        ${device.report.issues.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                    ${device.report.note ? `<div class="italic text-xs">- Ghi chú: ${device.report.note}</div>` : ''}
                    <div class="text-[10px] text-gray-500 mt-2 font-semibold">⏰ ${device.report.time}</div>
                </div>
            `;
        }

        const card = `
            <div class="rounded-2xl p-4 shadow-sm border ${cardStyle}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center ${iconStyle}"><i class="fa-solid ${iconShape} text-xl"></i></div>
                        <div>
                            <h3 class="font-bold text-gray-800 text-base leading-tight">${device.name}</h3>
                            <p class="text-xs text-gray-500 mt-1"><i class="fa-solid fa-network-wired w-3"></i> ${device.ip}</p>
                        </div>
                    </div>
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${typeBadgeColor}">${device.type}</span>
                </div>
                <div class="flex flex-col gap-1.5 mt-2 pt-3 border-t border-gray-200/60">
                    <div class="flex justify-between items-center text-xs"><span class="text-gray-500">Hãng SX:</span><span class="font-semibold">${device.manufacturer}</span></div>
                    <div class="flex justify-between items-center text-xs"><span class="text-gray-500">Vận hành:</span><span class="font-semibold">${device.operationStatus || '---'}</span></div>
                    <div class="flex justify-between items-center text-xs mt-1"><span class="text-gray-500">Kết nối:</span><span class="px-2 py-0.5 rounded border text-[10px] font-bold ${connBadgeStyle}">${device.connectionStatus || '---'}</span></div>
                </div>
                ${reportHTML}
                <div class="mt-3 pt-3 border-t border-gray-200/60 flex gap-2">
                    <button onclick="openReport('${device.id}')" class="flex-1 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-100 flex justify-center items-center gap-2"><i class="fa-solid fa-flag text-orange-500"></i> Báo cáo lỗi</button>
                </div>
            </div>
        `;
        deviceListEl.insertAdjacentHTML('beforeend', card);
    });

    document.getElementById('count-total').textContent = devices.length;
    document.getElementById('count-lbs').textContent = devices.filter(d => d.type && d.type.toUpperCase().includes('LBS')).length;
    document.getElementById('count-mc').textContent = devices.filter(d => d.type && d.type.toUpperCase().includes('MC')).length;
    document.getElementById('count-warning').textContent = devices.filter(d => d.report).length;
}

// Bắt đầu chạy App
loadData();

// Lọc lỗi & Tìm kiếm
document.getElementById('filterWarningBtn').addEventListener('click', () => {
    const warningDevices = devices.filter(d => d.report);
    renderList(warningDevices);
    document.getElementById('display-count').innerHTML = `Đang hiển thị <b class="text-orange-600">${warningDevices.length} thiết bị đang có sự cố</b>`;
});

searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    if (keyword === '') {
        renderList([]);
        document.getElementById('display-count').innerHTML = `Nhập từ khóa để tìm kiếm... <br><span class="text-blue-600 font-bold">Kho dữ liệu: ${devices.length} thiết bị</span>`;
        return;
    }
    const filteredDevices = devices.filter(device => 
        (device.name && device.name.toLowerCase().includes(keyword)) || 
        (device.ip && device.ip.toLowerCase().includes(keyword))
    );
    renderList(filteredDevices);
    document.getElementById('display-count').textContent = `Tìm thấy ${filteredDevices.length}/${devices.length} thiết bị`;
});

// Xử lý Mật khẩu
document.getElementById('addBtn').addEventListener('click', () => {
    document.getElementById('passwordModal').classList.remove('hidden');
    document.getElementById('adminPassword').value = '';
});
document.getElementById('cancelPassBtn').addEventListener('click', () => document.getElementById('passwordModal').classList.add('hidden'));
document.getElementById('submitPassBtn').addEventListener('click', () => {
    if (document.getElementById('adminPassword').value === SECRET_PASSWORD) {
        document.getElementById('passwordModal').classList.add('hidden');
        document.getElementById('addModal').classList.remove('hidden');
    } else {
        alert("Sai mật khẩu!");
        document.getElementById('adminPassword').value = '';
    }
});

// Thêm thiết bị mới đồng bộ lên mạng
document.getElementById('cancelBtn').addEventListener('click', () => document.getElementById('addModal').classList.add('hidden'));
document.getElementById('saveBtn').addEventListener('click', () => {
    const name = document.getElementById('inputName').value.trim();
    const ip = document.getElementById('inputIP').value.trim();
    if(!name || !ip) { alert("Vui lòng nhập Tên và IP!"); return; }

    const newDevice = {
        id: Date.now(), name: name, ip: ip,
        manufacturer: document.getElementById('inputManufacturer').value,
        connectionStatus: document.getElementById('inputConnection').value,
        operationStatus: document.getElementById('inputOperation').value,
        type: document.getElementById('inputType').value
    };

    devices.unshift(newDevice); // Cập nhật màn hình lập tức
    document.getElementById('addModal').classList.add('hidden');
    searchInput.dispatchEvent(new Event('input'));
    alert("Đã thêm thành công! Dữ liệu đang được đẩy lên máy chủ...");

    sendToServer({ action: 'add', ...newDevice }); // Bắn lên Google Sheets
});

// Báo cáo lỗi đồng bộ lên mạng
const reportModal = document.getElementById('reportModal');
window.openReport = function(id) {
    const device = devices.find(d => d.id == id);
    if(!device) return;
    document.getElementById('reportDeviceId').value = id;
    document.getElementById('reportDeviceName').textContent = `Thiết bị: ${device.name}`;
    document.querySelectorAll('.report-cb').forEach(cb => cb.checked = false);
    document.getElementById('reportNote').value = '';
    
    if (device.report) {
        document.querySelectorAll('.report-cb').forEach(cb => { if (device.report.issues.includes(cb.value)) cb.checked = true; });
        document.getElementById('reportNote').value = device.report.note || '';
        document.getElementById('clearReportBtn').classList.remove('hidden');
    } else { document.getElementById('clearReportBtn').classList.add('hidden'); }
    reportModal.classList.remove('hidden');
}

document.getElementById('saveReportBtn').addEventListener('click', () => {
    const id = document.getElementById('reportDeviceId').value;
    const deviceIndex = devices.findIndex(d => d.id == id);
    const checkedIssues = Array.from(document.querySelectorAll('.report-cb')).filter(cb => cb.checked).map(cb => cb.value);
    const note = document.getElementById('reportNote').value.trim();
    if (checkedIssues.length === 0 && note === '') { alert("Hãy chọn ít nhất 1 lỗi!"); return; }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');

    devices[deviceIndex].report = { issues: checkedIssues, note: note, time: timeStr };
    reportModal.classList.add('hidden');
    searchInput.dispatchEvent(new Event('input'));

    sendToServer({
        action: 'report', id: id,
        report_issues: checkedIssues.join('|'), report_note: note, report_time: timeStr
    });
});

document.getElementById('clearReportBtn').addEventListener('click', () => {
    if(confirm("Đã sửa xong sự cố này?")) {
        const id = document.getElementById('reportDeviceId').value;
        const deviceIndex = devices.findIndex(d => d.id == id);
        delete devices[deviceIndex].report;
        reportModal.classList.add('hidden');
        searchInput.dispatchEvent(new Event('input'));

        sendToServer({ action: 'clear_report', id: id });
    }
});
document.getElementById('cancelReportBtn').addEventListener('click', () => reportModal.classList.add('hidden'));