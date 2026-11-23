import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 320,
    color: {
      dark: '#1c1917', // luxury deep ink
      light: '#fbfaf8', // luxury warm paper
    },
  });
}

export function generateQrisPayload(options: {
  merchantName: string;
  orderNumber: string;
  amount: number;
}): string {
  // Generates a mock standard EMVCo/QRIS payload string for Indonesian QRIS specification
  const formattedAmount = options.amount.toString();
  return `00020101021226600016ID.CO.OMOO.STUDIO01189360000000000000000215${options.orderNumber}520459995303360540${formattedAmount.length.toString().padStart(2, '0')}${formattedAmount}5802ID59${options.merchantName.length.toString().padStart(2, '0')}${options.merchantName}6014JAKARTA SELATAN61051219062300526${options.orderNumber}6304ABCD`;
}
