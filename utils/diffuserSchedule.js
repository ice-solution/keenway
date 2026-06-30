const Diffuser = require('../models/Diffuser');
const WorkRecord = require('../models/WorkRecord');
const { addMonths } = require('./dates');

async function syncDiffuserSchedule(diffuserId) {
  const [latestOil, latestBattery] = await Promise.all([
    WorkRecord.findOne({ diffuser: diffuserId, oilChanged: true }).sort({ performedAt: -1 }),
    WorkRecord.findOne({ diffuser: diffuserId, batteryChanged: true }).sort({ performedAt: -1 }),
  ]);

  const updates = {
    lastOilChange: latestOil?.performedAt || null,
    nextOilChange: latestOil ? addMonths(latestOil.performedAt, 1) : null,
    lastBatteryChange: latestBattery?.performedAt || null,
    nextBatteryChange: latestBattery ? addMonths(latestBattery.performedAt, 2) : null,
  };

  await Diffuser.findByIdAndUpdate(diffuserId, updates);
}

module.exports = { syncDiffuserSchedule };
