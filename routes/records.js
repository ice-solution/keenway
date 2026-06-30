const express = require('express');
const Diffuser = require('../models/Diffuser');
const WorkRecord = require('../models/WorkRecord');
const { syncDiffuserSchedule } = require('../utils/diffuserSchedule');

const router = express.Router();

function parseCheckbox(val) {
  return val === 'on' || val === 'true';
}

function parsePerformedAt(value) {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function formatDateInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

router.get('/new', async (req, res) => {
  const diffuserId = req.query.diffuser;
  if (!diffuserId) return res.redirect('/locations');

  const diffuser = await Diffuser.findById(diffuserId).populate('location');
  if (!diffuser) return res.status(404).render('error', { title: '找不到', message: '精油機不存在。' });

  res.render('records/form', {
    title: diffuser.location.name,
    diffuser,
    record: null,
    error: null,
    formatDateInput,
  });
});

router.get('/:id/edit', async (req, res) => {
  try {
    const record = await WorkRecord.findById(req.params.id);
    if (!record) return res.status(404).render('error', { title: '找不到', message: '工作記錄不存在。' });

    const diffuser = await Diffuser.findById(record.diffuser).populate('location');
    if (!diffuser) return res.status(404).render('error', { title: '找不到', message: '精油機不存在。' });

    res.render('records/form', {
      title: diffuser.location.name,
      diffuser,
      record,
      error: null,
      formatDateInput,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法載入工作記錄。' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      diffuser: diffuserId,
      location: locationId,
      checked,
      actions,
      oilChanged,
      batteryChanged,
      notes,
      performedBy,
      performedAt,
    } = req.body;

    const diffuser = await Diffuser.findById(diffuserId);
    if (!diffuser) return res.status(404).render('error', { title: '找不到', message: '精油機不存在。' });

    const when = parsePerformedAt(performedAt);
    const oil = parseCheckbox(oilChanged);
    const battery = parseCheckbox(batteryChanged);

    await WorkRecord.create({
      diffuser: diffuserId,
      location: locationId,
      checked: parseCheckbox(checked) || checked === undefined,
      actions: actions || '',
      oilChanged: oil,
      batteryChanged: battery,
      notes: notes || '',
      performedAt: when,
      performedBy: performedBy || req.session.user?.username || '',
    });

    await syncDiffuserSchedule(diffuserId);
    res.redirect(`/diffusers/${diffuserId}?recorded=1`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法儲存工作記錄。' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await WorkRecord.findById(req.params.id);
    if (!record) return res.status(404).render('error', { title: '找不到', message: '工作記錄不存在。' });

    const {
      checked,
      actions,
      oilChanged,
      batteryChanged,
      notes,
      performedBy,
      performedAt,
    } = req.body;

    record.checked = parseCheckbox(checked);
    record.actions = actions || '';
    record.oilChanged = parseCheckbox(oilChanged);
    record.batteryChanged = parseCheckbox(batteryChanged);
    record.notes = notes || '';
    record.performedBy = performedBy || '';
    record.performedAt = parsePerformedAt(performedAt);
    await record.save();

    await syncDiffuserSchedule(record.diffuser);
    res.redirect(`/diffusers/${record.diffuser}?recorded=1`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法更新工作記錄。' });
  }
});

module.exports = router;
