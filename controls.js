import { Inbox } from './models/inbox.js';
import { Activity } from './models/activity.js';
import {User} from './models/user.js'
import {Message} from './models/message.js';
import {Subscription} from './models/subscription.js';
import {Payment} from './models/payment.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { getToken } from './services.js';
import parseEmailReply from "node-email-reply-parser";
import axios from 'axios';
import { io } from './index.js';
import bcrypt from 'bcryptjs';

export function root(req, res) {
   return res.status(200).json("Om Ganeshay Namah");
}
export async function getMicrosoftSubscriptions(req, res) {
  try {

    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
  const webhookUrl = `${process.env.BACKEND}/outlook/webhook`;

       const subsRes = await axios.get("https://graph.microsoft.com/v1.0/subscriptions", { headers });
    const allSubs = subsRes.data.value ;
 const now = new Date();
    const userActiveSubs = allSubs.filter(
      (s) =>
        s.resource.includes(`/users/${req.email}/`) &&
        s.notificationUrl === webhookUrl&&
        now < new Date(s.expirationDateTime)
    );
    
 
    return res.status(200).json({
      user: req.email,
      count: userActiveSubs.length,
      subscription_ids:userActiveSubs.map((s) => s.id).join(" , "),
    });
  } catch (error) {
 
    return res.status(500).json({
      error: error.message,
    });
  }
}




export async function fetchViews(req, res) {
  try {
   const userId = new mongoose.Types.ObjectId(req.params.userId);
    const views = await Inbox.find({ owner: userId });
    return res.status(200).json(views);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

export async function updateInbox(req, res) {
  try {
    const inboxId = req.params.inboxId;
const type= req.body.type;
switch(type){
  case 'preview':
    {
      const updatedInbox = await Inbox.findByIdAndUpdate(inboxId, { preview: req.body.preview }, {
      new: true,
    });
    return res.status(200).json(updatedInbox);
  }
  case 'status':
    {
      if(req.body.status==='ended'){
       const updatedInbox = await Inbox.findByIdAndUpdate(inboxId, { $inc: { end_count: 1}, status: 'ended' }, {
      new: true,
    });
    return res.status(200).json(updatedInbox);
      }
      else{
      const updatedInbox = await Inbox.findByIdAndUpdate(inboxId, { status: req.body.status }, {
      new: true,
    });
    return res.status(200).json(updatedInbox);
  }
}
  default:
    return res.status(400).json({ error: 'Invalid update type' });
}

  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

export async function fetchPayments(req, res) {
  try {
   const userId = new mongoose.Types.ObjectId(req.params.userId);
    const payments = await Payment.find({ owner: userId });
    return res.status(200).json(payments);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

export async function fetchSubscriptions(req, res) {
  try {
   const userId = new mongoose.Types.ObjectId(req.params.userId);
    const subscriptions = await Subscription.find({ owner: userId });
    return res.status(200).json(subscriptions);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

export async function fetchMessages(req, res) {
  try {
   const userId = new mongoose.Types.ObjectId(req.params.userId);
    const messages = await Message.find({
      $or: [{ from: userId }, { to: userId }]
    });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

export async function fetchInboxes(req, res) {
  try {

    const inboxes = await Inbox.find({}).populate('owner');
    return res.status(200).json(inboxes);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

export async function createActivity(req, res) {
  try {
const {owner,body,due_date} = req.body;
const ownerId = new mongoose.Types.ObjectId(owner);
    const activity = await Activity.create({
      owner: ownerId,
      body,
      due_date:new Date(due_date)
    });
    return res.status(200).json(activity);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

export async function fetchActivities(req, res) {
  try {
   const ownerId = new mongoose.Types.ObjectId(req.params.userId);
    const activities = await Activity.find({
     owner: ownerId
    });
    return res.status(200).json(activities);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

export async function auth(req, res, next) {
  const signedOnfToken = req.cookies.onfToken || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!signedOnfToken) {
   return res.status(401).json({error:'Not Logged In'});
  }

try{
const onfToken= jwt.verify(signedOnfToken, process.env.JWT_SECRET);
 req.email=onfToken.email
    next();
}
catch(error){
return    res.status(401).json({error:error.message});
}

}

export async function checkAuth(req,res){
   const signedOnfToken = req.cookies.onfToken || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!signedOnfToken) {
   return res.status(401).json({error:'Not Logged In'});
  }

try{
 jwt.verify(signedOnfToken, process.env.JWT_SECRET);

    return res.status(200).json({message:'Login'});
}
catch(error){
return    res.status(401).json({error:error.message});
}
}



export async function manageIncomingOutlook(req, res) {
  if (req.query.validationToken) {
    res.set("Content-Type", "text/plain");
    return res.status(200).send(req.query.validationToken);
  }

  res.sendStatus(202);
  if (!req.body.value || !Array.isArray(req.body.value)) return;

  try {
    const notifications = req.body.value;

    for (const notification of notifications) {
      const clientState = notification.clientState;
      const email = clientState.split("+")[0];
      const subscriptionSecret = clientState.split("+")[1];

      if (
        subscriptionSecret !== process.env.SUBSCRIPTION_SECRET
      ) continue;

      const messageId = notification.resourceData.id;
      const token = await getToken();

      const emailResponse = await axios.get(
        `https://graph.microsoft.com/v1.0/users/${email}/messages/${messageId}?$select=subject,body,internetMessageId,internetMessageHeaders,from`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Prefer: 'outlook.body-content-type="text"'
          }
        }
      );

      const emailData = emailResponse.data;
      var { internetMessageId,subject,body,internetMessageHeaders } = emailData;
      const {content} = body;
       body = parseEmailReply(content).getVisibleText();

      const replyHeader = internetMessageHeaders
        .find(h => h.name.toLowerCase() === "in-reply-to");
    
      let inReplyToInternetMessageId = null;

      if (replyHeader) {
        inReplyToInternetMessageId = replyHeader.value;
      }

      let from = await User.findOne({ email: emailData.from.emailAddress.address });
      if (!from) {
        from = await User.create({
          email: emailData.from.emailAddress.address,
          name: emailData.from.emailAddress.name
        });
      }

      let to = await User.findOne({ email });
      if (!to) to = await User.create({ email, name: "NA" });

      let inReplyTo = null;
      if (inReplyToInternetMessageId) {
        inReplyTo = await Message.findOne({ internetMessageId: inReplyToInternetMessageId });
      }

      const message = await Message.create({
        from: from._id,
        to: to._id,
        subject: inReplyTo ? inReplyTo.subject : subject,
        body,
        source: "email",
        type: "body",
        messageId,                  
        internetMessageId,        
        inReplyTo: inReplyTo ? inReplyTo._id : null
      });

     const inbox = await Inbox.findOneAndUpdate(
        { owner: from._id },
        { preview: body, status: "unread" },
        { upsert: true, new: true }
      );
io.emit("message", message);
io.emit("inbox", inbox);
      console.log("Incoming Email:", message._id);
      console.log("Inbox : ", inbox._id);
    }
  } catch (error) {
    console.log(error.message);
  }
}

export async function manageNewOutgoingOutlook(req, res) {
  try {
    const { email, subject, body } = req.body;

    const token = await getToken();

    const toRecipients = Array.isArray(email)
      ? email.map(e => ({ emailAddress: { address: e } }))
      : [{ emailAddress: { address: email } }];

    const draftResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${req.email}/messages`,
      {
        subject,
        body: { contentType: "Text", content: body },
        toRecipients
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const messageId = draftResponse.data.id;

    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${req.email}/messages/${messageId}/send`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const metaResponse = await axios.get(
      `https://graph.microsoft.com/v1.0/users/${req.email}/messages/${messageId}?$select=internetMessageId`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const {internetMessageId} = metaResponse.data;
    let to = await User.findOne({ email }) || await User.create({ name: "NA", email });
    let from = await User.findOne({ email: req.email }) || await User.create({ name: "NA", email: req.email });

    const message = await Message.create({
      from: from._id,
      to: to._id,
      subject,
      body,
      source: "email",
      type: "body",
      internetMessageId,
      messageId,
      inReplyTo: null
    });
    const inbox = await Inbox.findOneAndUpdate(
      { owner: to._id },
      { preview: body, status: "read" },
      { upsert: true, new: true }
    )
    io.emit("message", message);
    io.emit("inbox", inbox);
    return res.status(200).json({ message: `Email Sent ${message._id}` });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}


export async function manageReplyOutgoingOutlook(req, res) {
  try {
    const { replyMessageId, body, email } = req.body;

    const token = await getToken();

    const draftResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${req.email}/messages/${replyMessageId}/createReply`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const messageId = draftResponse.data.id;  

    await axios.patch(
      `https://graph.microsoft.com/v1.0/users/${req.email}/messages/${messageId}`,
      { body: { contentType: "Text", content: body } },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${req.email}/messages/${messageId}/send`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const metaResponse = await axios.get(
      `https://graph.microsoft.com/v1.0/users/${req.email}/messages/${messageId}?$select=internetMessageId`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const {internetMessageId} = metaResponse.data;

    const inReplyTo = await Message.findOne({ messageId: replyMessageId });

    let from = await User.findOne({ email: req.email }) 
             || await User.create({ email: req.email, name: "NA" });

    let to = await User.findOne({ email }) 
           || await User.create({ email, name: "NA" });

    const message = await Message.create({
      from: from._id,
      to: to._id,
      subject: inReplyTo.subject,
      body,
      source: "email",
      type: "body",
      internetMessageId,
      inReplyTo: inReplyTo._id,
      messageId
    });
const inbox = await Inbox.findOneAndUpdate(
      { owner: to._id },
      { preview: body, status: "read" },
      { upsert: true, new: true }
)
io.emit("message", message);
    io.emit("inbox", inbox);
    return res.status(200).json({
      message: `Email Reply Sent : ${message._id}`
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function manageNewOutgoingWhatsapp(req, res) {
  try {
    const { mobile, body } = req.body;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: mobile,
      type: "text",
      text: { body },
    };

await axios.post(process.env.D360_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": process.env.D360_API_KEY,
      },
    });

    let from = await User.findOne({ email: req.email });
    if (!from) from = await User.create({ email: req.email, name: "NA" });

    let to = await User.findOne({ mobile });
    if (!to) to = await User.create({ mobile, name: "NA" });

   const message= await Message.create({
      from: from._id,
      to: to._id,
      source: "whatsapp",
      type: "body",
      body,
      messageId:null,               
      internetMessageId: null, 
      inReplyTo: null          
    });
    const inbox = await Inbox.findOneAndUpdate(
      { owner: to._id },
      { preview: body, status: "read" },
      { upsert: true, new: true }
    )
    io.emit("message", message);
io.emit("inbox", inbox);
    return res.status(200).json(`Whatsapp Sent${message._id}`);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

export async function manageNewOutgoingWhatsappTemplate(req, res) {
  try {
    const { mobile, template } = req.body;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: mobile,
      type: "template",
      template: {
        namespace: process.env.D360_NAMESPACE,
        name: template,
        language: { code: "en_US" }
      }
    };

    await axios.post(process.env.D360_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": process.env.D360_API_KEY
      }
    });

    let from = await User.findOne({ email: req.email });
    if (!from) from = await User.create({ email: req.email,name: "NA" });

    let to = await User.findOne({ mobile });
    if (!to) to = await User.create({ mobile,name: "NA" });

   const message = await Message.create({
      from: from._id,
      to: to._id,
      source: "whatsapp",
      type: "template",
      template
    });
     const inbox = await Inbox.findOneAndUpdate(
      { owner: to._id },
      { preview: template, status: "read" },
      { upsert: true, new: true }
    )
io.emit("inbox", inbox);
io.emit('message',message);
    return res.status(200).json(`Whatsapp Template Sent : ${message._id}`);
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}


export async function fetchDashboard(req, res) {
  try {

    const statusCountResponse = await Inbox.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

     const endCountResponse = await Inbox.aggregate([
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$end_count" }
        }
      }
    ]);

    const totalEnded = endCountResponse[0].totalCount || 0;

    const dashboardResponse = {};

    statusCountResponse.forEach(s => {
      dashboardResponse[s._id] = {
        status: s._id,
        count: s.count
      };
    });

    dashboardResponse["ended"] = {
      status: "ended",
      count: totalEnded
    };

    return res.status(200).json(dashboardResponse);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}



export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const onfToken = jwt.sign(
      {  email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    res.cookie("onfToken", onfToken, {
      httpOnly: true,
      secure:  Boolean(process.env.COOKIE_SECURE),
      sameSite:process.env.COOKIE_SAME_SITE,
      maxAge:Number(eval(process.env.COOKIE_JWT_EXPIRY)),
    });

    return res.status(200).json({
      message: "Login"
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


export async function createUser(req,res){
  const {onfToken,email,password}=req.body
  if(onfToken===process.env.JWT_SECRET){
    const user=await User.findOne({email})
    if(user){
      return res.status(200).json(user)
    }

    const newUser=await User.create({email,password:await bcrypt.hash(password,10),name:'ONFERENCE'})
    return res.status(200).json(newUser)
  }
  else{
    return res.status(401).json({error:"Unauthorized"})
  }
}