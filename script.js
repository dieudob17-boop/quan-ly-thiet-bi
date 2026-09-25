let devices = JSON.parse(localStorage.getItem('deviceData')) || [];

const deviceListEl = document.getElementById('deviceList');
const searchInput = document.getElementById('searchInput');
const addModal = document.getElementById('addModal');

// Hàm vẽ danh sách ra màn hình
function renderList(dataToRender) {
    deviceListEl.innerHTML = '';
    
    dataToRender.forEach(device => {
        // Cài đặt icon: REC/MC = vuông (fa-square), LBS = thoi (fa-diamond)
        const iconShape = device.type === 'REC/MC' ? 'fa-square' : 'fa-diamond';
        const typeColor = device.type === 'REC/MC' ? 'text-teal-600 bg-teal-100' : 'text-green-600 bg-green-100';

        const card = `
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <!-- Bỏ màu icon xanh/đỏ, chuyển thành màu xám trung tính -->
                    <div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                        <i class="fa-solid ${iconShape} text-gray-500 text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg">${device.name}</h3>
                        <div class="text-sm text-gray-500 flex flex-col gap-1 mt-1">
                            <span><i class="fa-solid fa-server w-4"></i> Hãng: ${device.manufacturer}</span>
                            <!-- Hiển thị rõ chữ Tình trạng vận hành -->
                            <span><i class="fa-solid fa-wave-square w-4"></i> Trạng thái: <b>${device.status}</b></span>
                        </div>
                        <div class="text-sm text-gray-400 mt-1">${device.ip}</div>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <span class="px-2 py-1 rounded text-xs font-bold ${typeColor}">${device.type}</span>
                    <i class="fa-solid fa-chevron-right text-gray-300"></i>
                </div>
            </div>
        `;
        deviceListEl.insertAdjacentHTML('beforeend', card);
    });

    // Cập nhật bộ đếm phía trên
    if (searchInput.value.trim() === '') {
        document.getElementById('display-count').textContent = `Nhập từ khóa để tìm kiếm... (Tổng kho: ${devices.length})`;
    } else {
        document.getElementById('display-count').textContent = `Tìm thấy ${dataToRender.length}/${devices.length} thiết bị`;
    }
    
    document.getElementById('count-total').textContent = devices.length;
    document.getElementById('count-lbs').textContent = devices.filter(d => d.type === 'LBS').length;
    document.getElementById('count-mc').textContent = devices.filter(d => d.type === 'REC/MC').length;
}

// Chạy lần đầu: Truyền mảng rỗng [] để ẩn danh sách ban đầu, chỉ hiện bộ đếm
renderList([]);

// Chức năng Tìm kiếm (Nhập vào mới hiện)
searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().trim();
    
    // Nếu xóa hết chữ, danh sách sẽ tự ẩn đi
    if (keyword === '') {
        renderList([]);
        return;
    }

    const filteredDevices = devices.filter(device => 
        device.name.toLowerCase().includes(keyword) || 
        device.ip.toLowerCase().includes(keyword) ||
        device.manufacturer.toLowerCase().includes(keyword)
    );
    renderList(filteredDevices);
});

// Chức năng bật/tắt cửa sổ thêm
document.getElementById('addBtn').addEventListener('click', () => addModal.classList.remove('hidden'));
document.getElementById('cancelBtn').addEventListener('click', () => addModal.classList.add('hidden'));

// Chức năng Thêm thủ công 1 thiết bị
document.getElementById('saveBtn').addEventListener('click', () => {
    const name = document.getElementById('inputName').value.trim();
    const ip = document.getElementById('inputIP').value.trim();
    
    if(!name || !ip) {
        alert("Bạn phải nhập Tên và IP!");
        return;
    }

    const newDevice = {
        id: Date.now(),
        type: document.getElementById('inputType').value,
        name: name,
        ip: ip,
        manufacturer: document.getElementById('inputManufacturer').value || "Chưa rõ",
        status: document.getElementById('inputStatus').value
    };

    devices.unshift(newDevice); 
    localStorage.setItem('deviceData', JSON.stringify(devices)); 
    
    renderList([]); // Reset về giao diện rỗng sau khi thêm xong
    searchInput.value = ''; // Xóa chữ trong ô tìm kiếm
    addModal.classList.add('hidden'); 
    
    document.getElementById('inputName').value = '';
    document.getElementById('inputIP').value = '';
    document.getElementById('inputManufacturer').value = '';
    
    alert("Đã thêm thành công!");
});

// Chức năng Nhập File CSV 600 thiết bị
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
            if (cols.length >= 5) {
                newDevices.push({
                    id: Date.now() + index,
                    name: cols[0].trim(),
                    ip: cols[1].trim(),
                    manufacturer: cols[2].trim(),
                    status: cols[3].trim(),
                    type: cols[4].trim()
                });
            }
        });

        devices = [...newDevices, ...devices];
        localStorage.setItem('deviceData', JSON.stringify(devices));
        
        renderList([]); // Cập nhật lại số lượng ở Header nhưng vẫn giữ màn hình rỗng
        alert(`Đã tải lên thành công ${newDevices.length} thiết bị từ file!`);
    };
    reader.readAsText(file);
});