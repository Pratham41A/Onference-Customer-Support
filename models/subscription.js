import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
const subscriptionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package_name: {
    type: String
  },
  package_start_date: {
    type: Date
  },
  package_end_date: {
    type: Date
  },
  plan_type: {
    type: String
  },
  payment_name: {
    type: String
  },
  payment_date: {
    type: Date
  },
  payment_time: {
    type: String 
  },
  currency_type: {
    type: String
  },
  payment_method: {
    type: String
  },
  payment_id: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

export const Subscription = models.Subscription || model('Subscription', subscriptionSchema);