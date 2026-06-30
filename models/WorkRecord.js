const mongoose = require('mongoose');

const workRecordSchema = new mongoose.Schema(
  {
    diffuser: { type: mongoose.Schema.Types.ObjectId, ref: 'Diffuser', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    checked: { type: Boolean, default: true },
    actions: { type: String, trim: true, default: '' },
    oilChanged: { type: Boolean, default: false },
    batteryChanged: { type: Boolean, default: false },
    notes: { type: String, trim: true, default: '' },
    performedAt: { type: Date, default: Date.now },
    performedBy: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkRecord', workRecordSchema);
