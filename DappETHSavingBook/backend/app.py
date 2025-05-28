import json
from web3 import Web3
import os
import datetime 

INFURA_URL = "https://sepolia.infura.io/v3"
MY_ADDRESS = "0x0E86BBb5476Ffc807C84Fd120Ea07222DaFC854c"
MY_PRIVATE_KEY = "7a"
CONTRACT_ADDRESS = "0x2CdcCad8C6AEC967C7709e5f07A68188E997E885"
CONTRACT_ABI = [
    {"anonymous": False, "inputs": [{"indexed": True, "internalType": "address", "name": "user", "type": "address"}, {"indexed": False, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "Deposited", "type": "event"},
    {"anonymous": False, "inputs": [{"indexed": True, "internalType": "address", "name": "user", "type": "address"}, {"indexed": False, "internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "Withdrawn", "type": "event"},
    {"inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function"},
    {"inputs": [], "name": "getBalance", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "uint256", "name": "_amount", "type": "uint256"}], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
]

w3 = Web3(Web3.HTTPProvider(INFURA_URL))

if w3.is_connected():
    print("Đã kết nối thành công với mạng Ethereum!")
else:
    print("Không thể kết nối với mạng Ethereum. Vui lòng kiểm tra INFURA_URL.")
    exit()

contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI)

def send_transaction(function_call, value_wei=0):
    try:
        nonce = w3.eth.get_transaction_count(MY_ADDRESS)

        transaction = function_call.build_transaction({
            'chainId': w3.eth.chain_id,
            'gasPrice': w3.eth.gas_price, 
            'from': MY_ADDRESS,
            'nonce': nonce,
            'value': value_wei, 
            'gas': 200000 
        })

        signed_txn = w3.eth.account.sign_transaction(transaction, private_key=MY_PRIVATE_KEY)

        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"Giao dịch đã gửi. Tx Hash: {tx_hash.hex()}")

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Giao dịch đã được xác nhận. Trạng thái: {receipt.status}")
        if receipt.status == 1:
            print("Giao dịch thành công!")
        else:
            print("Giao dịch thất bại!")
        return tx_hash.hex()
    except Exception as e:
        print(f"Lỗi khi gửi giao dịch: {e}")
        return None

def deposit_eth(amount_eth: float):
    """Gửi ETH vào hợp đồng."""
    print(f"\nĐang gửi {amount_eth} ETH vào hợp đồng...")
    if amount_eth <= 0:
        print("Lỗi: Số ETH phải > 0")
        return None

    amount_wei = w3.to_wei(amount_eth, 'ether')
    function_call = contract.functions.deposit()
    return send_transaction(function_call, value_wei=amount_wei)

def withdraw_eth(amount_eth: float):
    """Rút ETH từ hợp đồng."""
    print(f"\nĐang rút {amount_eth} ETH từ hợp đồng...")
    if amount_eth <= 0:
        print("Lỗi: Số ETH phải > 0")
        return None

    amount_wei = w3.to_wei(amount_eth, 'ether')
    function_call = contract.functions.withdraw(amount_wei)
    return send_transaction(function_call)

def get_contract_balance():
    """Lấy số dư ETH hiện tại trong hợp đồng."""
    print("\nĐang lấy số dư ETH trong hợp đồng...")
    try:
        balance_wei = contract.functions.getBalance().call({'from': MY_ADDRESS})
        balance_eth = w3.from_wei(balance_wei, 'ether')
        print(f"Số dư trong hợp đồng: {balance_eth} ETH")
        return float(balance_eth)
    except Exception as e:
        print(f"Lỗi khi lấy số dư: {e}")
        return None
