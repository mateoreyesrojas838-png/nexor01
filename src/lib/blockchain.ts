import { ethers } from 'ethers'

const BSC_RPC = process.env.BSC_RPC_URL ?? 'https://bsc-dataseed1.binance.org'
const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'
const PAYMENT_RECEIVER = (process.env.PAYMENT_RECEIVER ?? '').toLowerCase()

// ERC-20 Transfer event ABI
const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)')

export interface VerifyResult {
  success: boolean
  error?: string
  blockNumber?: bigint
  amountUsdt?: number
}

/**
 * Verifica una transacción USDT-BEP20 en BSC.
 * NUNCA confíes en el frontend — esta función siempre re-verifica en el nodo RPC.
 */
export async function verifyBscTransaction(
  txHash: string,
  expectedAmountUsdt: number,
  requiredConfirmations = 3,
): Promise<VerifyResult> {
  if (!PAYMENT_RECEIVER) {
    return { success: false, error: 'PAYMENT_RECEIVER no configurado en env' }
  }

  try {
    const provider = new ethers.JsonRpcProvider(BSC_RPC)

    const [receipt, currentBlock] = await Promise.all([
      provider.getTransactionReceipt(txHash),
      provider.getBlockNumber(),
    ])

    if (!receipt) {
      return { success: false, error: 'Transacción no encontrada en la red' }
    }

    // 1. Verificar que la tx fue exitosa
    if (receipt.status !== 1) {
      return { success: false, error: 'La transacción falló on-chain' }
    }

    // 2. Verificar que el contrato destino sea USDT
    if (receipt.to?.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
      return { success: false, error: 'La transacción no es al contrato USDT-BEP20' }
    }

    // 3. Buscar el log del evento Transfer
    const transferLog = receipt.logs.find(
      log =>
        log.address.toLowerCase() === USDT_CONTRACT.toLowerCase() &&
        log.topics[0] === TRANSFER_TOPIC &&
        log.topics.length === 3,
    )

    if (!transferLog) {
      return { success: false, error: 'No se encontró evento Transfer en la transacción' }
    }

    // 4. Verificar destinatario
    const toAddress = '0x' + transferLog.topics[2].slice(26)
    if (toAddress.toLowerCase() !== PAYMENT_RECEIVER) {
      return { success: false, error: 'El destinatario no es la wallet de pago configurada' }
    }

    // 5. Verificar monto (USDT-BEP20 tiene 18 decimales)
    const rawAmount = BigInt(transferLog.data)
    const amountUsdt = Number(ethers.formatUnits(rawAmount, 18))
    const tolerance = 0.5
    if (amountUsdt < expectedAmountUsdt - tolerance) {
      return {
        success: false,
        error: `Monto insuficiente: se recibió ${amountUsdt.toFixed(2)} USDT, se esperaba ${expectedAmountUsdt} USDT`,
      }
    }

    // 6. Verificar confirmaciones
    const confirmations = currentBlock - Number(receipt.blockNumber)
    if (confirmations < requiredConfirmations) {
      return {
        success: false,
        error: `Confirmaciones insuficientes: ${confirmations}/${requiredConfirmations}`,
      }
    }

    return {
      success: true,
      blockNumber: BigInt(receipt.blockNumber),
      amountUsdt,
    }
  } catch (err: any) {
    console.error('[verifyBscTransaction]', err)
    return { success: false, error: err?.message ?? 'Error al verificar en BSC' }
  }
}
