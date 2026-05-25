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

    const allForms = [...prfs, ...rrfs, ...triptickets];

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

      // Pending
      if (s === 'Pending' || 
          s === 'Pending Verification' || 
          s === 'Pending Approval' || 
          s === 'Pending Endorsement' || 
          s === 'Pending Dept Head Approval' || 
          s === 'Pending Final Approval' ||
          (s === 'Approved' && !form.receivedBy && form.to)) { // RRF specific pending condition
        pending++;
        category = 'pending';
      }
      // Approved / Resolved
      else if (s === 'Approved' || s === 'Resolved' || s === 'Completed' || s === 'ARRIVED') {
        approved++;
        category = 'approved';
      }
      // Rejected / Archived
      else if (s === 'Archived' || s === 'Disapproved' || s === 'Closed' || s === 'Cancelled' || s === 'CANCELLED') {
        rejected++;
        category = 'rejected';
      }
      // Ongoing (In Progress)
      else if (s === 'In Progress' || s === 'Ongoing' || s === 'DEPARTED') {
        ongoing++;
        category = 'ongoing';
      }
      
      // Special logic for ongoing TripTickets (Approved but currently traveling)
      if (form.status === 'Approved' && form.guardOut && !form.guardIn) {
        if (category !== 'ongoing') {
           ongoing++;
           category = 'ongoing';
        }
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
      prisma.driver.count({ where: { status: 'Active' } })
    ]);

    res.json({
      pending,
      approved,
      rejected,
      ongoing,
      today: todayCount,
      totalForms: allForms.length,
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
