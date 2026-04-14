const dashboardModel = require("../models/dashboard.model");

const getSummary = async () => {
  return await dashboardModel.getSummary();
};

const getMySummary = async (employeeId) => {
  return await dashboardModel.getMySummary(employeeId);
};

const getTodayStatus = async (employeeId) => {
  return await dashboardModel.getTodayStatus(employeeId);
};

const calculateTrend = (current, previous) => {
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;

  if (prev === 0 && curr === 0) return 0;
  if (prev === 0 && curr > 0) return 100;

  return (((curr - prev) / prev) * 100).toFixed(1);
};

//  ENHANCED AI ENGINE - This is the KEY
const calculateInsights = (summary, trends = {}, analytics = {}) => {
  const present = Number(summary.present) || 0;
  const late = Number(summary.late) || 0;
  const absent = Number(summary.absent) || 0;
  const leave = Number(summary.on_leave) || 0;

  const total = present + late + absent + leave;

  const attendanceRate = total ? ((present + late) / total) * 100 : 0;
  const absenteeRate = total ? (absent / total) * 100 : 0;
  const lateRate = total ? (late / total) * 100 : 0;

  const insights = [];

  //  1. Attendance rules
  if (attendanceRate < 70) {
    insights.push({
      type: "warning",
      message: "Attendance is critically low. Immediate action needed.",
    });
  } else if (attendanceRate < 85) {
    insights.push({
      type: "warning",
      message: "Attendance is below optimal levels.",
    });
  } else if (attendanceRate > 90) {
    insights.push({
      type: "success",
      message: "Great attendance rate! Keep up the good work.",
    });
  } else {
    insights.push({
      type: "success",
      message: "Attendance is at a healthy level.",
    });
  }

  //  2. Absenteeism rules
  if (absenteeRate > 10) {
    insights.push({
      type: "trend-down",
      message: "High absenteeism detected. Check employee engagement.",
    });
  } else if (absenteeRate > 5) {
    insights.push({
      type: "info",
      message: "Moderate absenteeism. Monitor this trend.",
    });
  }

  // 3. Late rules
  if (lateRate > 8) {
    insights.push({
      type: "warning",
      message: "Frequent lateness observed. Review shift schedules.",
    });
  } else if (lateRate < 3 && lateRate > 0) {
    insights.push({
      type: "success",
      message: "Employees show strong punctuality.",
    });
  }

  //  4. Trend-based rules
  if (trends.absent && trends.absent > 5) {
    insights.push({
      type: "trend-down",
      message: `Absences increased by ${trends.absent}% compared to last month.`,
    });
  }

  if (trends.present && trends.present > 5) {
    insights.push({
      type: "trend-up",
      message: `Attendance improved by ${trends.present}% this month.`,
    });
  }

  if (trends.late && trends.late > 5) {
    insights.push({
      type: "warning",
      message: `Late arrivals increased by ${trends.late}% - investigate causes.`,
    });
  }

  // 5. Peak absentee month (advanced)
  if (analytics.absent_trend && analytics.absent_trend.length > 0) {
    const peak = analytics.absent_trend.reduce((max, curr) =>
      curr.absent > max.absent ? curr : max,
    );

    if (peak.absent > 0) {
      insights.push({
        type: "info",
        message: `Peak absenteeism in ${peak.month} with ${peak.absent} days.`,
      });
    }
  }

  // 6. Daily patterns (if available)
  if (analytics.daily_breakdown && analytics.daily_breakdown.length > 0) {
    const worstDay = analytics.daily_breakdown.reduce((worst, curr) => {
      const currAbsent = Number(curr.absent) || 0;
      const worstAbsent = Number(worst.absent) || 0;
      return currAbsent > worstAbsent ? curr : worst;
    });

    if (worstDay && worstDay.absent > 0) {
      const dayName = new Date(worstDay.date).toLocaleDateString("en-US", {
        weekday: "long",
      });
      insights.push({
        type: "info",
        message: `${dayName}s show highest absenteeism. Consider flexible Fridays?`,
      });
    }
  }

  //  fallback
  if (insights.length === 0) {
    insights.push({
      type: "success",
      message: "All attendance metrics are within normal range.",
    });
  }

  return {
    attendanceRate: attendanceRate.toFixed(1),
    absenteeRate: absenteeRate.toFixed(1),
    lateRate: lateRate.toFixed(1),
    insights: insights.slice(0, 4), // Max 4 insights
  };
};

const getAdminAnalytics = async () => {
  const [data, summary, monthly] = await Promise.all([
    dashboardModel.getAdminAnalytics(),
    dashboardModel.getSummary(),
    dashboardModel.getMonthlyComparison(),
  ]);

  const previous = monthly[0] || {};
  const current = monthly[1] || {};

  const trends = {
    present: calculateTrend(current.present, previous.present),
    late: calculateTrend(current.late, previous.late),
    absent: calculateTrend(current.absent, previous.absent),
    on_leave: calculateTrend(current.on_leave, previous.on_leave),
  };

  // FIXED: Extract insights array, NOT the whole object
  const insightsData = calculateInsights(summary, trends, data);

  return {
    ...data,
    summary,
    trends,
    // insights is now a DIRECT array
    insights: insightsData.insights,
    // metrics available separately if needed
    metrics: {
      attendanceRate: insightsData.attendanceRate,
      absenteeRate: insightsData.absenteeRate,
      lateRate: insightsData.lateRate,
    },
  };
};

const getMyAnalytics = async (employeeId) => {
  const [summary, monthly] = await Promise.all([
    dashboardModel.getMySummary(employeeId),
    dashboardModel.getMyMonthlyComparison(employeeId),
  ]);

  const previous = monthly[0] || {};
  const current = monthly[1] || {};

  const trends = {
    present: calculateTrend(current.present, previous.present),
    late: calculateTrend(current.late, previous.late),
    absent: calculateTrend(current.absent, previous.absent),
    on_leave: calculateTrend(current.on_leave, previous.on_leave),
  };

  //  FIXED: Same fix for employee
  const insightsData = calculateInsights(summary, trends, {});

  return {
    summary,
    trends,
    insights: insightsData.insights,
    metrics: {
      attendanceRate: insightsData.attendanceRate,
      absenteeRate: insightsData.absenteeRate,
      lateRate: insightsData.lateRate,
    },
  };
};

module.exports = {
  getSummary,
  getMySummary,
  getTodayStatus,
  getAdminAnalytics,
  calculateInsights,
  getMyAnalytics,
};
