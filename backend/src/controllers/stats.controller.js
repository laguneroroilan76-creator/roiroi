const prisma = require('../config/database');

const pendingStatuses = ['Pending', 'Pending Verification', 'Pending Approval', 'Pending Endorsement', 'Pending Dept Head Approval', 'Pending Final Approval', 'Verified', 'Endorsed'];
const rejectedStatuses = ['Disapproved', 'Closed', 'Cancelled', 'CANCELLED'];
const ongoingStatuses = ['In Progress', 'Ongoing', 'DEPARTED'];
const approvedStatuses = ['Approved', 'Resolved', 'Completed', 'ARRIVED', 'Received'];

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 13);

    // 1. Aggregated DB Counts
    const [
      pending, rejected, approved, ongoing, totalForms, todayCount, activeUsers, availableVehicles, activeDrivers
    ] = await Promise.all([
      Promise.all([
        prisma.prf.count({ where: { status: { in: pendingStatuses } } }),
        prisma.rfp.count({ where: { OR: [{ status: { in: pendingStatuses } }, { status: 'Approved', receivedBy: null }, { status: 'Approved', receivedBy: '' }] } }),
        prisma.tripTicket.count({ where: { status: { in: pendingStatuses } } })
      ]).then(arr => arr.reduce((a, b) => a + b, 0)),
      
      Promise.all([
        prisma.prf.count({ where: { status: { in: rejectedStatuses } } }),
        prisma.rfp.count({ where: { status: { in: rejectedStatuses } } }),
        prisma.tripTicket.count({ where: { status: { in: rejectedStatuses } } })
      ]).then(arr => arr.reduce((a, b) => a + b, 0)),
      
      Promise.all([
        prisma.prf.count({ where: { status: { in: approvedStatuses } } }),
        prisma.rfp.count({ where: { status: { in: approvedStatuses }, receivedBy: { not: null }, NOT: { receivedBy: '' } } }),
        prisma.tripTicket.count({ where: { status: { in: approvedStatuses }, guardInId: { not: null } } })
      ]).then(arr => arr.reduce((a, b) => a + b, 0)),
      
      Promise.all([
        prisma.prf.count({ where: { status: { in: ongoingStatuses } } }),
        prisma.rfp.count({ where: { status: { in: ongoingStatuses } } }),
        prisma.tripTicket.count({ where: { OR: [{ status: { in: ongoingStatuses } }, { status: { in: ['Approved', 'Resolved', 'Completed'] }, guardInId: null }] } })
      ]).then(arr => arr.reduce((a, b) => a + b, 0)),

      Promise.all([
        prisma.prf.count({ where: { status: { not: 'Archived' } } }),
        prisma.rfp.count({ where: { status: { not: 'Archived' } } }),
        prisma.tripTicket.count({ where: { status: { not: 'Archived' } } })
      ]).then(arr => arr.reduce((a, b) => a + b, 0)),

      Promise.all([
        prisma.prf.count({ where: { createdAt: { gte: today } } }),
        prisma.rfp.count({ where: { createdAt: { gte: today } } }),
        prisma.tripTicket.count({ where: { createdAt: { gte: today } } })
      ]).then(arr => arr.reduce((a, b) => a + b, 0)),

      prisma.user.count({ where: { status: 'Active' } }),
      prisma.vehicle.count({ where: { status: 'Active' } }),
      prisma.user.count({ where: { isDriver: true, status: 'Active' } })
    ]);

    // 2. Trends & Sparklines (Database-level Aggregation)
    const [prfs14, rfps14, tts14] = await Promise.all([
      prisma.$queryRaw`
        SELECT DATE(created_at) as date,
          SUM(CASE WHEN status IN ('Pending', 'Pending Verification', 'Pending Approval', 'Pending Endorsement', 'Pending Dept Head Approval', 'Pending Final Approval', 'Verified', 'Endorsed') THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status IN ('Disapproved', 'Closed', 'Cancelled', 'CANCELLED') THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status IN ('In Progress', 'Ongoing', 'DEPARTED') THEN 1 ELSE 0 END) as ongoing,
          SUM(CASE WHEN status IN ('Approved', 'Resolved', 'Completed', 'ARRIVED') THEN 1 ELSE 0 END) as approved
        FROM prf
        WHERE created_at >= NOW() - INTERVAL '14 days' AND status != 'Archived'
        GROUP BY DATE(created_at)
      `,
      prisma.$queryRaw`
        SELECT DATE(created_at) as date,
          SUM(CASE WHEN status IN ('Pending', 'Pending Verification', 'Pending Approval', 'Pending Endorsement', 'Pending Dept Head Approval', 'Pending Final Approval', 'Verified', 'Endorsed') OR (status = 'Approved' AND (received_by IS NULL OR received_by = '')) THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status IN ('Disapproved', 'Closed', 'Cancelled', 'CANCELLED') THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status IN ('In Progress', 'Ongoing', 'DEPARTED') THEN 1 ELSE 0 END) as ongoing,
          SUM(CASE WHEN status IN ('Approved', 'Resolved', 'Completed', 'ARRIVED', 'Received') AND received_by IS NOT NULL AND received_by != '' THEN 1 ELSE 0 END) as approved
        FROM rfp
        WHERE created_at >= NOW() - INTERVAL '14 days' AND status != 'Archived'
        GROUP BY DATE(created_at)
      `,
      prisma.$queryRaw`
        SELECT DATE(created_at) as date,
          SUM(CASE WHEN status IN ('Pending', 'Pending Verification', 'Pending Approval', 'Pending Endorsement', 'Pending Dept Head Approval', 'Pending Final Approval', 'Verified', 'Endorsed') THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status IN ('Disapproved', 'Closed', 'Cancelled', 'CANCELLED') THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status IN ('In Progress', 'Ongoing', 'DEPARTED') OR (status IN ('Approved', 'Resolved', 'Completed') AND guard_in_id IS NULL) THEN 1 ELSE 0 END) as ongoing,
          SUM(CASE WHEN status IN ('Approved', 'Resolved', 'Completed', 'ARRIVED') AND guard_in_id IS NOT NULL THEN 1 ELSE 0 END) as approved
        FROM tripticket
        WHERE created_at >= NOW() - INTERVAL '14 days' AND status != 'Archived'
        GROUP BY DATE(created_at)
      `
    ]);

    const currentWeekCounts = { pending: 0, approved: 0, rejected: 0, ongoing: 0 };
    const prevWeekCounts = { pending: 0, approved: 0, rejected: 0, ongoing: 0 };
    
    const sparklineMap = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        sparklineMap[dateStr] = { name: dateStr, pending: 0, approved: 0, rejected: 0, ongoing: 0 };
    }

    const processTrendCounts = (dataArray) => {
      dataArray.forEach(row => {
        const fDate = new Date(row.date);
        fDate.setHours(0,0,0,0);
        
        const p = Number(row.pending) || 0;
        const a = Number(row.approved) || 0;
        const r = Number(row.rejected) || 0;
        const o = Number(row.ongoing) || 0;

        if (fDate >= sevenDaysAgo) {
          currentWeekCounts.pending += p;
          currentWeekCounts.approved += a;
          currentWeekCounts.rejected += r;
          currentWeekCounts.ongoing += o;
          
          const dateStr = fDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (sparklineMap[dateStr]) {
            sparklineMap[dateStr].pending += p;
            sparklineMap[dateStr].approved += a;
            sparklineMap[dateStr].rejected += r;
            sparklineMap[dateStr].ongoing += o;
          }
        } else if (fDate >= fourteenDaysAgo && fDate < sevenDaysAgo) {
          prevWeekCounts.pending += p;
          prevWeekCounts.approved += a;
          prevWeekCounts.rejected += r;
          prevWeekCounts.ongoing += o;
        }
      });
    };

    processTrendCounts(prfs14);
    processTrendCounts(rfps14);
    processTrendCounts(tts14);

    const calculateTrend = (curr, prev) => {
        if (prev === 0) return curr > 0 ? '+100%' : '0%';
        const diff = curr - prev;
        const percent = Math.round((diff / prev) * 100);
        return percent > 0 ? `+${percent}%` : `${percent}%`;
    };

    res.json({
      pending,
      approved,
      rejected,
      ongoing,
      today: todayCount,
      totalForms,
      activeUsers,
      availableVehicles,
      activeDrivers,
      trends: {
        pending: calculateTrend(currentWeekCounts.pending, prevWeekCounts.pending),
        approved: calculateTrend(currentWeekCounts.approved, prevWeekCounts.approved),
        rejected: calculateTrend(currentWeekCounts.rejected, prevWeekCounts.rejected),
        ongoing: calculateTrend(currentWeekCounts.ongoing, prevWeekCounts.ongoing)
      },
      sparklines: Object.values(sparklineMap)
    });

  } catch (error) {
    require('fs').appendFileSync('error.log', new Date().toISOString() + ' ' + error.stack + '\n');
    console.error('Failed to get dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

exports.getAnalyticsData = async (req, res) => {
  try {
    const period = req.query.period || 'this_month';
    const { start, end } = req.query;

    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0,0,0,0);
    let endDate = new Date();
    endDate.setHours(23,59,59,999);

    if (period === 'this_week') startDate.setDate(now.getDate() - now.getDay());
    else if (period === 'this_month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === 'yearly') startDate = new Date(now.getFullYear(), 0, 1);
    else if (period === 'custom' && start && end) {
        startDate = new Date(start); startDate.setHours(0,0,0,0);
        endDate = new Date(end); endDate.setHours(23,59,59,999);
    } else if (period === 'all_time') startDate = new Date('2000-01-01');

    // 1. Fetch Aggregated Data via DB Queries
    const [prfAgg, rfpAgg, ttAgg] = await Promise.all([
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COALESCE(department, 'General') as department,
          SUM(CASE WHEN status IN ('Pending', 'Pending Verification', 'Pending Approval', 'Pending Endorsement', 'Pending Dept Head Approval', 'Pending Final Approval', 'Verified', 'Endorsed') THEN 1 ELSE 0 END) as submitted,
          SUM(CASE WHEN status IN ('Disapproved', 'Closed', 'Cancelled', 'CANCELLED') THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status IN ('In Progress', 'Ongoing', 'DEPARTED') THEN 1 ELSE 0 END) as ongoing,
          SUM(CASE WHEN status IN ('Approved', 'Resolved', 'Completed', 'ARRIVED') THEN 1 ELSE 0 END) as completed,
          COUNT(id) as total
        FROM prf
        WHERE created_at >= ${startDate} AND created_at <= ${endDate} AND status != 'Archived'
        GROUP BY DATE(created_at), COALESCE(department, 'General')
      `,
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COALESCE(department, 'General') as department,
          SUM(CASE WHEN status IN ('Pending', 'Pending Verification', 'Pending Approval', 'Pending Endorsement', 'Pending Dept Head Approval', 'Pending Final Approval', 'Verified', 'Endorsed') OR (status = 'Approved' AND (received_by IS NULL OR received_by = '')) THEN 1 ELSE 0 END) as submitted,
          SUM(CASE WHEN status IN ('Disapproved', 'Closed', 'Cancelled', 'CANCELLED') THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status IN ('In Progress', 'Ongoing', 'DEPARTED') THEN 1 ELSE 0 END) as ongoing,
          SUM(CASE WHEN status IN ('Approved', 'Resolved', 'Completed', 'ARRIVED', 'Received') AND received_by IS NOT NULL AND received_by != '' THEN 1 ELSE 0 END) as completed,
          COUNT(id) as total
        FROM rfp
        WHERE created_at >= ${startDate} AND created_at <= ${endDate} AND status != 'Archived'
        GROUP BY DATE(created_at), COALESCE(department, 'General')
      `,
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, 'General' as department,
          SUM(CASE WHEN status IN ('Pending', 'Pending Verification', 'Pending Approval', 'Pending Endorsement', 'Pending Dept Head Approval', 'Pending Final Approval', 'Verified', 'Endorsed') THEN 1 ELSE 0 END) as submitted,
          SUM(CASE WHEN status IN ('Disapproved', 'Closed', 'Cancelled', 'CANCELLED') THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status IN ('In Progress', 'Ongoing', 'DEPARTED') OR (status IN ('Approved', 'Resolved', 'Completed') AND guard_in_id IS NULL) THEN 1 ELSE 0 END) as ongoing,
          SUM(CASE WHEN status IN ('Approved', 'Resolved', 'Completed', 'ARRIVED') AND guard_in_id IS NOT NULL THEN 1 ELSE 0 END) as completed,
          COUNT(id) as total
        FROM tripticket
        WHERE created_at >= ${startDate} AND created_at <= ${endDate} AND status != 'Archived'
        GROUP BY DATE(created_at)
      `
    ]);

    // 2. Initialize Data Structures
    const monthlyTrendsMap = {};
    const isGroupingByMonth = period === 'yearly' || period === 'all_time';

    if (isGroupingByMonth) {
        let currentIter = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (currentIter <= endDate) {
            const key = currentIter.toLocaleString('en-US', { month: 'short', year: '2-digit' });
            if (!monthlyTrendsMap[key]) monthlyTrendsMap[key] = { name: key, submitted: 0, approved: 0, rejected: 0, completed: 0 };
            currentIter.setMonth(currentIter.getMonth() + 1);
        }
    } else {
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            monthlyTrendsMap[key] = { name: key, submitted: 0, approved: 0, rejected: 0, completed: 0 };
        }
    }

    const departmentStatsMap = {};
    const workloadMap = {};
    for (const key in monthlyTrendsMap) workloadMap[key] = { name: key, active: 0 };

    let prfCount = 0, rfpCount = 0, ttCount = 0;
    let totalForms = 0;

    // 3. Process Aggregated Results
    const processAnalytics = (dataArray, formType) => {
      dataArray.forEach(row => {
        const rowDate = new Date(row.date);
        const key = isGroupingByMonth 
          ? rowDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }) 
          : rowDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const dept = row.department || 'General';
        const submitted = Number(row.submitted) || 0;
        const rejected = Number(row.rejected) || 0;
        const ongoing = Number(row.ongoing) || 0;
        const completed = Number(row.completed) || 0;
        const total = Number(row.total) || 0;

        totalForms += total;
        if (formType === 'PRF') prfCount += total;
        if (formType === 'RFP') rfpCount += total;
        if (formType === 'TRIP_TICKET') ttCount += total;

        if (!departmentStatsMap[dept]) departmentStatsMap[dept] = { name: dept, volume: 0, approved: 0, approvalRate: 0 };
        departmentStatsMap[dept].volume += total;
        departmentStatsMap[dept].approved += completed; // We consider 'completed' as 'approved' for department rating

        if (monthlyTrendsMap[key]) {
            monthlyTrendsMap[key].submitted += submitted;
            monthlyTrendsMap[key].approved += completed; // Using completed for trends mapping
            monthlyTrendsMap[key].rejected += rejected;
            monthlyTrendsMap[key].completed += completed;
        }

        if (workloadMap[key]) {
            workloadMap[key].active += (submitted + completed + ongoing);
        }
      });
    };

    processAnalytics(prfAgg, 'PRF');
    processAnalytics(rfpAgg, 'RFP');
    processAnalytics(ttAgg, 'TRIP_TICKET');

    const departmentStatsRaw = Object.values(departmentStatsMap);
    departmentStatsRaw.forEach(d => {
      d.approvalRate = d.volume > 0 ? Math.round((d.approved / d.volume) * 100) : 0;
    });
    
    res.json({
        monthlyTrends: Object.values(monthlyTrendsMap),
        departmentStats: departmentStatsRaw.sort((a,b) => b.volume - a.volume).slice(0, 10),
        formTypeStats: [
            { name: 'Trip Tickets', value: ttCount },
            { name: 'Purchase Req', value: prfCount },
            { name: 'Payment Req', value: rfpCount }
        ].filter(f => f.value > 0),
        workloadActivity: Object.values(workloadMap),
        totalForms
    });

  } catch (err) {
      console.error('Failed to get analytics:', err);
      res.status(500).json({ error: 'Failed to get analytics' });
  }
};
