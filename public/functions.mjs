// import { AgreementFunctionalLocationSearch } from "./functions/agreementFunctionalLocationSearch.mjs";
window.agreementFL = window.agreementFL || [];
window.serviceZone = window.serviceZone || [];

window.addEventListener("message", (event) => {
  console.log("📨 Message received in iframe:", event.data);

  if (event.data?.type === "functionallocations") {
    console.log("✅ FL payload received:", event.data.payload);
    window.agreementFL.push(...event.data.payload);
    //AgreementFunctionalLocationSearch(viewer, event.data.payload);
  } else if (event.data?.type === "quoteFunctionalLocations") {
    console.log("✅ FL payload received:", event.data.payload);
    window.agreementFL.push(...event.data.payload);
    // AgreementFunctionalLocationSearch(viewer, event.data.payload);
  } else if (event.data?.type === "ready-for-data") {
    // Send confirmation back to the CRM form
    window.parent.postMessage({ type: "ready" }, "*");
  } else if (event.data?.type === "QBSfunctionallocations") {
    const payload = event.data.payload;
    console.log("Got functional locations data:", payload);
    // Do something with it
  } else if (event.data?.type === "functionallocations_with_tasks") {
    console.log("Clearing functional locations data");
    window.serviceZone = [];  
    window.serviceZone.push(...event.data.payload);
  } else if (event.data?.type === "spaceInventory") {
    console.log("Clearing functional locations data");
    window.spaceInventory = [];  
    window.spaceInventory.push(...event.data.payload);
    console.log("✅ Space Inventory payload received:", event.data.payload);
  }

});