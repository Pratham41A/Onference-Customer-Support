import mongoose from "mongoose";
const  { model, models,Schema }= mongoose;
const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  password:{
    type: String
  },
  email: {
    type: String
  },
  mobile: {
    type: String
  },
  speciality: {
    type: String
  },
  location: {
    type: String
  },
  registration_date: {
    type: Date
  },
  last_login_date: {
    type: Date
  },
  device: {
    type: String
  },
  topic_filters: [{
    type: String
  }]
}, {
  timestamps: true
});

export const User = models.User || model("User", userSchema);