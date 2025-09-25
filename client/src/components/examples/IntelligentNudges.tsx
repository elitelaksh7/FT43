import IntelligentNudges from '../IntelligentNudges';

export default function IntelligentNudgesExample() {
  const handleNudgeAction = (nudgeId: string, action: string) => {
    console.log(`Nudge action: ${nudgeId} -> ${action}`);
  };

  return (
    <IntelligentNudges onNudgeAction={handleNudgeAction} />
  );
}