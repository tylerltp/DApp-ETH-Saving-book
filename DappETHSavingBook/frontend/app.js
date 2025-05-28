let provider;
let signer;
let contract;
let userAccount = null;

const CONTRACT_ADDRESS = "0x2CdcCad8C6AEC967C7709e5f07A68188E997E885";

const CONTRACT_ABI = [
    {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "Deposited", "type": "event"},
    {"anonymous": false, "inputs": [{"indexed": true, "internalType": "address", "name": "user", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "Withdrawn", "type": "event"},
    {"inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function"},
    {"inputs": [], "name": "getBalance", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
];

const walletConnectSection = document.getElementById('walletConnectSection');
const mainDAppSection = document.getElementById('mainDAppSection');
const connectErrorStatus = document.getElementById('connectErrorStatus');

const connectWalletButton = document.getElementById('connectWalletButton');
const depositButton = document.getElementById('depositButton');
const withdrawButton = document.getElementById('withdrawButton');
const depositSpinner = document.getElementById('depositSpinner');
const withdrawSpinner = document.getElementById('withdrawSpinner');

const balanceModal = document.getElementById('balanceModal');
const depositModal = document.getElementById('depositModal');
const withdrawModal = document.getElementById('withdrawModal');

const balanceCloseButton = balanceModal.querySelector('.close-button');
const depositCloseButton = depositModal.querySelector('.close-button');
const withdrawCloseButton = withdrawModal.querySelector('.close-button');

const balanceContinueButton = document.getElementById('balanceContinueButton');
const depositContinueButton = document.getElementById('depositContinueButton');
const withdrawContinueButton = document.getElementById('withdrawContinueButton');


function showSection(sectionId) {
    if (sectionId === 'walletConnect') {
        walletConnectSection.style.display = 'block';
        mainDAppSection.style.display = 'none';
    } else if (sectionId === 'mainDApp') {
        walletConnectSection.style.display = 'none';
        mainDAppSection.style.display = 'block';
    }
}

function updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    const errorDiv = document.getElementById('error');

    statusDiv.className = '';
    errorDiv.className = '';
    errorDiv.style.display = 'none';
    statusDiv.style.display = 'block';

    if (type === 'error' || type === 'failed') {
        errorDiv.innerText = message; 
        errorDiv.style.display = 'block';
        errorDiv.classList.add('failed');
        statusDiv.style.display = 'none'; 
    } else if (type === 'success') {
        statusDiv.innerText = message;
        statusDiv.classList.add('success');
    } else if (type === 'pending') {
        statusDiv.innerText = message;
        statusDiv.classList.add('pending');
    } else { 
        statusDiv.innerText = message;
    }
}


function updateConnectError(message, isError = false) {
    if (isError) {
        connectErrorStatus.innerText = message;
        connectErrorStatus.style.display = 'block';
        connectErrorStatus.classList.add('failed');
    } else {
        connectErrorStatus.innerText = '';
        connectErrorStatus.style.display = 'none';
        connectErrorStatus.classList.remove('failed');
    }
}

function showModal(modalId, message) {
    const modal = document.getElementById(modalId);
    const statusElement = modal.querySelector('.modal-status');
    
    if (statusElement) {
        statusElement.innerText = message;
    }
    modal.style.display = "flex"; 
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "none";
    updateBalanceDisplay(); 
    updateStatus("Sẵn sàng.", 'info');
}

async function updateBalanceDisplay() {
    if (!contract || !userAccount) {
        document.getElementById('contractBalance').innerText = "0.00";
        return;
    }
    try {
        const balanceWei = await contract.getBalance(); 
        const balanceEth = ethers.utils.formatEther(balanceWei);
        document.getElementById('contractBalance').innerText = parseFloat(balanceEth).toFixed(4);
    } catch (error) {
        console.error("Lỗi khi cập nhật số dư trên giao diện chính:", error);
        document.getElementById('contractBalance').innerText = "Lỗi";
    }
}

balanceCloseButton.addEventListener('click', () => hideModal('balanceModal'));
depositCloseButton.addEventListener('click', () => hideModal('depositModal'));
withdrawCloseButton.addEventListener('click', () => hideModal('withdrawModal'));

balanceContinueButton.addEventListener('click', () => hideModal('balanceModal'));
depositContinueButton.addEventListener('click', () => hideModal('depositModal'));
withdrawContinueButton.addEventListener('click', () => hideModal('withdrawModal'));

async function connectWallet() {
    updateConnectError("Đang kết nối ví...", false);
    connectWalletButton.disabled = true;

    try {
        if (typeof window.ethereum !== 'undefined') {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0]; // Lấy tài khoản đầu tiên
            document.getElementById('accountAddress').innerText = userAccount;
            signer = provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            updateConnectError("", false);
            showSection('mainDApp');
            updateStatus("Đã kết nối ví thành công!", 'success');
            updateBalanceDisplay(); 
        } else {
            updateConnectError("MetaMask không được tìm thấy. Vui lòng cài đặt MetaMask.", true);
            showSection('walletConnect');
        }
    } catch (error) {
        let errorMessage = "Lỗi khi kết nối ví. Vui lòng thử lại.";
        if (error.code === 4001) {
            errorMessage = "Người dùng đã từ chối kết nối. Vui lòng chấp nhận trong MetaMask.";
        } else if (error.message.includes("No Ethereum provider was found on window.ethereum")) {
            errorMessage = "MetaMask không được tìm thấy. Vui lòng cài đặt MetaMask.";
        }
        updateConnectError(errorMessage, true);
        showSection('walletConnect');
        console.error("Lỗi kết nối ví:", error);
    } finally {
        connectWalletButton.disabled = false;
    }
}

async function getContractBalance() {
    if (!contract || !userAccount) {
        document.getElementById('contractBalance').innerText = "0.00";
        updateStatus("Vui lòng kết nối ví trước.", 'error');
        return;
    }
    try {
        const balanceWei = await contract.getBalance(); 
        const balanceEth = ethers.utils.formatEther(balanceWei);
        showModal('balanceModal', `Số dư hiện tại của bạn là: ${parseFloat(balanceEth).toFixed(4)} ETH`);
    } catch (error) {
        updateStatus(`Không thể lấy số dư: ${error.message}`, 'error'); // Đã chỉnh thông báo lỗi
        console.error(error);
    }
}

async function depositEth() {
    if (!contract || !signer) {
        updateStatus("Vui lòng kết nối ví trước.", 'error');
        return;
    }

    const amountInput = document.getElementById('depositAmount');
    const amountEth = parseFloat(amountInput.value);

    if (isNaN(amountEth) || amountEth <= 0) {
        updateStatus("Vui lòng nhập số ETH hợp lệ để gửi.", 'error');
        return;
    }

    depositButton.disabled = true;
    depositSpinner.style.display = 'inline-block';
    updateStatus(`Đang gửi ${amountEth} ETH... Vui lòng xác nhận trong MetaMask.`, 'pending');

    try {
        const amountWei = ethers.utils.parseEther(amountEth.toString());
        const tx = await contract.deposit({ value: amountWei });
        updateStatus('Đã gửi giao dịch. Đang chờ xác nhận...', 'pending');
        await tx.wait();
        showModal('depositModal', 'Giao dịch gửi tiền thành công!');
    } catch (error) {
        let errorMessage = "Không thể gửi tiền. Vui lòng thử lại.";
        if (error.code === 4001) { 
            errorMessage = "Người dùng đã từ chối giao dịch."; 
        } else if (error.message.includes("insufficient funds")) {
            errorMessage = "Số dư không đủ để thực hiện giao dịch.";
        }
        updateStatus(errorMessage, 'failed'); 
        console.error(error);
    } finally {
        depositButton.disabled = false;
        depositSpinner.style.display = 'none';
    }
}

async function withdrawEth() {
    if (!contract || !signer) {
        updateStatus("Vui lòng kết nối ví trước.", 'error');
        return;
    }

    const amountInput = document.getElementById('withdrawAmount');
    const amountEth = parseFloat(amountInput.value);

    if (isNaN(amountEth) || amountEth <= 0) {
        updateStatus("Vui lòng nhập số ETH hợp lệ để rút.", 'error');
        return;
    }

    withdrawButton.disabled = true;
    withdrawSpinner.style.display = 'inline-block';
    updateStatus(`Đang rút ${amountEth} ETH... Vui lòng xác nhận trong MetaMask.`, 'pending');

    try {
        const amountWei = ethers.utils.parseEther(amountEth.toString());
        const tx = await contract.withdraw(amountWei);
        updateStatus('Đã gửi giao dịch. Đang chờ xác nhận...', 'pending');
        await tx.wait();
        showModal('withdrawModal', 'Giao dịch rút tiền thành công!');
    } catch (error) {
        let errorMessage = "Không thể rút tiền. Vui lòng thử lại.";
        if (error.code === 4001) { 
            errorMessage = "Người dùng đã từ chối giao dịch.";
        } else if (error.message.includes("ERC20: transfer amount exceeds balance") || error.message.includes("revert Insufficient balance")) {
            errorMessage = "Số dư trong hợp đồng không đủ để rút.";
        }
        updateStatus(errorMessage, 'failed'); 
        console.error(error);
    } finally {
        withdrawButton.disabled = false;
        withdrawSpinner.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showSection('walletConnect'); 

    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);

        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                userAccount = accounts[0];
                document.getElementById('accountAddress').innerText = userAccount;
                if (walletConnectSection.style.display !== 'none') {
                    showSection('mainDApp');
                }
                updateStatus("Tài khoản MetaMask đã thay đổi.");
                updateBalanceDisplay(); 
                updateConnectError("", false);
            } else {
                userAccount = null;
                document.getElementById('accountAddress').innerText = "Chưa kết nối";
                document.getElementById('contractBalance').innerText = "0.00";
                updateStatus("Đã ngắt kết nối khỏi MetaMask.", 'error');
                showSection('walletConnect');
                updateConnectError("Đã ngắt kết nối khỏi ví. Vui lòng kết nối lại.", true);
            }
        });

        window.ethereum.on('chainChanged', (chainId) => {
            updateConnectError(`Mạng đã thay đổi sang Chain ID: ${parseInt(chainId, 16)}. Vui lòng tải lại trang.`, true);
            showSection('walletConnect');
            updateStatus("Mạng đã thay đổi. Vui lòng kết nối lại.", 'error');
        });

        window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
                if (accounts.length > 0) {
                    userAccount = accounts[0];
                    document.getElementById('accountAddress').innerText = userAccount;
                    signer = provider.getSigner();
                    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                    showSection('mainDApp');
                    updateBalanceDisplay(); 
                    updateStatus("Đã tự động kết nối lại ví thành công.");
                } else {
                    showSection('walletConnect');
                    updateConnectError("Vui lòng kết nối ví MetaMask.", false);
                }
            })
            .catch(error => {
                console.error("Lỗi khi kiểm tra tài khoản đã kết nối:", error);
                updateConnectError("Lỗi khi kiểm tra ví MetaMask. Vui lòng thử lại.", true);
                showSection('walletConnect');
            });

    } else {
        updateConnectError("MetaMask không được tìm thấy. Vui lòng cài đặt MetaMask để sử dụng DApp này.", true);
        showSection('walletConnect');
    }
});