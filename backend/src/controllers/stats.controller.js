const prisma = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all forms to calculate statuses
    const [prfs, rrfs, triptickets] = await Promise.all([
      prisma.prf.findMany(),
      prisma.rrf.findMany(),
      prisma.tripTicket.findMany()
    ]);

    const parseRecord = (record) => {
        if (!record.layout) return record;
        try {
            const parsed = JSON.parse(record.layout);
            return { ...parsed, ...record, status: record.status || parsed.status || 'Pending' };
        } catch(e) { return record; }
    };

    const parsedPrfs = prfs.map(parseRecord);
    const parsedRrfs = rrfs.map(parseRecord);
    const parsedTriptickets = triptickets.map(parseRecord);

    const allForms = [...parsedPrfs, ...parsedRrfs, ...parsedTriptickets];
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let ongoing = 0;
    let todayCount = 0;

    const currentWeekCounts = { pending: 0, approved: 0, rejected: 0, ongoing: 0 };
    const prevWeekCounts = { pending: 0, approved: 0, rejected: 0, ongoing: 0 };

    const sparklineMap = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        sparklineMap[dateStr] = { name: dateStr, pending: 0, approved: 0, rejected: 0, ongoing: 0 };
    }

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 13);

    allForms.forEach(form => {
      const s = form.status || 'Pending';
      const formDate = new Date(form.createdAt || new Date());
      const fDate = new Date(formDate.getFullYear(), formDate.getMonth(), formDate.getDate());
      
      let category = '';

      const isTripTicket = form.driver !== undefined || form.plateNumber !== undefined || form.etdOffice !== undefined;
      const isRFP = form.releaseFundsTo !== undefined || form.chargeTo !== undefined || 'rrfNo' in form;

      // Pending
      if (s === 'Pending' || 
          s === 'Pending Verification' || 
          s === 'Pending Approval' || 
          s === 'Pending Endorsement' || 
          s === 'Pending Dept Head Approval' || 
          s === 'Pending Final Approval' ||
          (isRFP && s === 'Approved' && !form.receivedBy)) { // RRF specific pending condition for Accounting
        pending++;
        category = 'pending';
      }
      // Rejected / Cancelled (Excluding normal Archived)
      else if (s === 'Disapproved' || s === 'Closed' || s === 'Cancelled' || s === 'CANCELLED') {
        rejected++;
        category = 'rejected';
      }
      // Ongoing (In Progress)
      else if (s === 'In Progress' || s === 'Ongoing' || s === 'DEPARTED' || (isTripTicket && (s === 'Approved' || s === 'Completed' || s === 'ARRIVED') && !form.guardIn)) {
        ongoing++;
        category = 'ongoing';
      }
      // Approved / Resolved (Completed)
      else if (s === 'Approved' || s === 'Resolved' || s === 'Completed' || s === 'ARRIVED') {
        approved++;
        category = 'approved';
      }

      // Populate trends and sparklines
      if (category) {
         if (fDate >= sevenDaysAgo) {
            currentWeekCounts[category]++;
            const dateStr = fDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (sparklineMap[dateStr]) sparklineMap[dateStr][category]++;
         } else if (fDate >= fourteenDaysAgo && fDate < sevenDaysAgo) {
            prevWeekCounts[category]++;
         }
      }

      // Today
      if (fDate.getTime() === today.getTime()) {
        todayCount++;
      }
    });

    const calculateTrend = (curr, prev) => {
        if (prev === 0) return curr > 0 ? '+100%' : '0%';
        const diff = curr - prev;
        const percent = Math.round((diff / prev) * 100);
        return percent > 0 ? `+${percent}%` : `${percent}%`;
    };

    const trends = {
        pending: calculateTrend(currentWeekCounts.pending, prevWeekCounts.pending),
        approved: calculateTrend(currentWeekCounts.approved, prevWeekCounts.approved),
        rejected: calculateTrend(currentWeekCounts.rejected, prevWeekCounts.rejected),
        ongoing: calculateTrend(currentWeekCounts.ongoing, prevWeekCounts.ongoing)
    };

    const sparklines = Object.values(sparklineMap);

    // Counts
    const [activeUsers, availableVehicles, activeDrivers] = await Promise.all([
      prisma.user.count(),
      prisma.vehicle.count({ where: { status: 'Active' } }),
      prisma.user.count({ where: { role: 'Driver' } })
    ]);

    res.json({
      pending,
      approved,
      rejected,
      ongoing,
      today: todayCount,
      totalForms: allForms.filter(f => f.status !== 'Archived').length,
      activeUsers,
      availableVehicles,
      activeDrivers,
      trends,
      sparklines
    });

  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

exports.getAnalyticsData = async (req, res) => {
  try {
    const period = req.query.period || 'this_month'; // 'today', 'this_week', 'this_month', 'yearly', 'custom'
    const { start, end } = req.query;

    const now = new Date();
    let startDate = new Date();
    startDate.setHours(0,0,0,0);
    let endDate = new Date();
    endDate.setHours(23,59,59,999);

    if (period === 'today') {
        // already set to today
    } else if (period === 'this_week') {
        startDate.setDate(now.getDate() - now.getDay()); // Sunday
    } else if (period === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else if (period === 'custom' && start && end) {
        startDate = new Date(start);
        startDate.setHours(0,0,0,0);
        endDate = new Date(end);
        endDate.setHours(23,59,59,999);
    } else if (period === 'all_time') {
        startDate = new Date('2000-01-01');
    }

    const [prfs, rrfs, triptickets] = await Promise.all([
      prisma.prf.findMany({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.rrf.findMany({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.tripTicket.findMany({ where: { createdAt: { gte: startDate, lte: endDate } } })
    ]);

    const allForms = [
        ...prfs.map(f => ({ ...f, docType: 'PRF' })),
        ...rrfs.map(f => ({ ...f, docType: 'RRF' })),
        ...triptickets.map(f => ({ ...f, docType: 'TRIP_TICKET' }))
    ];

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
    let prfCount = 0;
    let rrfCount = 0;
    let ttCount = 0;

    const workloadMap = {};
    for (const key in monthlyTrendsMap) {
        workloadMap[key] = { name: key, active: 0 };
    }

    allForms.forEach(form => {
        const s = form.status || 'Pending';
        const formDate = new Date(form.createdAt);
        let key = '';

        if (isGroupingByMonth) {
            key = formDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        } else {
            key = formDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        if (form.docType === 'PRF') prfCount++;
        if (form.docType === 'RRF') rrfCount++;
        if (form.docType === 'TRIP_TICKET') ttCount++;

        const dept = form.department || 'General';
        if (!departmentStatsMap[dept]) departmentStatsMap[dept] = { name: dept, volume: 0, approved: 0, approvalRate: 0 };
        departmentStatsMap[dept].volume++;

        let category = '';
        if (s === 'Pending' || s.includes('Pending')) {
            category = 'submitted';
        } else if (s === 'Approved' || s === 'DEPARTED') {
            category = 'approved';
            departmentStatsMap[dept].approved++;
        } else if (s === 'Archived' || s === 'Disapproved' || s === 'Closed' || s.includes('Cancel')) {
            category = 'rejected';
        } else if (s === 'Resolved' || s === 'Completed' || s === 'ARRIVED') {
            category = 'completed';
            departmentStatsMap[dept].approved++;
        }

        if (monthlyTrendsMap[key]) {
            monthlyTrendsMap[key].submitted++;
            if (category === 'approved') monthlyTrendsMap[key].approved++;
            if (category === 'rejected') monthlyTrendsMap[key].rejected++;
            if (category === 'completed') monthlyTrendsMap[key].completed++;
        }

        if (workloadMap[key]) {
            if (category === 'submitted' || category === 'approved' || category === 'ongoing') {
                workloadMap[key].active++;
            }
        }
    });

    const monthlyTrends = Object.values(monthlyTrendsMap);
    const workloadActivity = Object.values(workloadMap);
    
    const departmentStatsRaw = Object.values(departmentStatsMap);
    departmentStatsRaw.forEach(d => {
        d.approvalRate = Math.round((d.approved / d.volume) * 100);
    });
    const departmentStats = departmentStatsRaw.sort((a,b) => b.volume - a.volume).slice(0, 10);

    const formTypeStats = [
        { name: 'Trip Tickets', value: ttCount },
        { name: 'Purchase Req', value: prfCount },
        { name: 'Payment Req', value: rrfCount }
    ].filter(f => f.value > 0);

    res.json({
        monthlyTrends,
        departmentStats,
        formTypeStats,
        workloadActivity,
        totalForms: allForms.filter(f => f.status !== 'Archived').length
    });

  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to get analytics' });
  }
};
