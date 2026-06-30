const express = require('express');
const Location = require('../models/Location');
const Diffuser = require('../models/Diffuser');
const WorkRecord = require('../models/WorkRecord');
const { formatDate, dueStatus, groupDiffusersByLocation } = require('../utils/dates');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const diffusers = await Diffuser.find({ isActive: true })
      .populate('location', 'name')
      .sort({ createdAt: 1 });
    const groups = groupDiffusersByLocation(diffusers);

    res.render('diffusers/list', {
      title: '精油機',
      groups,
      formatDate,
      dueStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法載入精油機列表。' });
  }
});

router.get('/new', async (req, res) => {
  const locationId = req.query.location;
  const location = locationId ? await Location.findById(locationId) : null;
  const locations = await Location.find().sort({ name: 1 });
  res.render('diffusers/form', {
    title: location ? location.name : '新增精油機',
    diffuser: null,
    location,
    locations,
    error: null,
  });
});

router.post('/', async (req, res) => {
  try {
    const { location, position, oilType, parts } = req.body;
    if (!location || !position?.trim()) {
      const locations = await Location.find().sort({ name: 1 });
      return res.render('diffusers/form', {
        title: '新增精油機',
        diffuser: req.body,
        location: null,
        locations,
        error: '請選擇地點並輸入機器位置',
      });
    }
    const diffuser = await Diffuser.create({ location, position, oilType, parts });
    res.redirect(`/diffusers/${diffuser._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法新增精油機。' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const diffuser = await Diffuser.findById(req.params.id).populate('location');
    if (!diffuser) return res.status(404).render('error', { title: '找不到', message: '精油機不存在。' });

    const records = await WorkRecord.find({ diffuser: diffuser._id })
      .sort({ performedAt: -1 })
      .limit(50);

    res.render('diffusers/detail', {
      title: diffuser.location.name,
      diffuser,
      records,
      formatDate,
      dueStatus,
      recorded: req.query.recorded === '1',
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法載入精油機詳情。' });
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const diffuser = await Diffuser.findById(req.params.id).populate('location');
    if (!diffuser) return res.status(404).render('error', { title: '找不到', message: '精油機不存在。' });
    const locations = await Location.find().sort({ name: 1 });
    res.render('diffusers/form', {
      title: diffuser.location.name,
      diffuser,
      location: diffuser.location,
      locations,
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法載入精油機。' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { location, position, oilType, parts } = req.body;
    if (!location || !position?.trim()) {
      const diffuser = await Diffuser.findById(req.params.id);
      const locations = await Location.find().sort({ name: 1 });
      return res.render('diffusers/form', {
        title: '編輯精油機',
        diffuser: { ...diffuser.toObject(), ...req.body },
        location: null,
        locations,
        error: '請選擇地點並輸入機器位置',
      });
    }
    await Diffuser.findByIdAndUpdate(req.params.id, { location, position, oilType, parts });
    res.redirect(`/diffusers/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法更新精油機。' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const diffuser = await Diffuser.findByIdAndUpdate(req.params.id, { isActive: false });
    res.redirect(`/locations/${diffuser.location}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: '系統錯誤', message: '無法刪除精油機。' });
  }
});

module.exports = router;
