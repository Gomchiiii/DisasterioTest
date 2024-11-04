class InventorySystem {
    constructor() {
        this.maxWeight = 100;
        this.maxVolume = 100;
        this.currentWeight = 0;
        this.currentVolume = 0;
        this.timeLeft = 150;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.startTimer();
    }

    initializeElements() {
        this.bagContainer = document.getElementById('bag-container');
        this.weightBar = document.getElementById('weight-bar');
        this.volumeBar = document.getElementById('volume-bar');
        this.weightInfo = document.getElementById('weight-info');
        this.volumeInfo = document.getElementById('volume-info');
        this.searchInput = document.getElementById('search-input');
        this.timerElement = document.getElementById('timer-count');

        // 모달 관련 요소들
        this.modal = document.getElementById('item-modal');
        this.modalClose = document.getElementById('modal-close');
        this.modalItemImg = document.getElementById('modal-item-img');
        this.modalItemName = document.getElementById('modal-item-name');
        this.modalItemDesc = document.getElementById('modal-item-desc');
        this.modalItemWeight = document.getElementById('modal-item-weight');
        this.modalItemVolume = document.getElementById('modal-item-volume');
        this.quantitySlider = document.getElementById('quantity-slider');
        this.quantityValue = document.getElementById('quantity-value');
        this.addToBagBtn = document.getElementById('add-to-bag-btn');
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

        this.quantitySlider.addEventListener('input', () => {
            this.quantityValue.textContent = this.quantitySlider.value;
            this.updateModalStats();
        });

        this.addToBagBtn.addEventListener('click', () => this.addItemToBag());
    }

    openItemModal(item) {
        this.selectedItem = {
            element: item,
            name: item.dataset.name,
            weight: parseFloat(item.dataset.weight) || 0,
            volume: parseFloat(item.dataset.volume) || 0,
            desc: item.dataset.desc,
            img: item.querySelector('img').src
        };

        this.modalItemImg.src = this.selectedItem.img;
        this.modalItemName.textContent = this.selectedItem.name;
        this.modalItemDesc.textContent = this.selectedItem.desc;
        this.quantitySlider.value = 1;
        this.quantityValue.textContent = 1;
        this.updateModalStats();

        this.modal.style.display = 'block';
    }

    closeItemModal() {
        this.modal.style.display = 'none';
        this.selectedItem = null;
    }

    updateModalStats() {
        const quantity = parseInt(this.quantitySlider.value) || 1;
        const totalWeight = (this.selectedItem.weight * quantity).toFixed(1);
        const totalVolume = (this.selectedItem.volume * quantity).toFixed(1);
        
        this.modalItemWeight.textContent = `${totalWeight}kg`;
        this.modalItemVolume.textContent = `${totalVolume}㎥`;

        // 용량 초과 체크
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
        const quantity = parseInt(this.quantitySlider.value) || 1;
        const totalWeight = this.selectedItem.weight * quantity;
        const totalVolume = this.selectedItem.volume * quantity;

        if (this.currentWeight + totalWeight > this.maxWeight ||
            this.currentVolume + totalVolume > this.maxVolume) {
            alert('가방의 용량이나 무게 제한을 초과합니다!');
            return;
        }

        for (let i = 0; i < quantity; i++) {
            const newItem = this.selectedItem.element.cloneNode(true);
            newItem.classList.add('in-bag');
            
            // 삭제 버튼 추가
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-item';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = () => this.removeItem(newItem, this.selectedItem.weight, this.selectedItem.volume);
            newItem.appendChild(deleteBtn);
            
            this.bagContainer.appendChild(newItem);
        }

        this.updateCapacity(totalWeight, totalVolume);
        this.closeItemModal();
    }

    removeItem(item, weight, volume) {
        //item.remove();
        this.bagContainer.removeChild(item);
        this.updateCapacity(-weight, -volume);
    }

    updateCapacity(weight, volume) {
        // 숫자형으로 명시적 변환
        const weightNum = parseFloat(weight) || 0;
        const volumeNum = parseFloat(volume) || 0;

        this.currentWeight = Math.max(0, this.currentWeight + weightNum);
        this.currentVolume = Math.max(0, this.currentVolume + volumeNum);

        // 소수점 둘째자리까지 표시
        const weightPercentage = Math.min(100, ((this.currentWeight / this.maxWeight) * 100)).toFixed(2);
        const volumePercentage = Math.min(100, ((this.currentVolume / this.maxVolume) * 100)).toFixed(2);

        this.weightBar.style.width = `${weightPercentage}%`;
        this.volumeBar.style.width = `${volumePercentage}%`;

        this.weightInfo.textContent = `${this.currentWeight.toFixed(1)}/${this.maxWeight}`;
        this.volumeInfo.textContent = `${this.currentVolume.toFixed(1)}/${this.maxVolume}`;
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.item').forEach(item => {
            const itemName = item.dataset.name.toLowerCase();
            if (itemName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
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