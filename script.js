async function readItemsFromExcel() {
    const response = await fetch("Items.xlsx");
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const items = [];
    for (let i = 1; i < 90; i++) {
        const [ korName, name, weight, volume, description] = rows[i];
        items.push({
            id: i,
            korName : korName,
            name: name,
            weight: weight || 0, 
            volume : volume || 0,
            description: description,
            imgsource : "resource/choco.png"
        });
    }

    return items;
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
        this.quantityValue = document.getElementById('quantity-value');
        this.addToBagBtn = document.querySelector('.modal-content button:last-child');
    }

    populateInventory() {
        const itemsGrid = document.querySelector('.items-grid');
        itemsGrid.innerHTML = ''; // 기존 아이템 비우기

        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.draggable = true;
            itemElement.dataset.id = item.id;
            itemElement.dataset.korName = item.korName;
            itemElement.dataset.name = item.name;
            itemElement.dataset.weight = item.weight;
            itemElement.dataset.volume = item.volume;
            itemElement.dataset.description = item.description;

            const img = document.createElement('img');
            img.src = item.imgsource;
            img.alt = item.korName;

            const itemInfo = document.createElement('span');
            itemInfo.className = 'item-info';
            itemInfo.textContent = item.weight;

            itemElement.appendChild(img);
            itemElement.appendChild(itemInfo);
            itemsGrid.appendChild(itemElement);
        });
    }

    initializeEventListeners() {
        // 아이템 클릭 이벤트
        document.querySelectorAll('.item').forEach(item => {
            item.addEventListener('click', (e) => this.openItemModal(e.currentTarget));
        });

        // 검색 기능
        this.searchInput.addEventListener('input', this.handleSearch.bind(this));

        // 모달 관련 이벤트
        this.modalClose.addEventListener('click', () => this.closeItemModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeItemModal();
        });

        // 수량 입력에 대한 이벤트
        this.quantityValue.addEventListener('input', () => {
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
        this.quantityValue.textContent = '1';
        
        this.modal.style.display = 'block';
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.item').forEach(item => {
            const itemKorName = item.dataset.korName.toLowerCase();
            if (itemKorName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // 나머지 메서드들은 기존과 동일하게 유지
    closeItemModal() {
        this.modal.style.display = 'none';
        this.selectedItem = null;
    }

    updateModalStats() {
        const quantity = parseInt(this.quantityValue.textContent) || 1;
        const totalWeight = (this.selectedItem.weight * quantity).toFixed(1);
        const totalVolume = (this.selectedItem.volume * quantity).toFixed(1);
        
        this.modalItemWeight.textContent = `${totalWeight}kg`;
        this.modalItemVolume.textContent = `${totalVolume}㎥`;

        const projectedWeight = this.currentWeight + (this.selectedItem.weight * quantity);
        const projectedVolume = this.currentVolume + (this.selectedItem.volume * quantity);
        
        if (projectedWeight > this.maxWeight || projectedVolume > this.maxVolume) {
            this.addToBagBtn.disabled = true;
            this.addToBagBtn.style.backgroundColor = '#666';
        } else {
            this.addToBagBtn.disabled = false;
            this.addToBagBtn.style.backgroundColor = '#2ecc71';
        }
    }

    addItemToBag() {
        const quantity = parseInt(this.quantityValue.textContent) || 1;
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

    removeItem(item, weight, volume) {
        this.bagContainer.removeChild(item);
        this.updateCapacity(-weight, -volume);
    }

    updateCapacity(weight, volume) {
        const weightNum = parseFloat(weight) || 0;
        const volumeNum = parseFloat(volume) || 0;

        this.currentWeight = Math.max(0, this.currentWeight + weightNum);
        this.currentVolume = Math.max(0, this.currentVolume + volumeNum);

        const weightPercentage = Math.min(100, ((this.currentWeight / this.maxWeight) * 100)).toFixed(2);
        const volumePercentage = Math.min(100, ((this.currentVolume / this.maxVolume) * 100)).toFixed(2);

        this.weightBar.style.width = `${weightPercentage}%`;
        this.volumeBar.style.width = `${volumePercentage}%`;

        this.weightInfo.textContent = `${this.currentWeight.toFixed(1)}/${this.maxWeight}`;
        this.volumeInfo.textContent = `${this.currentVolume.toFixed(1)}/${this.maxVolume}`;
    }

    startTimer() {
        const timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timerElement.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                clearInterval(timerInterval);
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        alert('시간이 종료되었습니다!');
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    new InventorySystem();
});