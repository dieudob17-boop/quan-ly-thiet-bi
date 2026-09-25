// Dữ liệu mẫu ban đầu
const defaultDevices = [
    { id: 1, type: "LBS", name: "LBS 471E16.1/41a", ip: "172.16.0.59", manufacturer: "WSOS", status: "Bình thường" },
    { id: 2, type: "REC/MC", name: "MC 471E16.1/41/2A", ip: "172.17.46.28", manufacturer: "WSOS", status: "Bình thường" },
    { id: 3, type: "REC/MC", name: "MC 471E16.1/41/71A", ip: "172.16.0.196", manufacturer: "ENTEC", status: "Bình thường" }
];

// Lấy dữ liệu từ bộ nhớ máy tính, nếu không có thì lấy dữ liệu mẫu
let devices = JSON.parse(localStorage.getItem('deviceData')) || defaultDevices;

const deviceListEl = document.getElementById('deviceList');
const searchInput = document.getElementById('searchInput');
const addModal = document.getElementById('addModal');

// Hàm vẽ danh sách ra màn hình
function renderList(dataToRender) {
    deviceListEl.innerHTML = '';
    
    dataToRender.forEach(device => {
        const typeColor = device.type === 'LBS' ? 'text-green-600 bg-green-100' : 'text-teal-600 bg-teal-100';
        const iconColor = device.status === 'Bình thường' ? 'text-green-500' : 'text-red-500';

        const card = `
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-diamond ${iconColor} text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 text-lg">${device.name}</h3>
                        <div class="text-sm text-gray-500 flex items-center gap-3 mt-1">
                            <span><i class="fa-solid fa-server"></i> ${device.manufacturer}</span>
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

    document.getElementById('display-count').textContent = `Hiển thị ${dataToRender.length}/${devices.length} thiết bị`;
    document.getElementById('count-total').textContent = devices.length;
    document.getElementById('count-lbs').textContent = devices.filter(d => d.type === 'LBS').length;
    document.getElementById('count-mc').textContent = devices.filter(d => d.type === 'REC/MC').length;
}

// Chạy lần đầu
renderList(devices);

// Chức năng Tìm kiếm
searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
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

// Chức năng Lưu
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

    devices.unshift(newDevice); // Thêm vào danh sách
    localStorage.setItem('deviceData', JSON.stringify(devices)); // Lưu vào máy
    
    renderList(devices); // Cập nhật màn hình
    addModal.classList.add('hidden'); // Ẩn cửa sổ
    
    // Xóa trắng form cũ
    document.getElementById('inputName').value = '';
    document.getElementById('inputIP').value = '';
    document.getElementById('inputManufacturer').value = '';
});// Chức năng đọc file CSV và cập nhật vào kho
document.getElementById('importCsv').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        
        // Tách từng dòng, bỏ qua dòng tiêu đề (dòng 1)
        const rows = text.split('\n').slice(1); 
        let newDevices = [];

        rows.forEach((row, index) => {
            if (!row.trim()) return;
            
            // Tách các cột bằng dấu phẩy
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

        // Đẩy 600 dữ liệu mới vào kho cũ và lưu lên máy
        devices = [...newDevices, ...devices];
        localStorage.setItem('deviceData', JSON.stringify(devices));
        
        // Cập nhật lại màn hình
        renderList(devices);
        alert(`Đã tải lên thành công ${newDevices.length} thiết bị từ file!`);
    };
    reader.readAsText(file);
});