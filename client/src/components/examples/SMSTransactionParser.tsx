import SMSTransactionParser from '../SMSTransactionParser';

export default function SMSTransactionParserExample() {
  const handleTransactionParsed = (transaction: any) => {
    console.log('New transaction parsed:', transaction);
  };

  return (
    <SMSTransactionParser onTransactionParsed={handleTransactionParsed} />
  );
}