const express = require('express');
const Location = require('../models/Location');
const Diffuser = require('../models/Diffuser');
const WorkRecord = require('../models/WorkRecord');
const { formatDate } = require('../utils/dates');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    const counts = await Diffuser.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

    res.render('locations/list', {
      title: '地點管理',
      locations,
      countMap,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法載入地點列表。' });
  }
});

router.get('/new', (req, res) => {
  res.render('locations/form', { title: '新增地點', location: null, error: null });
});

router.post('/', async (req, res) => {
  try {
    const { name, address, contact, notes } = req.body;
    if (!name?.trim()) {
      return res.render('locations/form', {
        title: '新增地點',
        location: req.body,
        error: '請輸入地點名稱',
      });
    }
    await Location.create({ name, address, contact, notes });
    res.redirect('/locations');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法新增地點。' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).render('error', { title: '找不到', message: '地點不存在。' });

    const diffusers = await Diffuser.find({ location: location._id, isActive: true }).sort({ createdAt: 1 });

    const diffuserIds = diffusers.map((d) => d._id);
    const latestRecords = diffuserIds.length
      ? await WorkRecord.aggregate([
          { $match: { diffuser: { $in: diffuserIds } } },
          { $sort: { performedAt: -1 } },
          {
            $group: {
              _id: '$diffuser',
              performedAt: { $first: '$performedAt' },
              actions: { $first: '$actions' },
              oilChanged: { $first: '$oilChanged' },
              batteryChanged: { $first: '$batteryChanged' },
              performedBy: { $first: '$performedBy' },
            },
          },
        ])
      : [];
    const lastRecordMap = Object.fromEntries(latestRecords.map((r) => [r._id.toString(), r]));

    res.render('locations/detail', { title: location.name, location, diffusers, lastRecordMap, formatDate });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法載入地點詳情。' });
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).render('error', { title: '找不到', message: '地點不存在。' });
    res.render('locations/form', { title: '編輯地點', location, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法載入地點。' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, address, contact, notes } = req.body;
    if (!name?.trim()) {
      const location = await Location.findById(req.params.id);
      return res.render('locations/form', {
        title: '編輯地點',
        location: { ...location.toObject(), ...req.body },
        error: '請輸入地點名稱',
      });
    }
    await Location.findByIdAndUpdate(req.params.id, { name, address, contact, notes });
    res.redirect(`/locations/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法更新地點。' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    await Diffuser.updateMany({ location: req.params.id }, { isActive: false });
    res.redirect('/locations');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法刪除地點。' });
  }
});

module.exports = router;
