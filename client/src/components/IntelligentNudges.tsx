import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, AlertTriangle, TrendingUp, Target, Lightbulb, DollarSign } from 'lucide-react';

interface Nudge {
  id: string;
  type: 'warning' | 'tip' | 'goal' | 'achievement';
  title: string;
  message: string;
  actionText?: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  amount?: number;
  dismissed: boolean;
}

interface IntelligentNudgesProps {
  onNudgeAction?: (nudgeId: string, action: string) => void;
}

export default function IntelligentNudges({ onNudgeAction }: IntelligentNudgesProps) {
  const [nudges, setNudges] = useState<Nudge[]>([]);

  useEffect(() => {
    // TODO: remove mock functionality - integrate with AI nudge generation
    const mockNudges: Nudge[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Budget Alert: Food & Dining',
        message: 'You\'ve spent 85% of your monthly dining budget with 12 days left. Consider cooking at home to stay on track.',
        actionText: 'View Budget Details',
        priority: 'high',
        category: 'Food & Dining',
        amount: 340,
        dismissed: false
      },
      {
        id: '2',
        type: 'tip',
        title: 'Savings Opportunity',
        message: 'Your grocery spending increased 23% this month. Try meal planning to reduce impulse purchases.',
        actionText: 'Set Meal Planning Reminder',
        priority: 'medium',
        category: 'Groceries',
        dismissed: false
      },
      {
        id: '3',
        type: 'achievement',
        title: 'Great Job!',
        message: 'You\'ve successfully stayed under your transportation budget for 3 months in a row!',
        actionText: 'Increase Savings Goal',
        priority: 'low',
        category: 'Transportation',
        dismissed: false
      },
      {
        id: '4',
        type: 'goal',
        title: 'Savings Goal Progress',
        message: 'You\'re $250 away from your monthly savings goal. Cancel that subscription you don\'t use?',
        actionText: 'Review Subscriptions',
        priority: 'medium',
        amount: 250,
        dismissed: false
      }
    ];

    setNudges(mockNudges);
  }, []);

  const dismissNudge = (nudgeId: string) => {
    console.log('Nudge dismissed:', nudgeId);
    setNudges(prev => prev.filter(n => n.id !== nudgeId));
  };

  const handleAction = (nudgeId: string, action: string) => {
    console.log(`Nudge action taken: ${nudgeId} -> ${action}`);
    onNudgeAction?.(nudgeId, action);
    dismissNudge(nudgeId);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'tip': return <Lightbulb className="h-5 w-5 text-chart-3" />;
      case 'goal': return <Target className="h-5 w-5 text-primary" />;
      case 'achievement': return <TrendingUp className="h-5 w-5 text-chart-2" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
      case 'medium': return <Badge variant="secondary">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return null;
    }
  };

  const getCardClasses = (type: string, priority: string) => {
    let classes = 'hover-elevate ';
    if (type === 'warning' && priority === 'high') {
      classes += 'border-destructive bg-destructive/5';
    } else if (type === 'achievement') {
      classes += 'border-chart-2 bg-chart-2/5';
    }
    return classes;
  };

  const activeNudges = nudges.filter(n => !n.dismissed);

  return (
    <div className="space-y-4" data-testid="intelligent-nudges">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Smart Financial Insights</h3>
        {activeNudges.length > 0 && (
          <Badge variant="secondary">
            {activeNudges.length} insight{activeNudges.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {activeNudges.length === 0 ? (
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No new insights at the moment</p>
              <p className="text-sm">Keep tracking your expenses for personalized tips</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeNudges.map((nudge) => (
            <Card 
              key={nudge.id} 
              className={getCardClasses(nudge.type, nudge.priority)}
              data-testid={`nudge-${nudge.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(nudge.type)}
                    <CardTitle className="text-base">{nudge.title}</CardTitle>
                    {getPriorityBadge(nudge.priority)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissNudge(nudge.id)}
                    className="h-6 w-6 p-0"
                    data-testid={`button-dismiss-${nudge.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm mb-4">{nudge.message}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {nudge.category && (
                      <Badge variant="outline" className="text-xs">
                        {nudge.category}
                      </Badge>
                    )}
                    {nudge.amount && (
                      <Badge variant="outline" className="text-xs">
                        ${nudge.amount}
                      </Badge>
                    )}
                  </div>
                  
                  {nudge.actionText && (
                    <Button
                      size="sm"
                      variant={nudge.type === 'warning' ? 'default' : 'outline'}
                      onClick={() => handleAction(nudge.id, nudge.actionText!)}
                      data-testid={`button-action-${nudge.id}`}
                    >
                      {nudge.actionText}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}