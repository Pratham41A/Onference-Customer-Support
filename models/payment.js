import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
const paymentSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course_name: {
    type: String,
    required: true
  },
  payment_date: {
    type: Date,
    required: true
  },
  payment_time: {
    type: String,
    required: true
  },
  transaction_id: {
    type: String,
    unique: true,
    required: true
  },
  currency_type: {
    type: String,
    required: true
  },
  payment_source: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export const Payment = models.Payment || model('Payment', paymentSchema);