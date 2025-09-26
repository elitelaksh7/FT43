import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Calendar,
  Target,
  CheckCircle,
  X,
  RefreshCw,
  Brain,
  PiggyBank
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Nudge {
  id: string;
  type: 'tip' | 'warning' | 'opportunity' | 'achievement' | 'budget' | 'saving';
  title: string;
  message: string;
  category?: string;
  amount?: number;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: {
    label: string;
    endpoint?: string;
    params?: Record<string, any>;
  };
  metadata?: {
    merchant?: string;
    timeframe?: string;
    comparison?: {
      current: number;
      previous: number;
      change: number;
    };
  };
  createdAt: string;
  dismissed?: boolean;
}

interface IntelligentNudgesProps {
  nudges?: Nudge[];
}

const IntelligentNudgesEnhanced: React.FC<IntelligentNudgesProps> = ({ nudges: propNudges = [] }) => {
  const { toast } = useToast();
  const [nudges, setNudges] = useState<Nudge[]>(propNudges);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'actionable' | 'high-priority'>('all');

  // Load nudges from API
  useEffect(() => {
    if (propNudges.length === 0) {
      loadNudges();
    } else {
      setNudges(propNudges);
    }
  }, [propNudges]);

  const loadNudges = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/nudges');
      if (response.ok) {
        const data = await response.json();
        setNudges(data.nudges || []);
      }
    } catch (error) {
      console.error('Failed to load nudges:', error);
      toast({
        title: "Failed to load nudges",
        description: "Using demo nudges for now",
        variant: "destructive",
      });
      
      // Load demo nudges
      setNudges(getDemoNudges());
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoNudges = (): Nudge[] => [
    {
      id: '1',
      type: 'opportunity',
      title: 'Save on Coffee Expenses',
      message: 'You spent $127 on coffee this month. Consider a coffee subscription to save ~$30/month.',
      category: 'Food & Dining',
      amount: 30,
      confidence: 0.92,
      priority: 'high',
      actionable: true,
      action: {
        label: 'Explore Subscriptions',
        endpoint: '/api/price-comparison/coffee-subscriptions'
      },
      metadata: {
        merchant: 'Various Coffee Shops',
        timeframe: 'This Month',
        comparison: {
          current: 127,
          previous: 98,
          change: 29.6
        }
      },
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      type: 'warning',
      title: 'Budget Alert: Dining',
      message: 'You\'ve spent 85% of your dining budget with 8 days left in the month.',
      category: 'Food & Dining',
      confidence: 0.95,
      priority: 'high',
      actionable: true,
      action: {
        label: 'View Budget Details'
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'tip',
      title: 'Cashback Opportunity',
      message: 'Switch to your rewards card for gas purchases to earn 3% cashback.',
      category: 'Transportation',
      confidence: 0.88,
      priority: 'medium',
      actionable: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Savings Goal Progress',
      message: 'Great job! You\'re 73% towards your monthly savings goal.',
      confidence: 0.99,
      priority: 'low',
      actionable: false,
      metadata: {
        comparison: {
          current: 2190,
          previous: 3000,
          change: 73
        }
      },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ];

  const dismissNudge = async (nudgeId: string) => {
    try {
      const response = await fetch(`/api/nudges/${nudgeId}/dismiss`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setNudges(prev => prev.filter(n => n.id !== nudgeId));
        toast({
          title: "Nudge dismissed",
          duration: 2000,
        });
      }
    } catch (error) {
      // For demo, just remove from local state
      setNudges(prev => prev.filter(n => n.id !== nudgeId));
      toast({
        title: "Nudge dismissed",
        duration: 2000,
      });
    }
  };

  const takeAction = async (nudge: Nudge) => {
    if (!nudge.action) return;

    toast({
      title: "Taking action...",
      description: nudge.action.label,
      duration: 2000,
    });

    try {
      if (nudge.action.endpoint) {
        const response = await fetch(nudge.action.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nudge.action.params || {})
        });

        if (response.ok) {
          toast({
            title: "Action completed",
            description: "Check the results in your dashboard",
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Action failed:', error);
      toast({
        title: "Action failed",
        description: "Please try again later",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const getIcon = (type: Nudge['type']) => {
    switch (type) {
      case 'tip': return Lightbulb;
      case 'warning': return AlertTriangle;
      case 'opportunity': return TrendingUp;
      case 'achievement': return CheckCircle;
      case 'budget': return Target;
      case 'saving': return PiggyBank;
      default: return Brain;
    }
  };

  const getIconColor = (type: Nudge['type']) => {
    switch (type) {
      case 'tip': return 'text-blue-500';
      case 'warning': return 'text-red-500';
      case 'opportunity': return 'text-green-500';
      case 'achievement': return 'text-purple-500';
      case 'budget': return 'text-orange-500';
      case 'saving': return 'text-teal-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: Nudge['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'medium': return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-950';
    }
  };

  const filteredNudges = nudges.filter(nudge => {
    if (filter === 'actionable') return nudge.actionable;
    if (filter === 'high-priority') return nudge.priority === 'high';
    return true;
  }).filter(nudge => !nudge.dismissed);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Intelligent Nudges</h2>
          <p className="text-muted-foreground">
            AI-powered financial insights and recommendations
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={loadNudges}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({nudges.filter(n => !n.dismissed).length})
        </Button>
        <Button
          variant={filter === 'actionable' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('actionable')}
        >
          Actionable ({nudges.filter(n => n.actionable && !n.dismissed).length})
        </Button>
        <Button
          variant={filter === 'high-priority' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('high-priority')}
        >
          High Priority ({nudges.filter(n => n.priority === 'high' && !n.dismissed).length})
        </Button>
      </div>

      {/* Nudges List */}
      <div className="space-y-4">
        {filteredNudges.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No nudges available</p>
                <p>Keep using FinTrackAI to get personalized insights!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredNudges.map((nudge) => {
            const Icon = getIcon(nudge.type);
            
            return (
              <Card 
                key={nudge.id} 
                className={cn(
                  "relative",
                  nudge.priority === 'high' && "border-l-4 border-l-red-500",
                  nudge.priority === 'medium' && "border-l-4 border-l-orange-500"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn("p-2 rounded-lg", getPriorityColor(nudge.priority))}>
                        <Icon className={cn("h-5 w-5", getIconColor(nudge.type))} />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg">{nudge.title}</CardTitle>
                          
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={nudge.priority === 'high' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {nudge.priority}
                            </Badge>
                            
                            {nudge.actionable && (
                              <Badge variant="secondary" className="text-xs">
                                Actionable
                              </Badge>
                            )}
                            
                            <Badge variant="outline" className="text-xs">
                              {Math.round(nudge.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>
                        
                        <CardDescription className="text-sm">
                          {formatTimeAgo(nudge.createdAt)}
                          {nudge.category && ` • ${nudge.category}`}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNudge(nudge.id)}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{nudge.message}</p>
                  
                  {/* Amount or Comparison */}
                  {nudge.amount && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">
                        Potential savings: ${nudge.amount}
                      </span>
                    </div>
                  )}
                  
                  {nudge.metadata?.comparison && (
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg text-sm">
                      <div>
                        <p className="text-muted-foreground">Current</p>
                        <p className="font-semibold">${nudge.metadata.comparison.current}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Previous</p>
                        <p className="font-semibold">${nudge.metadata.comparison.previous}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Change</p>
                        <p className={cn(
                          "font-semibold",
                          nudge.metadata.comparison.change > 0 ? "text-red-600" : "text-green-600"
                        )}>
                          {nudge.metadata.comparison.change > 0 ? '+' : ''}
                          {nudge.metadata.comparison.change.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  {nudge.actionable && nudge.action && (
                    <Button 
                      onClick={() => takeAction(nudge)}
                      size="sm"
                      className="w-full"
                    >
                      {nudge.action.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {nudges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nudges Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-2xl text-blue-600">
                  {nudges.filter(n => n.type === 'tip').length}
                </p>
                <p className="text-muted-foreground">Tips</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-2xl text-orange-600">
                  {nudges.filter(n => n.type === 'warning').length}
                </p>
                <p className="text-muted-foreground">Warnings</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-2xl text-green-600">
                  {nudges.filter(n => n.type === 'opportunity').length}
                </p>
                <p className="text-muted-foreground">Opportunities</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-2xl text-purple-600">
                  {nudges.filter(n => n.actionable).length}
                </p>
                <p className="text-muted-foreground">Actionable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntelligentNudgesEnhanced;