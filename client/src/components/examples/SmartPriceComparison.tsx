import SmartPriceComparison from '../SmartPriceComparison';

export default function SmartPriceComparisonExample() {
  const handleSavingsFound = (comparison: any) => {
    console.log('Savings opportunity found:', comparison);
  };

  return (
    <SmartPriceComparison onSavingsFound={handleSavingsFound} />
  );
}