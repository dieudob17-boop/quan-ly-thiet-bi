let devices = JSON.parse(localStorage.getItem('deviceData')) || [];

const deviceListEl = document.getElementById('deviceList');
const searchInput = document.getElementById('searchInput');
const addModal = document.getElementById('addModal');
const reportModal = document.getElementById('reportModal');

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

        // TÍNH NĂNG MỚI: Nếu thiết bị có báo cáo lỗi
        let reportHTML = '';
        if (device.report) {
            cardStyle = "border-orange-400 bg-orange-50/50 shadow-md"; // Đổi màu card sang cam cảnh báo
            reportHTML = `
                <div class="mt-3 p-3 bg-orange-100/80 border border-orange-300 rounded-lg text-sm text-orange-900 relative">
                    <div class="font-bold mb-1"><i class="fa-solid fa-triangle-exclamation"></i> Có sự cố tại hiện trường:</div>
                    <ul class="list-disc ml-5 mb-1 text-orange-800 font-medium">
                        ${device.report.issues.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                    ${device.report.note ? `<div class="italic text-gray-700 text-xs">- Ghi chú: ${device.report.note}</div>` : ''}
                    <div class="text-[10px] text-gray-500 mt-2 font-semibold">⏰ Báo cáo lúc: ${device.report.time}</div>
                </div>
            `;
        }

        const opStatus = device.operationStatus || "Chưa cập nhật";
        const connStatus = device.connectionStatus || "Không rõ";

        const card = `
            <div class="rounded-2xl p-4 shadow-sm border ${cardStyle}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center ${iconStyle}">
                            <i class="fa-solid ${iconShape} text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800 text-base leading-tight">${device.name}</h3>
                            <p class="text-xs text-gray-500 mt-1"><i class="fa-solid fa-network-wired w-3"></i> ${device.ip}</p>
                        </div>
                    </div>
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${typeBadgeColor}">${device.type}</span>
                </div>
                
                <div class="flex flex-col gap-1.5 mt-2 pt-3 border-t border-gray-200/60">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-500">Hãng SX:</span>
                        <span class="font-semibold text-gray-700">${device.manufacturer}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-500">Vận hành:</span>
                        <span class="font-semibold text-gray-700">${opStatus}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs mt-1">
                        <span class="text-gray-500">Kết nối:</span>
                        <span class="px-2 py-0.5 rounded border text-[10px] font-bold ${connBadgeStyle}"><i class="fa-solid fa-wifi mr-1"></i>${connStatus}</span>
                    </div>
                </div>

                ${reportHTML}

                <!-- Nút Báo Cáo Hiện Trường -->
                <div class="mt-3 pt-3 border-t border-gray-200/60 flex gap-2">
                    <button onclick="openReport('${device.id}')" class="flex-1 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-100 flex justify-center items-center gap-2">
                        <i class="fa-solid fa-flag text-orange-500"></i> Báo cáo / Ghi chú
                    </button>
                </div>
            </div>
        `;
        deviceListEl.insertAdjacentHTML('beforeend', card);
    });

    // Cập nhật số liệu
    document.getElementById('count-total').textContent = devices.length;
    document.getElementById('count-lbs').textContent = devices.filter(d => d.type && d.type.toUpperCase().includes('LBS')).length;
    document.getElementById('count-mc').textContent = devices.filter(d => d.type && d.type.toUpperCase().includes('MC')).length;
    
    // Đếm số thiết bị đang lỗi
    const warningCount = devices.filter(d => d.report).length;
    document.getElementById('count-warning').textContent = warningCount;
}

// Chạy lần đầu
renderList([]);

// Nút lọc thiết bị có báo cáo lỗi
document.getElementById('filterWarningBtn').addEventListener('click', () => {
    const warningDevices = devices.filter(d => d.report);
    renderList(warningDevices);
    document.getElementById('display-count').innerHTML = `Đang hiển thị <b class="text-orange-600">${warningDevices.length} thiết bị đang có sự cố</b>`;
});

// Tìm kiếm
searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    if (keyword === '') {
        renderList([]);
        document.getElementById('display-count').innerHTML = `Nhập từ khóa để tìm kiếm... <br><span class="text-blue-600 font-bold">Kho dữ liệu: ${devices.length} thiết bị</span>`;
        return;
    }
    const filteredDevices = devices.filter(device => 
        (device.name && device.name.toLowerCase().includes(keyword)) || 
        (device.ip && device.ip.toLowerCase().includes(keyword)) ||
        (device.manufacturer && device.manufacturer.toLowerCase().includes(keyword))
    );
    renderList(filteredDevices);
    document.getElementById('display-count').textContent = `Tìm thấy ${filteredDevices.length}/${devices.length} thiết bị`;
});

// ================= LẬP TRÌNH TÍNH NĂNG BÁO CÁO =================
window.openReport = function(id) {
    const device = devices.find(d => d.id == id);
    if(!device) return;

    document.getElementById('reportDeviceId').value = id;
    document.getElementById('reportDeviceName').textContent = `Thiết bị: ${device.name}`;
    
    // Reset form
    document.querySelectorAll('.report-cb').forEach(cb => cb.checked = false);
    document.getElementById('reportNote').value = '';
    
    // Nếu thiết bị đã có báo cáo cũ, load lại lên form
    if (device.report) {
        document.querySelectorAll('.report-cb').forEach(cb => {
            if (device.report.issues.includes(cb.value)) cb.checked = true;
        });
        document.getElementById('reportNote').value = device.report.note || '';
        document.getElementById('clearReportBtn').classList.remove('hidden');
    } else {
        document.getElementById('clearReportBtn').classList.add('hidden');
    }

    reportModal.classList.remove('hidden');
}

// Lưu báo cáo
document.getElementById('saveReportBtn').addEventListener('click', () => {
    const id = document.getElementById('reportDeviceId').value;
    const deviceIndex = devices.findIndex(d => d.id == id);
    
    const checkedIssues = Array.from(document.querySelectorAll('.report-cb')).filter(cb => cb.checked).map(cb => cb.value);
    const note = document.getElementById('reportNote').value.trim();

    if (checkedIssues.length === 0 && note === '') {
        alert("Vui lòng tick chọn ít nhất 1 lỗi hoặc ghi chú!");
        return;
    }

    // Lấy thời gian hiện tại lúc báo cáo
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN') + ' ngày ' + now.toLocaleDateString('vi-VN');

    devices[deviceIndex].report = {
        issues: checkedIssues,
        note: note,
        time: timeStr
    };

    localStorage.setItem('deviceData', JSON.stringify(devices));
    reportModal.classList.add('hidden');
    
    // Làm mới lại danh sách đang hiển thị
    searchInput.dispatchEvent(new Event('input'));
    alert("Đã ghi nhận báo cáo sự cố thành công!");
});

// Xóa báo cáo (khi đã sửa xong)
document.getElementById('clearReportBtn').addEventListener('click', () => {
    const id = document.getElementById('reportDeviceId').value;
    const deviceIndex = devices.findIndex(d => d.id == id);
    
    if(confirm("Bạn có chắc chắn sự cố này đã được xử lý và muốn xóa báo cáo?")) {
        delete devices[deviceIndex].report;
        localStorage.setItem('deviceData', JSON.stringify(devices));
        reportModal.classList.add('hidden');
        searchInput.dispatchEvent(new Event('input'));
    }
});

document.getElementById('cancelReportBtn').addEventListener('click', () => reportModal.classList.add('hidden'));

// ================= CÁC CHỨC NĂNG THÊM/NHẬP FILE CŨ =================
document.getElementById('addBtn').addEventListener('click', () => addModal.classList.remove('hidden'));
document.getElementById('cancelBtn').addEventListener('click', () => addModal.classList.add('hidden'));

document.getElementById('saveBtn').addEventListener('click', () => {
    const name = document.getElementById('inputName').value.trim();
    const ip = document.getElementById('inputIP').value.trim();
    if(!name || !ip) { alert("Vui lòng nhập Tên và Địa chỉ IP!"); return; }

    devices.unshift({
        id: Date.now(),
        name: name,
        ip: ip,
        manufacturer: document.getElementById('inputManufacturer').value,
        connectionStatus: document.getElementById('inputConnection').value,
        operationStatus: document.getElementById('inputOperation').value || "Bình thường",
        type: document.getElementById('inputType').value
    });

    localStorage.setItem('deviceData', JSON.stringify(devices)); 
    renderList([]); 
    searchInput.value = ''; 
    addModal.classList.add('hidden'); 
    alert("Đã thêm thiết bị thành công!");
});

document.getElementById('importCsv').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        const rows = text.split('\n').slice(1);
        let newDevices = [];

        rows.forEach((row, index) => {
            if (!row.trim()) return;
            const cols = row.split(','); 
            if (cols.length >= 6) {
                newDevices.push({
                    id: Date.now() + index,
                    name: cols[0] ? cols[0].trim() : "",
                    ip: cols[1] ? cols[1].trim() : "",
                    manufacturer: cols[2] ? cols[2].trim() : "",
                    connectionStatus: cols[3] ? cols[3].trim() : "",
                    operationStatus: cols[4] ? cols[4].trim() : "",
                    type: cols[5] ? cols[5].trim() : ""
                });
            }
        });
        devices = [...newDevices, ...devices];
        localStorage.setItem('deviceData', JSON.stringify(devices));
        renderList([]); 
        alert(`Đã tải lên thành công ${newDevices.length} thiết bị từ file CSV!`);
    };
    reader.readAsText(file);
});