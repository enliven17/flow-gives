# Kontratı Şimdi Deploy Et

## Hızlı Deploy (Manuel)

Kontrat hazır ve USDCx entegrasyonu tamamlandı. Deploy etmek için:

### Option 1: Hiro Platform (En Kolay)

1. https://platform.hiro.so/ adresine git
2. Wallet'ını bağla (ST1KPC5MQE408B9JZEJPYBRY76TPZ9BT8GKAZ0AHF)
3. "Deploy Contract" seçeneğine tıkla
4. `contracts/crowdfunding.clar` dosyasının içeriğini kopyala-yapıştır
5. Contract name: `crowdfunding`
6. Deploy butonuna tıkla ve transaction'ı onayla

### Option 2: Stacks CLI

```bash
npm install -g @stacks/cli

stx deploy_contract \
  contracts/crowdfunding.clar \
  crowdfunding \
  --testnet \
  --private-key e958bc43f9561921e5a9357d01fd4c105eb1d67e03c378059fe4ff1a71da3af301
```

### Option 3: Clarinet (Eğer kuruluysa)

```bash
clarinet deployments apply --testnet
```

## Deployment Sonrası

Deployment başarılı olduktan sonra:

1. **Contract Address'i kaydet:** `ST1KPC5MQE408B9JZEJPYBRY76TPZ9BT8GKAZ0AHF.crowdfunding`

2. **`.env.local` dosyasını güncelle:**
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=ST1KPC5MQE408B9JZEJPYBRY76TPZ9BT8GKAZ0AHF.crowdfunding
   NEXT_PUBLIC_STACKS_NETWORK=testnet
   ```

3. **`lib/contracts/crowdfunding.types.ts` dosyasını güncelle:**
   ```typescript
   export const DEFAULT_CONTRACT_CONFIG: ContractConfig = {
     contractAddress: 'ST1KPC5MQE408B9JZEJPYBRY76TPZ9BT8GKAZ0AHF',
     contractName: 'crowdfunding',
     network: 'testnet',
   };
   ```

## Kontrat Özellikleri

✅ **USDCx Transfer Entegrasyonu:**
- `contribute`: Kullanıcıdan kontrata USDCx transfer ediyor
- `withdraw-funds`: Creator'a USDCx transfer ediyor  
- `request-refund`: Contributor'a USDCx geri transfer ediyor

✅ **Testnet USDCx Contract:** `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx`

## Notlar

- Deployment için yaklaşık 0.01-0.1 STX gerekir
- Testnet STX: https://explorer.stacks.co/sandbox/faucet
- Transaction confirmation: 10-20 dakika sürebilir
