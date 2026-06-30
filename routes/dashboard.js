const express = require('express');
const Location = require('../models/Location');
const Diffuser = require('../models/Diffuser');
const WorkRecord = require('../models/WorkRecord');
const { formatDate, dueStatus, groupDiffusersByLocation, machineUrgency } = require('../utils/dates');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [locationCount, diffuserCount, recordCount, diffusers] = await Promise.all([
      Location.countDocuments(),
      Diffuser.countDocuments({ isActive: true }),
      WorkRecord.countDocuments(),
      Diffuser.find({ isActive: true }).populate('location', 'name').sort({ createdAt: 1 }),
    ]);

    const overdueOil = diffusers.filter((d) => dueStatus(d.nextOilChange) === 'overdue').length;
    const overdueBattery = diffusers.filter((d) => dueStatus(d.nextBatteryChange) === 'overdue').length;
    const dueSoon = diffusers.filter((d) => machineUrgency(d) !== 'ok').length;

    const dueGroups = groupDiffusersByLocation(diffusers, { dueOnly: true });

    res.render('dashboard', {
      title: '總覽',
      stats: { locationCount, diffuserCount, recordCount, overdueOil, overdueBattery, dueSoon },
      dueGroups,
      formatDate,
      dueStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法載入儀表板。' });
  }
});

module.exports = router;
