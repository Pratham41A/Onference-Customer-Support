import axios from "axios";

export async function getToken() {
  try{
     const tokenUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "https://graph.microsoft.com/.default",
    });

    const tokenRes = await axios.post(tokenUrl, params);
    return tokenRes.data.access_token;
  }catch(e){
    console.log(e.message);
  }
}





export async function refreshSubscription() {
  try{
  const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    //Set Webhook URL in Microsoft App Registration
    const webhookUrl = `${process.env.BACKEND}/outlook/webhook`;

    const subsRes = await axios.get("https://graph.microsoft.com/v1.0/subscriptions", { headers });
    const allSubs = subsRes.data.value ;

    const userSubs = allSubs.filter(
      (s) =>
        //Modify User Email for respective Subscription 
        s.resource.includes(`/users/${process.env.USER_EMAIL}/`) &&
        s.notificationUrl === webhookUrl
    );

    if (userSubs.length > 0) {
      for (const s of userSubs) {
          await axios.delete(`https://graph.microsoft.com/v1.0/subscriptions/${s.id}`, { headers });
      }
    }

    const newSubscription = {
      changeType: "created",
      notificationUrl: webhookUrl,
      //Modify User Email for respective Subscription 
      resource: `/users/${process.env.USER_EMAIL}/mailFolders('Inbox')/messages`,
      expirationDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),//1 Hour Expiry
      //Modify User Email for respective Subscription 
      clientState: `${process.env.USER_EMAIL}+${process.env.SUBSCRIPTION_SECRET}`,
    };
    const res = await axios.post(
      "https://graph.microsoft.com/v1.0/subscriptions",
      newSubscription,
      { headers }
    );
    console.log("✅ Subscription Refreshed :", res.data.id);
  }catch(e){
    console.log(e.message);
  }
}