import {  refreshSubscription } from "./services.js";

export function scheduler() {

setInterval(async () => {
  await refreshSubscription();
}, 55 * 60 * 1000); // After Each 55 minutes

}