import { NextRequest, NextResponse } from 'next/server';

/**
 * 统一的 Cron 检查端点
 * 在一次调用中执行所有 5 个检查任务
 * 
 * 调度建议: 每天 1-2 次即可
 * - 每天凌晨 2:00 (0 2 * * *)
 * - 或每 12 小时 (0 */12 * * *)
 */
export async function POST(request: NextRequest) {
  try {
    // 验证 Cron Secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Unified Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    const expectedAuth = `Bearer ${cronSecret}`;
    if (authHeader !== expectedAuth) {
      console.error('[Unified Cron] Invalid authorization');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Unified Cron] Starting unified check at', new Date().toISOString());

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as Array<{
        name: string;
        status: 'success' | 'error';
        message?: string;
        error?: string;
        duration?: number;
      }>
    };

    // 任务 1: 订阅过期检查
    const task1Start = Date.now();
    try {
      const { checkExpiredSubscriptions } = await import('@/shared/services/subscription-checker');
      await checkExpiredSubscriptions();
      results.tasks.push({
        name: 'subscription-expiry-check',
        status: 'success',
        message: 'Checked expired subscriptions',
        duration: Date.now() - task1Start
      });
      console.log('[Unified Cron] ✅ Subscription expiry check completed');
    } catch (error: any) {
      results.tasks.push({
        name: 'subscription-expiry-check',
        status: 'error',
        error: error.message,
        duration: Date.now() - task1Start
      });
      console.error('[Unified Cron] ❌ Subscription expiry check failed:', error);
    }

    // 任务 2: 心跳检查
    const task2Start = Date.now();
    try {
      const { checkHeartbeats } = await import('@/shared/services/heartbeat-checker');
      await checkHeartbeats();
      results.tasks.push({
        name: 'heartbeat-check',
        status: 'success',
        message: 'Checked vault heartbeats',
        duration: Date.now() - task2Start
      });
      console.log('[Unified Cron] ✅ Heartbeat check completed');
    } catch (error: any) {
      results.tasks.push({
        name: 'heartbeat-check',
        status: 'error',
        error: error.message,
        duration: Date.now() - task2Start
      });
      console.error('[Unified Cron] ❌ Heartbeat check failed:', error);
    }

    // 任务 3: Dead Man's Switch 检查
    const task3Start = Date.now();
    try {
      const { checkDeadManSwitch } = await import('@/shared/services/dead-man-switch-checker');
      await checkDeadManSwitch();
      results.tasks.push({
        name: 'dead-man-switch-check',
        status: 'success',
        message: 'Checked Dead Man\'s Switch triggers',
        duration: Date.now() - task3Start
      });
      console.log('[Unified Cron] ✅ Dead Man\'s Switch check completed');
    } catch (error: any) {
      results.tasks.push({
        name: 'dead-man-switch-check',
        status: 'error',
        error: error.message,
        duration: Date.now() - task3Start
      });
      console.error('[Unified Cron] ❌ Dead Man\'s Switch check failed:', error);
    }

    // 任务 4: 系统健康检查
    const task4Start = Date.now();
    try {
      const { checkSystemHealth } = await import('@/shared/services/system-health-checker');
      await checkSystemHealth();
      results.tasks.push({
        name: 'system-health-check',
        status: 'success',
        message: 'System health check completed',
        duration: Date.now() - task4Start
      });
      console.log('[Unified Cron] ✅ System health check completed');
    } catch (error: any) {
      results.tasks.push({
        name: 'system-health-check',
        status: 'error',
        error: error.message,
        duration: Date.now() - task4Start
      });
      console.error('[Unified Cron] ❌ System health check failed:', error);
    }

    // 任务 5: 成本预警检查
    const task5Start = Date.now();
    try {
      const { checkCostAlerts } = await import('@/shared/services/cost-alert-checker');
      await checkCostAlerts();
      results.tasks.push({
        name: 'cost-alerts-check',
        status: 'success',
        message: 'Cost alerts check completed',
        duration: Date.now() - task5Start
      });
      console.log('[Unified Cron] ✅ Cost alerts check completed');
    } catch (error: any) {
      results.tasks.push({
        name: 'cost-alerts-check',
        status: 'error',
        error: error.message,
        duration: Date.now() - task5Start
      });
      console.error('[Unified Cron] ❌ Cost alerts check failed:', error);
    }

    // 统计结果
    const successCount = results.tasks.filter(t => t.status === 'success').length;
    const errorCount = results.tasks.filter(t => t.status === 'error').length;
    const totalDuration = results.tasks.reduce((sum, t) => sum + (t.duration || 0), 0);

    console.log(`[Unified Cron] Completed: ${successCount} success, ${errorCount} errors, ${totalDuration}ms total`);

    return NextResponse.json({
      success: true,
      summary: {
        total: 5,
        success: successCount,
        errors: errorCount,
        duration: totalDuration
      },
      results
    });

  } catch (error: any) {
    console.error('[Unified Cron] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 支持 GET 请求用于健康检查
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'unified-check',
    description: 'Unified cron endpoint for all 5 checks',
    tasks: [
      'subscription-expiry-check',
      'heartbeat-check',
      'dead-man-switch-check',
      'system-health-check',
      'cost-alerts-check'
    ]
  });
}

