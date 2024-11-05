async function readItemsFromExcel() {
    try {
        const response = await fetch("Items.xlsx");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
        
        // 첫 번째 시트 선택
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 시트의 데이터를 JSON으로 변환
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        // 데이터 매핑
        const items = data.map((row, index) => ({
            id: index + 1,
            korName: row['korName'] || '',
            name: row['name'] || '',
            weight: parseFloat(row['weight']) || 0,
            volume: parseFloat(row['volume']) || 0,
            description: row['description'] || '',
            imgsource: `resource/${row['name']}.png`
        }));

        console.log('Loaded items:', items); // 디버깅용
        return items;
        
    } catch (error) {
        console.error('Error reading Excel file:', error);
        // 에러 발생 시 빈 배열 반환하여 시스템이 계속 작동할 수 있도록 함
        return [];
    }
}

class InventorySystem {
    constructor() {
        this.maxWeight = 100;
        this.maxVolume = 100;
        this.currentWeight = 0;
        this.currentVolume = 0;
        this.timeLeft = 150;
        this.items = [];
        
        this.initializeSystem();
    }

    async initializeSystem() {
        try {
            this.items = await readItemsFromExcel();
            this.initializeElements();
            this.populateInventory();
            this.initializeEventListeners();
            this.startTimer();
        } catch (error) {
            console.error("Failed to initialize system:", error);
        }
    }
    initializeElements() {
        this.bagContainer = document.getElementById('bag-container');
        this.weightBar = document.getElementById('weight-bar');
        this.volumeBar = document.getElementById('volume-bar');
        this.weightInfo = document.getElementById('weight-info');
        this.volumeInfo = document.getElementById('volume-info');
        this.searchInput = document.querySelector('.search-bar input');
        this.timerElement = document.getElementById('timer-count');

        // 모달 관련 요소들
        this.modal = document.getElementById('item-modal');
        this.modalClose = document.querySelector('.modal-content > div:first-child');
        this.modalItemImg = document.getElementById('modal-item-img');
        this.modalItemName = document.getElementById('modal-item-name');
        this.modalItemWeight = document.getElementById('modal-item-weight');
        this.modalItemVolume = document.getElementById('modal-item-volume');
        this.modalItemDescription = document.getElementById('modal-item-description');
        
        // 수량 선택 슬라이더 요소 추가
        const sliderContainer = document.querySelector('.slider-container');
        this.quantityValue = document.getElementById('quantity-value');
        
        // 슬라이더 생성
        this.quantitySlider = document.createElement('input');
        this.quantitySlider.type = 'range';
        this.quantitySlider.min = '0';
        this.quantitySlider.max = '10';
        this.quantitySlider.value = '1';
        this.quantitySlider.step = '1';
        this.quantitySlider.style.width = '100%';
        sliderContainer.insertBefore(this.quantitySlider, this.quantityValue);
        
        this.addToBagBtn = document.querySelector('.modal-content button:last-child');
    }

    initializeEventListeners() {
        // 기존 이벤트 리스너들
        document.querySelectorAll('.item').forEach(item => {
            item.addEventListener('click', (e) => this.openItemModal(e.currentTarget));
        });

        this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        this.modalClose.addEventListener('click', () => this.closeItemModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeItemModal();
        });

        // 슬라이더 이벤트 리스너 추가
        this.quantitySlider.addEventListener('input', () => {
            this.quantityValue.textContent = this.quantitySlider.value;
            this.updateModalStats();
        });

        this.addToBagBtn.addEventListener('click', () => this.addItemToBag());
    }

    openItemModal(itemElement) {
        const itemId = itemElement.dataset.id;
        const item = this.items.find(i => i.id === parseInt(itemId));
        
        if (!item) return;

        this.selectedItem = {
            element: itemElement,
            ...item
        };

        this.modalItemImg.src = item.imgsource;
        this.modalItemName.textContent = item.korName;
        this.modalItemWeight.textContent = `${item.weight}kg`;
        this.modalItemVolume.textContent = `${item.volume}㎥`;
        this.modalItemDescription.textContent = item.description;
        
        // 슬라이더와 수량 값 초기화
        this.quantitySlider.value = '1';
        this.quantityValue.textContent = '1';
        this.updateModalStats();
        
        this.modal.style.display = 'block';
    }

    updateModalStats() {
        const quantity = parseInt(this.quantitySlider.value) || 0;
        const totalWeight = (this.selectedItem.weight * quantity).toFixed(1);
        const totalVolume = (this.selectedItem.volume * quantity).toFixed(1);
        
        this.modalItemWeight.textContent = `${totalWeight}kg`;
        this.modalItemVolume.textContent = `${totalVolume}㎥`;

        const projectedWeight = this.currentWeight + (this.selectedItem.weight * quantity);
        const projectedVolume = this.currentVolume + (this.selectedItem.volume * quantity);
        
        // 수량이 0이거나 용량을 초과할 경우 버튼 비활성화
        if (quantity === 0 || projectedWeight > this.maxWeight || projectedVolume > this.maxVolume) {
            this.addToBagBtn.disabled = true;
            this.addToBagBtn.style.backgroundColor = '#666';
        } else {
            this.addToBagBtn.disabled = false;
            this.addToBagBtn.style.backgroundColor = '#2ecc71';
        }
    }

    addItemToBag() {
        const quantity = parseInt(this.quantitySlider.value);
        const totalWeight = this.selectedItem.weight * quantity;
        const totalVolume = this.selectedItem.volume * quantity;

        if (this.currentWeight + totalWeight > this.maxWeight ||
            this.currentVolume + totalVolume > this.maxVolume) {
            alert('가방의 용량이나 무게 제한을 초과합니다!');
            return;
        }

        for (let i = 0; i < quantity; i++) {
            const newItem = document.createElement('div');
            newItem.className = 'item in-bag';
            newItem.dataset.weight = this.selectedItem.weight;
            newItem.dataset.volume = this.selectedItem.volume;
            
            const img = document.createElement('img');
            img.src = this.selectedItem.imgsource;
            img.alt = this.selectedItem.korName;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-item';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = () => this.removeItem(newItem, this.selectedItem.weight, this.selectedItem.volume);
            
            newItem.appendChild(img);
            newItem.appendChild(deleteBtn);
            this.bagContainer.appendChild(newItem);
        }

        this.updateCapacity(totalWeight, totalVolume);
        this.closeItemModal();
    }
}

// 초기화

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    new InventorySystem();
});