let devices = JSON.parse(localStorage.getItem('deviceData')) || [];

const deviceListEl = document.getElementById('deviceList');
const searchInput = document.getElementById('searchInput');
const addModal = document.getElementById('addModal');

function renderList(dataToRender) {
    deviceListEl.innerHTML = '';
    
    dataToRender.forEach(device => {
        // 1. Xác định hình khối: MC = Vuông, LBS = Thoi
        const isMC = device.type && device.type.toUpperCase().includes('MC');
        const iconShape = isMC ? 'fa-square' : 'fa-diamond';
        const typeBadgeColor = isMC ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700';

        // 2. Logic Màu sắc dựa trên Tình trạng kết nối
        const isGood = device.connectionStatus && device.connectionStatus.toLowerCase().includes('tốt');
        
        let cardStyle, iconStyle, connBadgeStyle;
        
        if (isGood) {
            // MÀU XANH: Khi kết nối tốt
            cardStyle = "border-green-300 bg-green-50/40"; // Nền xanh nhạt, viền xanh
            iconStyle = "text-green-500 bg-green-100"; // Icon xanh
            connBadgeStyle = "bg-green-100 text-green-700 border-green-200"; // Nhãn kết nối xanh
        } else {
            // MÀU XÁM/ĐỎ: Khi mất kết nối hoặc rỗng
            cardStyle = "border-gray-200 bg-white"; // Nền trắng, viền xám
            iconStyle = "text-gray-400 bg-gray-100"; // Icon xám
            connBadgeStyle = "bg-red-50 text-red-600 border-red-200"; // Nhãn kết nối báo đỏ
        }

        // Tình trạng vận hành (Nếu trống thì ghi "Chưa cập nhật")
        const opStatus = device.operationStatus || "Chưa cập nhật";
        const connStatus = device.connectionStatus || "Không rõ";

        const card = `
            <div class="rounded-2xl p-4 shadow-sm border ${cardStyle}">
                <!-- Dòng 1: Icon + Tên + Nhãn Loại Thiết bị -->
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
                
                <!-- Dòng 2: Hãng SX + Các trạng thái -->
                <div class="flex flex-col gap-2 mt-2 pt-3 border-t border-gray-200/60">
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
            </div>
        `;
        deviceListEl.insertAdjacentHTML('beforeend', card);
    });

    if (searchInput.value.trim() === '') {
        document.getElementById('display-count').innerHTML = `Nhập từ khóa để tìm kiếm... <br><span class="text-blue-600 font-bold">Kho dữ liệu: ${devices.length} thiết bị</span>`;
    } else {
        document.getElementById('display-count').textContent = `Tìm thấy ${dataToRender.length}/${devices.length} thiết bị`;
    }
    
    document.getElementById('count-total').textContent = devices.length;
    document.getElementById('count-lbs').textContent = devices.filter(d => d.type && d.type.toUpperCase().includes('LBS')).length;
    document.getElementById('count-mc').textContent = devices.filter(d => d.type && d.type.toUpperCase().includes('MC')).length;
}

// Chạy lần đầu: Ẩn danh sách
renderList([]);

searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    if (keyword === '') {
        renderList([]);
        return;
    }
    const filteredDevices = devices.filter(device => 
        (device.name && device.name.toLowerCase().includes(keyword)) || 
        (device.ip && device.ip.toLowerCase().includes(keyword)) ||
        (device.manufacturer && device.manufacturer.toLowerCase().includes(keyword)) ||
        (device.operationStatus && device.operationStatus.toLowerCase().includes(keyword))
    );
    renderList(filteredDevices);
});

document.getElementById('addBtn').addEventListener('click', () => addModal.classList.remove('hidden'));
document.getElementById('cancelBtn').addEventListener('click', () => addModal.classList.add('hidden'));

// Lưu thiết bị thủ công
document.getElementById('saveBtn').addEventListener('click', () => {
    const name = document.getElementById('inputName').value.trim();
    const ip = document.getElementById('inputIP').value.trim();
    
    if(!name || !ip) {
        alert("Vui lòng nhập Tên và Địa chỉ IP!");
        return;
    }

    const newDevice = {
        id: Date.now(),
        name: name,
        ip: ip,
        manufacturer: document.getElementById('inputManufacturer').value || "",
        connectionStatus: document.getElementById('inputConnection').value,
        operationStatus: document.getElementById('inputOperation').value || "Bình thường",
        type: document.getElementById('inputType').value
    };

    devices.unshift(newDevice); 
    localStorage.setItem('deviceData', JSON.stringify(devices)); 
    
    renderList([]); 
    searchInput.value = ''; 
    addModal.classList.add('hidden'); 
    
    // Reset form
    document.getElementById('inputName').value = '';
    document.getElementById('inputIP').value = '';
    document.getElementById('inputManufacturer').value = '';
    document.getElementById('inputOperation').value = '';
    
    alert("Đã thêm thiết bị thành công!");
});

// Chức năng Nhập File CSV chuẩn 6 cột
document.getElementById('importCsv').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        const rows = text.split('\n').slice(1); // Bỏ dòng tiêu đề
        let newDevices = [];

        rows.forEach((row, index) => {
            if (!row.trim()) return;
            
            // Tách cột bằng dấu phẩy
            const cols = row.split(','); 
            
            // Đảm bảo lấy đúng 6 cột theo thứ tự file Excel của bạn
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

        if (newDevices.length === 0) {
            alert("Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra lại file CSV (Cần đủ 6 cột)!");
            return;
        }

        devices = [...newDevices, ...devices];
        localStorage.setItem('deviceData', JSON.stringify(devices));
        
        renderList([]); 
        alert(`Đã tải lên thành công ${newDevices.length} thiết bị từ file CSV!`);
    };
    reader.readAsText(file);
});