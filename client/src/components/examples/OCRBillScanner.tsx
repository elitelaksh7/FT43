import OCRBillScanner from '../OCRBillScanner';

export default function OCRBillScannerExample() {
  const handleBillParsed = (bill: any) => {
    console.log('New bill parsed:', bill);
  };

  return (
    <OCRBillScanner onBillParsed={handleBillParsed} />
  );
}