import { initViewer, loadModel } from "./viewer.mjs";
import { initTree } from "./sidebar.mjs";

document.addEventListener("DOMContentLoaded", () => {
  // console.log("HELLOOO WORLD");
  if (!localStorage.getItem("authToken") || isTokenExpired()) {
    fetchAccessToken(); // Starts fetching early, before user clicks anything
  }
});

// window.agreementFL = window.agreementFL || [];

// window.addEventListener("message", (event) => {
//   console.log("📨 Message received in iframe:", event.data);

//   if (event.data?.type === "functionallocations") {
//     console.log("✅ FL payload received:", event.data.payload);
//     window.agreementFL.push(...event.data.payload);
//     //AgreementFunctionalLocationSearch(viewer, event.data.payload);
//   }
// });

const login = document.getElementById("login");

// Function to fetch access token using Client Credentials from your server
export async function fetchAccessToken() {
  try {
    const response = await fetch("/api/auth/token"); // Fetch the token from the server-side endpoint
    if (!response.ok) {
      throw new Error("Failed to get access token");
    }
    const data = await response.json();
    localStorage.setItem("authToken", data.access_token);
    localStorage.setItem("refreshToken", data.refresh_token);
    localStorage.setItem("expires_at", Date.now() + data.expires_in * 1000); // Store expiry time in milliseconds
    localStorage.setItem("internal_token", data.internal_token);

    return data.access_token; // Return the access token
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw error;
  }
}

// Function to check if the token is still valid
export function isTokenExpired() {
  const expires_at = localStorage.getItem("expires_at");
  return !expires_at || Date.now() >= parseInt(expires_at, 10);
}


// import { initViewer, loadModel } from "./viewer.mjs";
// import { initTree } from "./sidebar.mjs";

// document.addEventListener("DOMContentLoaded", async () => {
//   try {
//     // Start all tasks in parallel
//     const tokenPromise = (!localStorage.getItem("authToken") || isTokenExpired())
//       ? fetchAccessToken()
//       : Promise.resolve(localStorage.getItem("authToken"));

//     const modelPromise = loadModel(); // Start loading the model immediately

//     const websocketPromise = setupWebSocket(); // Start WebSocket setup immediately

//     // Wait for all to finish
//     const [authToken, model, socket] = await Promise.all([
//       tokenPromise,
//       modelPromise,
//       websocketPromise
//     ]);

//     console.log("✅ Token, model, and WebSocket are ready!");
//     initializeApp(authToken, model, socket);
//   } catch (error) {
//     console.error("Error during initialization:", error);
//   }
// });

// // Fetch token
// export async function fetchAccessToken() {
//   const response = await fetch("/api/auth/token");
//   if (!response.ok) throw new Error("Failed to get access token");
//   const data = await response.json();
//   localStorage.setItem("authToken", data.access_token);
//   localStorage.setItem("refreshToken", data.refresh_token);
//   localStorage.setItem("expires_at", Date.now() + data.expires_in * 1000);
//   localStorage.setItem("internal_token", data.internal_token);
//   return data.access_token;
// }

// // Check token expiry
// export function isTokenExpired() {
//   const expires_at = localStorage.getItem("expires_at");
//   return !expires_at || Date.now() >= parseInt(expires_at, 10);
// }

// // WebSocket setup
// async function setupWebSocket() {
//   const userGuid = new URLSearchParams(window.location.search).get("userGuid");
//   if (!userGuid) return null;

//   return new Promise((resolve, reject) => {
//     const socket = new WebSocket(`wss://hemydigitaltwin-dra9gjbxbsaydxdz.northeurope-01.azurewebsites.net/ws/${userGuid}`);
//     socket.addEventListener("open", () => {
//       console.log("🔌 WebSocket connected");
//       socket.send(JSON.stringify({ type: "ping" }));
//       resolve(socket);
//     });
//     socket.addEventListener("error", reject);
//   });
// }

// // Initialize app after everything is ready
// function initializeApp(authToken, model, socket) {
//   initViewer(model);
//   initTree();
//   console.log("App initialized with token:", authToken);
// }





















async function initApp() {
  try {
    let authToken = localStorage.getItem("authToken");
    let refreshToken = localStorage.getItem("refreshToken");
    let expires_at = localStorage.getItem("expires_at");
    let internal_token = localStorage.getItem("internal_token");

    // console.log(authToken);
    // console.log(refreshToken);
    // console.log(expires_at);
    // console.log(internal_token);

    // If the token is expired or not present, fetch a new one
    if (!authToken || isTokenExpired()) {
      console.log("Fetching new access token...");
      authToken = await fetchAccessToken(); // Get a new token if expired
    }

    // Fetch user profile using the access token
    const resp = await fetch("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${authToken}`, // Send authToken in the Authorization header
        "x-refresh-token": refreshToken, // Send refreshToken in a custom header
        "x-expires-at": expires_at, // Send expires_at in a custom header
        "x-internal-token": internal_token, // Send internal_token in a custom header
      },
    });

    if (resp.ok) {
      const user = await resp.json();
      login.innerText = `Logout`;
      login.style.visibility = "hidden"; //test
      login.onclick = () => {
        // Logout logic
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expires_at");
        localStorage.removeItem("internal_token");
        window.location.reload(); // Reload the page after logout
      };

      // retrieve query parameters from the URL
      let params = {};
      let queryString = window.location.search.substring(1);
      let queryParts = queryString.split("&");
      for (let i = 0; i < queryParts.length; i++) {
        let param = queryParts[i].split("=");
        params[decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
      }

      // get the entity name and record ID

      let entityType = params["typename"]; // The entity type name (e.g., iotdatapoint)
      let recordId = params["id"]; // The unique identifier (GUID) of the record
      let property = params["property"]; // The property value, if it exists
      let uniqueID = params["uniqueID"]; // The uniqueID, if it exists
      let ServiceZone = params["SZ"]; // The Service Zone, if it exists
      let FunctionalLocation = params["FL"]; // The Functional Location, if it exists
      let RepeatingTask = params["RT"]; // The Repeating Task, if it exists
      let WOST = params["WOST"]; // The Work Order Service Task, if it exists
      let sessionId = params["sessionId"]; // The session id, if it exists
      let userType = params["user"]; // The user, if it exists
      const userGuid = params["userGuid"];
      let sidebar = params["sidebar"]; // The sidebar, if it exists
      window.userGuid = userGuid; // Store userGuid in the global window object

      if (sidebar === "off") {
        document.getElementById("viewerSidebar").style.display = "none";
        document.getElementById("layoutRow").style.right = "0px";
        document.getElementById("toggleSidebar").style.display = "none";
      }
      
      if (userGuid) {
            // ✅ Create WebSocket
            // const socket = new WebSocket(`ws://localhost:8080/ws/${userGuid}`); // localhost
            const socket = new WebSocket(`wss://hemydigitaltwin-dra9gjbxbsaydxdz.northeurope-01.azurewebsites.net/ws/${userGuid}`); // live
            window.socket = socket; // Store the socket in the global window object
            socket.addEventListener("open", () => {
            console.log("🔌 WebSocket connected");
            socket.send(JSON.stringify({ type: "ping" }));
            });

            socket.addEventListener("message", (event) => {
            console.log("📩 WebSocket message received:", event.data);
            });

            socket.addEventListener("close", () => {
            console.log("❌ WebSocket closed");
            });

            socket.addEventListener("error", (error) => {
            console.error("⚠️ WebSocket error:", error);
            });
      }

      if (userType == "tenant" || userType == "supplier") {
        // document.getElementById("3D-button").style.display = "none";
        document.getElementById("2D-sheets-item").style.display = "none";
        document.getElementById("live-data-button-item").style.display = "none";
        document.getElementById("zones-button-item").style.display = "none";
        document.getElementById("model-browser-button-item").style.display = "none";
        document.getElementById("levels-item").style.display = "none";
      } else if (userType == "supplier") {
        // document.getElementById("3D-button").style.display = "none";
        document.getElementById("2D-sheets").style.display = "none";
        document.getElementById("live-data").style.display = "none";
        document.getElementById("zones-button").style.display = "none";
        document.getElementById("model-browser").style.display = "none";
        document.getElementById("levels").style.display = "none";
      }

      if (RepeatingTask || WOST) {
        const abbreviationToRecordId = {
          DB8: "06eddd02-c366-ef11-bfe2-000d3ab1d1c2",
          HG62: "422be7c5-ef69-ef11-bfe2-000d3a6735d4",
          SOL10: "10ff2730-d365-ef11-bfe3-6045bddd062a",
          "SOL11-23": "8e334357-c3cc-ef11-b8e9-000d3a674a78",
          SOL20: "85b61843-c1c8-ef11-b8e9-000d3ab86138",
          JV3: "92e191ec-cb66-ef11-bfe2-000d3ab1d1c2",
          ODV18: "c2233237-dc9f-ef11-8a6a-00224899e340",
          BS19: "7ccd91a6-ce66-ef11-bfe2-000d3ab1d1c2",
          FV50: "b8c950e3-ca66-ef11-bfe2-000d3ab1d1c2",
          BS17: "fc7d5d21-3506-f011-bae3-000d3ab487b3",
        };

        let abbreviation = params["abbreviation"];
        recordId = abbreviationToRecordId[abbreviation];
      }

      if (uniqueID) {
        localStorage.setItem("uniqueID", uniqueID);
        console.log("uniqueID stored in localStorage:", uniqueID);
      } else {
        console.log("uniqueID not found in URL");
      }

      if (property) {
        property = decodeURIComponent(property); // Decode the URL encoded property value
        console.log("Decoded Property:", property); // Logs the decoded property value
      }

      // Log the full URL to the console
      let fullURL = window.location.href;
      console.log("Full URL:", fullURL); // This will log the full URL, e.g., http://localhost:8080/index.html?etn=iotdatapoint&id=12345678-1234-1234-1234-123456789abc

      // Now you can use `entityType` and `recordId` in your web app logic
      console.log("Entity Type:", entityType);
      console.log("Record ID:", recordId);

      // Initialize the viewer and sidebar
      const viewer = await initViewer(document.getElementById("preview"));

      // initTree('#tree', (id) => loadModel(viewer, window.btoa(id).replace(/=/g, '')));


      // #region: LIST OF PROPERTIES
      // Mapping of recordId to geometry URN values
      const geometryMapById = {
        // DB8
        // ARCHI
        // dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLnhkWFJlcVYwVDFhem9XdWVFaVNuemc/dmVyc2lvbj0xNg
        // MEP
        // dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLmN1eTlfS1FpU3lhZHFVdTJhSV9Cc2c/dmVyc2lvbj0xMg

        "2e85182d-a8b7-ef11-b8e8-7c1e5275e0ca": [
          "urn:adsk.wipemea:dm.lineage:xdXReqV0T1azoWueEiSnzg", // archi
          "urn:adsk.wipemea:dm.lineage:cuy9_KQiSyadqUu2aI_Bsg", // mep
          "urn:adsk.wipemea:dm.lineage:sRfOlKPITMG3zSgBoeF3Ww", // site
        ],

        // DB8 for Production
        "06eddd02-c366-ef11-bfe2-000d3ab1d1c2": [
          "urn:adsk.wipemea:dm.lineage:xdXReqV0T1azoWueEiSnzg", // archi
          "urn:adsk.wipemea:dm.lineage:cuy9_KQiSyadqUu2aI_Bsg", // mep
          "urn:adsk.wipemea:dm.lineage:sRfOlKPITMG3zSgBoeF3Ww", // site
        ],

        // HG62
        "766fb31a-a8b7-ef11-b8e8-7c1e5275e0ca": [
          "urn:adsk.wipemea:dm.lineage:UwhmTaE5RQ21--nmCQd2pA", //archi
          "urn:adsk.wipemea:dm.lineage:vFgMX64TT0Cqe8LxYkdoUA", //mep
        ],

        // HG62 for Production
        "422be7c5-ef69-ef11-bfe2-000d3a6735d4": [
          "urn:adsk.wipemea:dm.lineage:UwhmTaE5RQ21--nmCQd2pA", //archi
          // 'urn:adsk.wipemea:dm.lineage:vFgMX64TT0Cqe8LxYkdoUA', //mep
          "urn:adsk.wipemea:dm.lineage:Oiuj-KZlQGWHcvIe4nDKKQ", //mep
        ],

        // SOL10
        "f8c64108-adb7-ef11-b8e8-7c1e5275e0ca": [
          "urn:adsk.wipemea:dm.lineage:gs0PRB3eRUS6ANLK09vDYA", //archi
          "urn:adsk.wipemea:dm.lineage:q8g1LE0vQ2WO5AHJ9Kd55A", //mep
        ],

        // SOL10 for Production
        "10ff2730-d365-ef11-bfe3-6045bddd062a": [
          "urn:adsk.wipemea:dm.lineage:gs0PRB3eRUS6ANLK09vDYA", //archi
          "urn:adsk.wipemea:dm.lineage:q8g1LE0vQ2WO5AHJ9Kd55A", //mep
          "urn:adsk.wipemea:dm.lineage:9RzMYc2xRfu3IQ8Kzf3Cpg" //site
          // "urn:adsk.wipemea:dm.lineage:ozAmC1K_QVep94ssFT5KXQ" //test
        ],

        // SOL 11-23 for Production
        "8e334357-c3cc-ef11-b8e9-000d3a674a78": [
          "urn:adsk.wipemea:dm.lineage:fdosriHoSSq4NPIIkiyvVw", //archi
          "urn:adsk.wipemea:dm.lineage:1a6uXwpuRXykLPeEX-YFpg", //mep
          "urn:adsk.wipemea:dm.lineage:D_5hWX3yQ2mpS2kI8C-axQ" //site
        ],

        // SOL20 for Production
        "85b61843-c1c8-ef11-b8e9-000d3ab86138": [
          "urn:adsk.wipemea:dm.lineage:k9jCDybIRKK0DqORUNDnrA", //archi
          "urn:adsk.wipemea:dm.lineage:F5rNrMwxSOaRGKtW8iwl1g", //mep
          "urn:adsk.wipemea:dm.lineage:-fTOj3LuQzCme6_NYIjoHA" //SITE
        ],

        // JV3 for Production
        "92e191ec-cb66-ef11-bfe2-000d3ab1d1c2": [
          "urn:adsk.wipemea:dm.lineage:VLzD-rrOS9SQvV6rnJT7LA", //ARCHI
          "urn:adsk.wipemea:dm.lineage:Ty5wLZ92TqCHkIn80Mmipg", //COMMON AREAS
          "urn:adsk.wipemea:dm.lineage:U9tz-MHvQfS2Hg9gRITkdA", //MEP
        ],

        // ODV18
        "c2233237-dc9f-ef11-8a6a-00224899e340": [
          "urn:adsk.wipemea:dm.lineage:Af_CxVQ8R9Gk7aIC2c69Rw", //ARCHI 
          "urn:adsk.wipemea:dm.lineage:QlwJKiUVTzORuyDvPuGl1Q", //MEP
          //urn:adsk.wipemea:dm.lineage:58bBVbtMRzG4z7e3fzLsGA //deleted file
        ],
        // BS19
        "7ccd91a6-ce66-ef11-bfe2-000d3ab1d1c2": [
          "urn:adsk.wipemea:dm.lineage:cH693J46Riyi-_ccyuHx4g", //ARCHI
          "urn:adsk.wipemea:dm.lineage:NsE81iHwS6inclXR2YMw_g", //MEP
        ],

        // FV50
        "b8c950e3-ca66-ef11-bfe2-000d3ab1d1c2": [
          "urn:adsk.wipemea:dm.lineage:HT_kw5D_SEyxCe84jqaASQ", //ARCHI
          "urn:adsk.wipemea:dm.lineage:ys5aGM_9S8S7mQQVGsSk1Q", //MEP
          //'urn:adsk.wipemea:dm.lineage:Qyq6oVLxVAiZVx6BYKbFcw' //before building
        ],

        // J2
        "31203385-0ce3-ef11-8eea-000d3a674a78": [
          "urn:adsk.wipemea:dm.lineage:7kP7byFxQhmsKJm7CrQUyw", //ARCHI
          // 'urn:adsk.wipemea:dm.lineage:5v1J3zv1Qg6qoJXm6Vw9Xg', //MEP
        ],
        // BS17
        "fc7d5d21-3506-f011-bae3-000d3ab487b3": [
          "urn:adsk.wipemea:dm.lineage:WNYKT1wuRgGtn_HVS_4HwQ", //IFC??? 240318 IFC
        ],

        //T135
        "cc023922-5405-f011-bae2-6045bde167c3": [
          // "urn:adsk.wipemea:dm.lineage:o9HaviQfQeimUj369y5d2Q", // old ARCHI
          'urn:adsk.wipemea:dm.lineage:M5roTczIQUOnle1X26vdUg', //ARCHI 
          'urn:adsk.wipemea:dm.lineage:RQ0A1TdvSf-KNJ-WZ2b3Tw' //MEP
        ],

        "test": [
          "urn:adsk.wipemea:dm.lineage:4IgkioXcR0iOVcS9QPdQUw" //rcp files
        ],
      };


      // HARD ASSET CONDITIONS
      // Mapping of property value to geometry URN values
      // #region: PROPERTIES NAME
      const geometryMapByProperty = {
        // DB8
        "Drengsrudbekken 8 AS": [
          "urn:adsk.wipemea:dm.lineage:cuy9_KQiSyadqUu2aI_Bsg", // mep
          "urn:adsk.wipemea:dm.lineage:xdXReqV0T1azoWueEiSnzg", // archi
          "urn:adsk.wipemea:dm.lineage:sRfOlKPITMG3zSgBoeF3Ww", // site
        ],

        // HG62
        "Helgesensgate 62": [
          //'urn:adsk.wipemea:dm.lineage:vFgMX64TT0Cqe8LxYkdoUA', //mep DELETED FILE
          "urn:adsk.wipemea:dm.lineage:Oiuj-KZlQGWHcvIe4nDKKQ", //mep
          "urn:adsk.wipemea:dm.lineage:UwhmTaE5RQ21--nmCQd2pA", //archi
        ],

        // SOL10
        "Solbråveien 10 AS": [
          "urn:adsk.wipemea:dm.lineage:q8g1LE0vQ2WO5AHJ9Kd55A", //mep
          "urn:adsk.wipemea:dm.lineage:gs0PRB3eRUS6ANLK09vDYA", //archi
          "urn:adsk.wipemea:dm.lineage:9RzMYc2xRfu3IQ8Kzf3Cpg" //site
        ],

        // SOL11
        "Solbråveien 11-23": [
          "urn:adsk.wipemea:dm.lineage:1a6uXwpuRXykLPeEX-YFpg", //mep
          "urn:adsk.wipemea:dm.lineage:fdosriHoSSq4NPIIkiyvVw", //archi
        ],

        // SOL20
        "Solbråveien 20 AS": [
          "urn:adsk.wipemea:dm.lineage:F5rNrMwxSOaRGKtW8iwl1g", //mep
          "urn:adsk.wipemea:dm.lineage:k9jCDybIRKK0DqORUNDnrA", //archi
          "urn:adsk.wipemea:dm.lineage:-fTOj3LuQzCme6_NYIjoHA" //SITE
        ],

        // JV3
        "Nanna AS": [
          "urn:adsk.wipemea:dm.lineage:U9tz-MHvQfS2Hg9gRITkdA", //MEP
          "urn:adsk.wipemea:dm.lineage:VLzD-rrOS9SQvV6rnJT7LA", //ARCHI
          "urn:adsk.wipemea:dm.lineage:Ty5wLZ92TqCHkIn80Mmipg", //COMMON AREAS
        ],

        // ODV18
        "Ole Deviks Vei 18 AS": [
          "urn:adsk.wipemea:dm.lineage:QlwJKiUVTzORuyDvPuGl1Q", //MEP
          "urn:adsk.wipemea:dm.lineage:Af_CxVQ8R9Gk7aIC2c69Rw", //ARCHI
        ],


        // BS19
        "Billingstadsletta 19 AS": [          
          "urn:adsk.wipemea:dm.lineage:NsE81iHwS6inclXR2YMw_g", //MEP
          "urn:adsk.wipemea:dm.lineage:cH693J46Riyi-_ccyuHx4g", //ARCHI
        ],

        // FV50
        // "Fornebuveien 50" <- removed/changed?
        // "Fornebuveien 50 (Joint Cost c/o Semy AS)" <- changed again
        "Fornebuveien 50 (under Semy Felleskost AS)": [
          "urn:adsk.wipemea:dm.lineage:ys5aGM_9S8S7mQQVGsSk1Q", //MEP
          "urn:adsk.wipemea:dm.lineage:HT_kw5D_SEyxCe84jqaASQ", //ARCHI
        ],

        // BS17
        "Billingstadsletta 17 AS": [
          "urn:adsk.wipemea:dm.lineage:WNYKT1wuRgGtn_HVS_4HwQ", //IFC??
        ],

        // T135
        "Trondheimsveien 135 AS": [
          //'urn:adsk.wipemea:dm.lineage:7kP7byFxQhmsKJm7CrQUyw', //MEP
          // "urn:adsk.wipemea:dm.lineage:o9HaviQfQeimUj369y5d2Q", //ARCHI
          'urn:adsk.wipemea:dm.lineage:RQ0A1TdvSf-KNJ-WZ2b3Tw', //MEP
          'urn:adsk.wipemea:dm.lineage:M5roTczIQUOnle1X26vdUg' //ARCHI 
          
          
        ],
      };
      
      // Default geometry if no match is found
      const defaultGeometry = [
        //  DB8
          "urn:adsk.wipemea:dm.lineage:xdXReqV0T1azoWueEiSnzg", // archi
          "urn:adsk.wipemea:dm.lineage:cuy9_KQiSyadqUu2aI_Bsg", // mep
          "urn:adsk.wipemea:dm.lineage:sRfOlKPITMG3zSgBoeF3Ww", // site
      ];

      // Attempt to find geometry based on recordId
      let geometry = geometryMapById[recordId];

      // #region: PROPERTIES IDS
      // Project and folder IDs based on recordId or property
      const projectMap = {
        // DB8
        "06eddd02-c366-ef11-bfe2-000d3ab1d1c2": {
          projectId: "b.bf8f603c-7e37-4367-9900-69e279377191",
          folderId: "urn:adsk.wipemea:fs.folder:co.fMNGzoIyQyiq5KhAEpvDHw",
          hardAsset: "No Hard Asset",
          liveData: "DB8",
          model: "DB8",
        },
        "2e85182d-a8b7-ef11-b8e8-7c1e5275e0ca": {
          projectId: "b.bf8f603c-7e37-4367-9900-69e279377191",
          folderId: "urn:adsk.wipemea:fs.folder:co.fMNGzoIyQyiq5KhAEpvDHw",
          hardAsset: "No Hard Asset",
          liveData: "DB8",
          model: "DB8",
        },
        // HG62
        "766fb31a-a8b7-ef11-b8e8-7c1e5275e0ca": {
          projectId: "b.552de2d1-bc00-41a4-8d90-ec063d64a4c6",
          hardAsset: "No Hard Asset",
          liveData: "HG62",
          model: "HG62",
        },
        "422be7c5-ef69-ef11-bfe2-000d3a6735d4": {
          projectId: "b.552de2d1-bc00-41a4-8d90-ec063d64a4c6",
          hardAsset: "No Hard Asset",
          liveData: "HG62",
          model: "HG62",
        },
        // SOL10
        "f8c64108-adb7-ef11-b8e8-7c1e5275e0ca": {
          projectId: "b.e4cde0c5-7fd9-4974-9832-616f058478f9",
          hardAsset: "No Hard Asset",
          model: "SOL10",
        },
        "10ff2730-d365-ef11-bfe3-6045bddd062a": {
          projectId: "b.e4cde0c5-7fd9-4974-9832-616f058478f9",
          hardAsset: "No Hard Asset",
          model: "SOL10",
        },
        // SOL 11-23
        "8e334357-c3cc-ef11-b8e9-000d3a674a78": {
          projectId: "b.e4cde0c5-7fd9-4974-9832-616f058478f9",
          hardAsset: "No Hard Asset",
          model: "SOL11",
        },
        // SOL20
        "85b61843-c1c8-ef11-b8e9-000d3ab86138": {
          projectId: "b.a08e2cf9-5b5c-4254-883e-15a9fcf3cb5c",
          hardAsset: "No Hard Asset",
          model: "SOL20",
        },
        // JV3
        "92e191ec-cb66-ef11-bfe2-000d3ab1d1c2": {
          projectId: "b.bca6a4c5-fbd8-4dcb-a637-b3713a06cc8d",
          hardAsset: "No Hard Asset",
          model: "JV3",
        },
        // ODV18
        "c2233237-dc9f-ef11-8a6a-00224899e340": {
          projectId: "b.6623a4ce-ac71-4678-af1c-55a4030ff9d9",
          hardAsset: "No Hard Asset",
          model: "ODV18",
        },
        // BS19
        "7ccd91a6-ce66-ef11-bfe2-000d3ab1d1c2": {
          projectId: "b.1c8224f1-b860-4a2b-821b-d393c94b190d",
          hardAsset: "No Hard Asset",
          model: "BS19",
        },
        // FV50
        "b8c950e3-ca66-ef11-bfe2-000d3ab1d1c2": {
          projectId: "b.ad45ddb0-25b9-451d-9c3a-61c7a6e0232f",
          hardAsset: "No Hard Asset",
          model: "FV50",
        },
        // J2
        "31203385-0ce3-ef11-8eea-000d3a674a78": {
          projectId: "b.f89b2440-302c-41fc-9f68-111bf391dc1e",
          hardAsset: "No Hard Asset",
          model: "J2",
        },
        // BS17
        "fc7d5d21-3506-f011-bae3-000d3ab487b3": {
          projectId: "b.09751ad8-ce14-4f21-99c2-440312cd216f",
          hardAsset: "No Hard Asset",
          model: "BS17",
        },
        // TI135
        "cc023922-5405-f011-bae2-6045bde167c3": {
          projectId: "b.39d3702e-4095-44d4-8c29-becf571a90aa",
          hardAsset: "No Hard Asset",
          model: "TI135",
        },
        "test": {
          projectId: "b.3bc132ce-feb3-463a-850e-397e66d38aea",
          hardAsset: "No Hard Asset",
          model: "test",
        }
      };

      const propertyMap = {
        "Drengsrudbekken 8 AS": "b.bf8f603c-7e37-4367-9900-69e279377191",
        "Helgesensgate 62": "b.552de2d1-bc00-41a4-8d90-ec063d64a4c6",
        "Solbråveien 10 AS": "b.e4cde0c5-7fd9-4974-9832-616f058478f9",
        "Solbråveien 11-23": "b.e4cde0c5-7fd9-4974-9832-616f058478f9",
        "Solbråveien 20 AS": "b.a08e2cf9-5b5c-4254-883e-15a9fcf3cb5c",
        "Nanna AS": "b.bca6a4c5-fbd8-4dcb-a637-b3713a06cc8d",
        "Ole Deviks Vei 18 AS": "b.6623a4ce-ac71-4678-af1c-55a4030ff9d9",
        "Billingstadsletta 19 AS": "b.1c8224f1-b860-4a2b-821b-d393c94b190d",
        // "Fornebuveien 50": "b.ad45ddb0-25b9-451d-9c3a-61c7a6e0232f", // removed/changed?
        // "Fornebuveien 50 (Joint Cost c/o Semy AS)": "b.ad45ddb0-25b9-451d-9c3a-61c7a6e0232f", // changed again
        "Fornebuveien 50 (under Semy Felleskost AS)": "b.ad45ddb0-25b9-451d-9c3a-61c7a6e0232f",
        "Billingstadsletta 17 AS": "b.09751ad8-ce14-4f21-99c2-440312cd216f",
        "Trondheimsveien 135 AS": "b.39d3702e-4095-44d4-8c29-becf571a90aa",
      };

      let projectId = "";
      let folderId = "";
      let hardAsset = "Hard Asset";
      let liveData = "";
      let model = "";

      if (projectMap[recordId]) {
        ({
          projectId,
          folderId = "",
          liveData = "",
          hardAsset,
          model,
        } = projectMap[recordId]);
        localStorage.setItem("LiveData", liveData);
      } else if (propertyMap[property]) {
        projectId = propertyMap[property];
        localStorage.setItem("LiveData", liveData);
      }

      if (!geometry && property) {
        geometry = geometryMapByProperty[property];
        localStorage.setItem("ASSET", uniqueID);
        localStorage.setItem("LiveData", liveData);
      }

      if (!geometry) {
        geometry = defaultGeometry;
        projectId = "b.bf8f603c-7e37-4367-9900-69e279377191";
        folderId = "urn:adsk.wipemea:fs.folder:co.fMNGzoIyQyiq5KhAEpvDHw";
        liveData = "DB8";
        model = "DB8";
        hardAsset = "No Hard Asset";
        localStorage.setItem("LiveData", liveData);
        localStorage.removeItem("ASSET");

        // const access_token = localStorage.getItem('authToken');
        // async function fetchSheets(projectId, access_token) {
        //                     const response = await fetch(`https://developer.api.autodesk.com/construction/sheets/v1/projects/${projectId}/sheets`, {
        //                         method: 'GET',
        //                         headers: {
        //                             'Authorization': `Bearer ${access_token}`
        //                         }
        //                     });

        //                     const data = await response.json();
        //                     console.log('Sheets:', data);
        //                 }

        // fetchSheets(projectId, access_token);
      }

      // if(ServiceZone){
      //     hardAsset = 'No Hard Asset';
      // }
      // Final localStorage updates
      localStorage.setItem("HardAssetChecker", hardAsset);

      // Initialize the tree and handle model loading
      let hubId = "b.7a656dca-000a-494b-9333-d9012c464554"; // Hub ID
      ServiceZone = ServiceZone || "No Service Zone";
      FunctionalLocation = FunctionalLocation || "No Functional Location";
      RepeatingTask = RepeatingTask || "No Repeating Task";
      initTree("#tree", (id) => {
        // If no ID is provided, use the sample URN
        console.log(id);
        const urn = id !== 0 ? window.btoa(id).replace(/=/g, "") : geometry;
        loadModel(
          viewer,
          urn,
          hubId,
          projectId,
          folderId,
          ServiceZone,
          FunctionalLocation,
          model,
          RepeatingTask
        );
      });
    } else {
      login.style.visibility = "hidden"; //test
      throw new Error("Failed to authenticate");
    }

    // console.log(resp);
    login.style.visibility = "hidden"; //test
    // login.style.visibility = 'visible';
  } catch (err) {
    alert(
      "Could not initialize the application. See console for more details."
    );
    console.error(err);
  }
}

// Initialize the app
initApp();
