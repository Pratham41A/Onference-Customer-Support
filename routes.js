import express from "express";
import {  root,  fetchMessages, fetchInboxes, createActivity, fetchActivities, checkAuth, auth, fetchSubscriptions, fetchPayments, updateInbox, fetchViews, getMicrosoftSubscriptions, manageIncomingOutlook, manageNewOutgoingOutlook, manageReplyOutgoingOutlook, manageNewOutgoingWhatsapp, manageNewOutgoingWhatsappTemplate, fetchDashboard, login, createUser} from "./controls.js";
const router=express.Router();

router.get("/",root)
/*
Whatsapp Incoming
Whatsapp/Email Incoming File Handling
*/

router.post("/whatsapp/template",auth,manageNewOutgoingWhatsappTemplate)
router.post("/whatsapp/new",auth,manageNewOutgoingWhatsapp)
router.post('/outlook/reply',auth,manageReplyOutgoingOutlook)
router.post('/outlook/new',auth,manageNewOutgoingOutlook)
router.get('/microsoft/subscriptions',auth,getMicrosoftSubscriptions)
router.post("/outlook/webhook",manageIncomingOutlook)
router.get('/views/:userId',auth,fetchViews)
router.patch('/inbox/:inboxId',auth,updateInbox)
router.get('/payments/:userId',auth,fetchPayments)
router.get('/subscriptions/:userId',auth,fetchSubscriptions)
router.get('/messages/:userId',auth,fetchMessages)
router.get('/inboxes',auth,fetchInboxes)
router.get('/dashboards',auth,fetchDashboard)
router.post('/activity',auth,createActivity)
router.get('/activities/:userId',auth,fetchActivities)

router.post('/auth',checkAuth)
router.post('/login',login)
router.post('/user',createUser)

export default router