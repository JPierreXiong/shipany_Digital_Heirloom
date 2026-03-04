/**
 * 订阅状态显示组件
 * 用于显示用户的订阅信息和有效期
 */

import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface SubscriptionInfo {
  status: string;
  planName: string;
  interval?: string;
  currentPeriodStart?: Date | string;
  currentPeriodEnd?: Date | string;
  daysRemaining?: number | null;
}

interface SubscriptionStatusProps {
  subscription: SubscriptionInfo | null;
  className?: string;
}

export function SubscriptionStatus({ subscription, className }: SubscriptionStatusProps) {
  if (!subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active subscription</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      pending_cancel: { variant: 'secondary', label: 'Pending Cancel' },
      canceled: { variant: 'destructive', label: 'Canceled' },
      trialing: { variant: 'outline', label: 'Trial' },
      expired: { variant: 'destructive', label: 'Expired' },
      paused: { variant: 'secondary', label: 'Paused' },
    };

    const statusInfo = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getIntervalLabel = (interval?: string) => {
    if (!interval) return '';
    if (interval === 'one-time') return 'Lifetime';
    if (interval === 'year') return 'Annual';
    if (interval === 'month') return 'Monthly';
    return interval;
  };

  const isLifetime = subscription.interval === 'one-time';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription Status</span>
          {getStatusBadge(subscription.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">Plan</p>
          <p className="text-lg font-semibold">
            {subscription.planName} {getIntervalLabel(subscription.interval) && `(${getIntervalLabel(subscription.interval)})`}
          </p>
        </div>

        {!isLifetime && subscription.currentPeriodEnd && (
          <>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valid Until</p>
              <p className="text-base">{formatDate(subscription.currentPeriodEnd)}</p>
            </div>

            {subscription.daysRemaining !== null && subscription.daysRemaining !== undefined && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Days Remaining</p>
                <p className="text-base">
                  {subscription.daysRemaining > 0 ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {subscription.daysRemaining} days
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      Expired
                    </span>
                  )}
                </p>
              </div>
            )}
          </>
        )}

        {isLifetime && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Access</p>
            <p className="text-base">
              <span className="text-green-600 dark:text-green-400 font-semibold">
                ♾️ Lifetime Access
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



