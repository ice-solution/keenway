const mongoose = require('mongoose');

const diffuserSchema = new mongoose.Schema(
  {
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    position: { type: String, required: true, trim: true },
    oilType: { type: String, trim: true, default: '' },
    parts: { type: String, trim: true, default: '' },
    lastOilChange: { type: Date, default: null },
    nextOilChange: { type: Date, default: null },
    lastBatteryChange: { type: Date, default: null },
    nextBatteryChange: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Diffuser', diffuserSchema);
