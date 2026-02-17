import {
  showServiceTasksDockingPanel,
  createToolbarButton,
} from "./ServiceTask.mjs";

export function ServiceZoneSearch(viewer, ServiceZone) {
  console.log(ServiceZone);

  if (ServiceZone !== "TRUE") return;

  const ServiceZoneID = localStorage.getItem("uniqueID");
  const models = viewer.impl.modelQueue().getModels();

  if (!models || models.length === 0) return;

  models[1].search(ServiceZoneID, (dbIDs) => {
    if (!dbIDs || dbIDs.length === 0) {
      console.log("No matching objects found for: " + ServiceZoneID);
      handleServiceTasks(viewer, models);
    }
  });
}

function handleServiceTasks(viewer, models) {
  const serviceTasks = parseServiceTasks();
  const serviceTaskList = assignColorsToServiceTasks(serviceTasks);

  console.log("Service Tasks Array with Assigned Colors:", serviceTaskList);

  // Determine if any tasks have "No tenant" or "No Tenant"
  const hasNoTenant = serviceTaskList.some((task) =>
    task.Tenant.toLowerCase().includes("no tenant")
  );

  // Pass true if any such task exists
  showServiceTasksDockingPanel(viewer, serviceTaskList, "FALSE");
  createToolbarButton(viewer);

  performSearchAndIsolate(viewer, models, serviceTaskList);
}

function parseServiceTasks() {
  const params = new URLSearchParams(window.location.search);
  return params.get("subgridData")?.split("\n").filter(Boolean) || [];
}

function assignColorsToServiceTasks(serviceTasks) {
  const staticColors = getStaticColors();
  let colorCounter = 0;
  const tenantColorMap = {};

  return serviceTasks.map((task) => {
    const [guid, tenant] = task.split(", ").map((part) => part.split(": ")[1]);

    let cssColor, vectorColor;

    // Check for "No tenant" or "No Tenant" and assign green color
    if (tenant.toLowerCase().includes("no tenant")) {
      cssColor = "Green";
      vectorColor = new THREE.Vector4(0, 1, 0, 1); // Green color
    } else {
      if (!tenantColorMap[tenant]) {
        tenantColorMap[tenant] =
          staticColors[colorCounter++ % staticColors.length];
      }
      const colorInfo = tenantColorMap[tenant];
      cssColor = colorInfo.name;
      vectorColor = colorInfo.vectorColor;
    }

    return {
      GUID: guid,
      Tenant: tenant,
      VectorColor: vectorColor,
      CssColor: cssColor,
    };
  });
}

function getStaticColors() {
  return [
    { name: "Violet", vectorColor: new THREE.Vector4(0.54, 0.17, 0.89, 1) },
    { name: "Orange", vectorColor: new THREE.Vector4(1, 0.5, 0, 1) },
    { name: "Red", vectorColor: new THREE.Vector4(1, 0, 0, 1) },
    { name: "Blue", vectorColor: new THREE.Vector4(0, 0, 1, 1) },
    { name: "Yellow", vectorColor: new THREE.Vector4(1, 1, 0, 1) },
    { name: "Cyan", vectorColor: new THREE.Vector4(0, 1, 1, 1) },
    { name: "Magenta", vectorColor: new THREE.Vector4(1, 0, 1, 1) },
    { name: "Purple", vectorColor: new THREE.Vector4(0.5, 0, 0.5, 1) },
    { name: "Pink", vectorColor: new THREE.Vector4(1, 0.75, 0.8, 1) },
    { name: "Brown", vectorColor: new THREE.Vector4(0.6, 0.3, 0, 1) },
  ];
}

function performSearchAndIsolate(viewer, models, serviceTaskList) {
  let alldbid = [];
  let promises = serviceTaskList.map(
    (task) =>
      new Promise((resolve, reject) => {
        models[1].search(
          task.GUID,
          (dbIDs) => {
            if (dbIDs && dbIDs.length > 0) {
              alldbid = alldbid.concat(dbIDs);
              dbIDs.forEach((dbid) =>
                models[1].setThemingColor(dbid, task.VectorColor)
              );
            }
            resolve();
          },
          reject
        );
      })
  );

  Promise.all(promises)
    .then(() => {
      // Loop through the models only once
      models.forEach((model) => {
        // Hide all objects first
        // viewer.isolate([], model);

        // // Isolate the found objects
        // viewer.isolate(alldbid, model);
      });
      viewer.fitToView(alldbid, models[1]);
    })
    .catch((error) => console.error("Error during promise chain:", error));
}




export async function spaceInventorySearch(viewer, zoneData) {
  viewer.clearSelection();

  console.log("Parsed zone data:", zoneData);

  if (!Array.isArray(zoneData) || zoneData.length === 0) return;

  const models = viewer.impl.modelQueue().getModels();

  models.forEach(model => viewer.clearThemingColors(model));
  if (!models?.length || !Array.isArray(zoneData) || zoneData.length === 0) return;

  // Colors
  const red = new THREE.Vector4(1, 0, 0, 1);
  const green = new THREE.Vector4(0, 1, 0, 1);
  const redSel = new THREE.Color(1, 0, 0);
  const greenSel = new THREE.Color(0, 1, 0);

  // ✅ Group by occupancy
  const occupancyGroups = [...new Set(zoneData.map(z => z.occupancy))].map(o => ({
    occupancy: o,
    locations: zoneData
      .filter(z => z.occupancy === o)
      .map(z => z.flId) // or z.FunctionalLocation if that’s the correct field
  }));

  const model2 = models[1];
  if (!model2) {
    console.warn("Second model not found!");
    return;
  }

  for (const { occupancy, locations } of occupancyGroups) {

    const isGreen = occupancy === 100000001;

    const themeColor = isGreen ? green : red;
    const selectionColor = isGreen ? greenSel : redSel;

    let allDbIds = [];

    const searches = locations.map(loc => {
      return new Promise(resolve => {
        // console.log("Searching for location:", loc);
        model2.search(
          loc,
          dbIDs => {
            if (dbIDs?.length) {
              allDbIds.push(...dbIDs);

              dbIDs.forEach(id =>
                viewer.setThemingColor(id, themeColor, model2)
              );

              viewer.select(dbIDs, model2);
              viewer.setSelectionColor(selectionColor);
            }
            resolve();
          },
          err => {
            console.warn("Search error:", err);
            resolve();
          }
        );
      });
    });

    await Promise.all(searches);

    viewer.select(allDbIds, model2);
  }
}

// import {
//   showServiceTasksDockingPanel,
//   createToolbarButton,
// } from "./ServiceTask.mjs";
// export function ServiceZoneSearch(viewer, ServiceZone) {
//   console.log(ServiceZone);

//   // Assuming this is part of your search function when Hard Asset is selected
//   if (ServiceZone === "TRUE") {
//     const ServiceZoneID = localStorage.getItem("uniqueID");

//     // First, get the models from the viewer
//     const models = viewer.impl.modelQueue().getModels();

//     // Ensure models are loaded before proceeding
//     if (models && models.length > 0) {
//       // Perform the search within the loaded models
//       models[1].search(
//         ServiceZoneID,
//         function (dbIDs) {
//           // If no objects are found, handle it gracefully
//           if (!dbIDs || dbIDs.length === 0) {
//             console.log("No matching objects found for: " + ServiceZoneID);
//             let color = "";

//             // Get the service tasks from the URL query string
//             let params = {};
//             let queryString = window.location.search.substring(1);
//             let queryParts = queryString.split("&");

//             for (let i = 0; i < queryParts.length; i++) {
//               let param = queryParts[i].split("=");
//               params[decodeURIComponent(param[0])] = decodeURIComponent(
//                 param[1]
//               );
//             }

//             // The service task data parsing and dynamic color assignment
//             let serviceTasks = params["subgridData"]; // The service task data, if it exists

//             // Object to keep track of randomly assigned colors for tenants
//             const tenantColorMap = {};

//             // Helper function to generate a random color and return it as both a CSS color and a Vector4
//             function generateRandomColor() {
//               const r = Math.random();
//               const g = Math.random();
//               const b = Math.random();
//               const alpha = 1; // Always set alpha to 1

//               // Create the color in vector form
//               const vectorColor = new THREE.Vector4(r, g, b, alpha);

//               // Convert to a CSS RGB string
//               const cssColor = `rgb(${Math.floor(r * 255)}, ${Math.floor(
//                 g * 255
//               )}, ${Math.floor(b * 255)})`;

//               return { vectorColor, cssColor };
//             }

//             // Check if there are service tasks and split them into an array
//             let serviceTaskList = [];
//             if (serviceTasks) {
//               // Define 10 static colors (excluding green) and their corresponding Vector4 values
//               const staticColors = [
//                 { name: "Violet", vectorColor: new THREE.Vector4(0.54, 0.17, 0.89, 1),},
//                 { name: "Orange",vectorColor: new THREE.Vector4(1, 0.5, 0, 1), },
//                 { name: "Red", vectorColor: new THREE.Vector4(1, 0, 0, 1) },
//                 { name: "Blue", vectorColor: new THREE.Vector4(0, 0, 1, 1) },
//                 { name: "Yellow", vectorColor: new THREE.Vector4(1, 1, 0, 1) },
//                 { name: "Cyan", vectorColor: new THREE.Vector4(0, 1, 1, 1) },
//                 { name: "Magenta", vectorColor: new THREE.Vector4(1, 0, 1, 1) },
//                 { name: "Purple", vectorColor: new THREE.Vector4(0.5, 0, 0.5, 1), },
//                 { name: "Pink", vectorColor: new THREE.Vector4(1, 0.75, 0.8, 1),},
//                 { name: "Brown", vectorColor: new THREE.Vector4(0.6, 0.3, 0, 1), },
//               ];

//               // Tenant color map to store tenant-to-color assignments
//               const tenantColorMap = {};

//               // Counter to assign colors in round-robin
//               let colorCounter = 0;

//               // Function to get the next color in round-robin
//               function getNextColor() {
//                 const color = staticColors[colorCounter % staticColors.length]; // Select color from static array
//                 colorCounter++; // Increment counter for the next tenant
//                 return color;
//               }

//               // Example: Parsing service tasks and assigning colors
//               serviceTaskList = serviceTasks.split("\n").filter(Boolean); // Filter to remove any empty lines

//               // Parse each service task into an object with GUID, Tenant, and color
//               serviceTaskList = serviceTaskList.map((task) => {
//                 // Split by comma to separate GUID and Tenant
//                 const [guidPart, tenantPart] = task.split(", ");
//                 const guid = guidPart.split(": ")[1]; // Get GUID value after "GUID: "
//                 const tenant = tenantPart.split(": ")[1]; // Get Tenant value after "Tenant: "

//                 console.log('tenant visible?' + tenant);
//                 // Assign a color if this tenant doesn't have one yet
//                 if (!tenantColorMap[tenant]) {
//                   tenantColorMap[tenant] = getNextColor(); // Assign a color from the static list
//                 }

//                 const { name: cssColor, vectorColor } = tenantColorMap[tenant]; // Get the color name and vector

//                 // Return the parsed data as an object, including GUID, Tenant, VectorColor, and CssColor
//                 return {
//                   GUID: guid,
//                   Tenant: tenant,
//                   VectorColor: vectorColor,
//                   CssColor: cssColor,
//                 };
//               });

//               // Output the result for testing
//               console.log(
//                 "Service Tasks Array with Assigned Colors:",
//                 serviceTaskList
//               );
//             }

//             // Example usage to display in a docking panel
//             let NoGreen = "FALSE";
//             showServiceTasksDockingPanel(viewer, serviceTaskList, NoGreen);
//             createToolbarButton(viewer);

//             let alldbid = [];  // Initialize the alldbid array outside the loop
//             let guiddbid = [];  // Initialize the guiddbid array outside the loop
//             let promises = [];  // Create an array to store promises

//             // Iterate through each service task
//             serviceTaskList.forEach(task => {
//             promises.push(
//                 new Promise((resolve, reject) => {
//                 models[1].search(task.GUID, function(dbIDs) {
//                     if (!dbIDs || dbIDs.length === 0) {
//                     // console.log('No matching objects found for: ' + task.GUID);
//                     resolve();  // Resolve even if no dbIDs are found to continue the Promise chain
//                     return;
//                     }

//                     // Log dbIDs to the console first
//                     // console.log('Found dbIDs for GUID:', task.GUID, dbIDs);

//                     // Push the dbIDs into the guiddbid array
//                     guiddbid = guiddbid.concat(dbIDs);  // Concatenate the dbIDs into the guiddbid array

//                     // Set the theming color for each dbID
//                     const color = task.VectorColor;  // Assuming you have a color (VectorColor) for each task
//                     dbIDs.forEach(dbid => {
//                     models[1].setThemingColor(dbid, color); // Set theming color for each dbID
//                     });

//                     // Push the dbIDs into the alldbid array (for tracking all dbIDs)
//                     alldbid = alldbid.concat(dbIDs);

//                     resolve();  // Resolve the promise once the search is done
//                 }, function(error) {
//                     console.error('Search error:', error);  // Handle any potential search errors
//                     reject(error);  // Reject the promise if an error occurs
//                 });
//                 })
//             );
//             });

//             // After all promises are resolved, proceed with isolation and selection
//             Promise.all(promises).then(() => {
//             console.log('All dbIDs:', alldbid);  // Log the final alldbid after searches are done
//             console.log('All guiddbid:', guiddbid);  // Log the final guiddbid

//             // Loop through the models only once
//             models.forEach(model => {
//                 // Hide all objects first
//                 viewer.isolate([], model);

//                 // Isolate the found objects
//                 viewer.isolate(alldbid, model);
//             });

//             // Fit to view and highlight the found objects
//             viewer.fitToView(alldbid, models[1]);
//             }).catch(error => {
//             console.error('Error during promise chain:', error);
//             });

//           }

//           let color = "";

//           // Get the service tasks from the URL query string
//           let params = {};
//           let queryString = window.location.search.substring(1);
//           let queryParts = queryString.split("&");

//           for (let i = 0; i < queryParts.length; i++) {
//             let param = queryParts[i].split("=");
//             params[decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
//           }

//           // The service task data parsing and dynamic color assignment
//           let serviceTasks = params["subgridData"]; // The service task data, if it exists

//           // Object to keep track of randomly assigned colors for tenants
//           const tenantColorMap = {};

//           // Helper function to generate a random color and return it as both a CSS color and a Vector4
//           function generateRandomColor() {
//             const r = Math.random();
//             const g = Math.random();
//             const b = Math.random();
//             const alpha = 1; // Always set alpha to 1

//             // Create the color in vector form
//             const vectorColor = new THREE.Vector4(r, g, b, alpha);

//             // Convert to a CSS RGB string
//             const cssColor = `rgb(${Math.floor(r * 255)}, ${Math.floor(
//               g * 255
//             )}, ${Math.floor(b * 255)})`;

//             return { vectorColor, cssColor };
//           }

//           // Check if there are service tasks and split them into an array
//           let serviceTaskList = [];
//           if (serviceTasks) {
//             // Define 10 static colors (excluding green) and their corresponding Vector4 values
//             const staticColors = [
//               {
//                 name: "Violet",
//                 vectorColor: new THREE.Vector4(0.54, 0.17, 0.89, 1),
//               },
//               { name: "Orange", vectorColor: new THREE.Vector4(1, 0.5, 0, 1) },
//               { name: "Red", vectorColor: new THREE.Vector4(1, 0, 0, 1) },
//               { name: "Blue", vectorColor: new THREE.Vector4(0, 0, 1, 1) },
//               { name: "Yellow", vectorColor: new THREE.Vector4(1, 1, 0, 1) },
//               { name: "Cyan", vectorColor: new THREE.Vector4(0, 1, 1, 1) },
//               { name: "Magenta", vectorColor: new THREE.Vector4(1, 0, 1, 1) },
//               {
//                 name: "Purple",
//                 vectorColor: new THREE.Vector4(0.5, 0, 0.5, 1),
//               },
//               { name: "Pink", vectorColor: new THREE.Vector4(1, 0.75, 0.8, 1) },
//               { name: "Brown", vectorColor: new THREE.Vector4(0.6, 0.3, 0, 1) },
//             ];

//             // Tenant color map to store tenant-to-color assignments
//             const tenantColorMap = {};

//             // Counter to assign colors in round-robin
//             let colorCounter = 0;

//             // Function to get the next color in round-robin
//             function getNextColor() {
//               const color = staticColors[colorCounter % staticColors.length]; // Select color from static array
//               colorCounter++; // Increment counter for the next tenant
//               return color;
//             }

//             // Example: Parsing service tasks and assigning colors
//             serviceTaskList = serviceTasks.split("\n").filter(Boolean); // Filter to remove any empty lines

//             // Parse each service task into an object with GUID, Tenant, and color
//             serviceTaskList = serviceTaskList.map((task) => {
//               // Split by comma to separate GUID and Tenant
//               const [guidPart, tenantPart] = task.split(", ");
//               const guid = guidPart.split(": ")[1]; // Get GUID value after "GUID: "
//               const tenant = tenantPart.split(": ")[1]; // Get Tenant value after "Tenant: "

//               // Assign a color if this tenant doesn't have one yet
//               if (!tenantColorMap[tenant]) {
//                 tenantColorMap[tenant] = getNextColor(); // Assign a color from the static list
//               }

//               const { name: cssColor, vectorColor } = tenantColorMap[tenant]; // Get the color name and vector

//               // Return the parsed data as an object, including GUID, Tenant, VectorColor, and CssColor
//               return {
//                 GUID: guid,
//                 Tenant: tenant,
//                 VectorColor: vectorColor,
//                 CssColor: cssColor,
//               };
//             });

//             // Output the result for testing
//             console.log(
//               "Service Tasks Array with Assigned Colors:",
//               serviceTaskList
//             );
//           }

//           // Example usage to display in a docking panel
//           let NoGreen = "TRUE";
//           showServiceTasksDockingPanel(viewer, serviceTaskList, NoGreen);
//           createToolbarButton(viewer);

//           let alldbid = []; // Initialize the alldbid array outside the loop
//           let guiddbid = []; // Initialize the guiddbid array outside the loop

//           // Iterate through each service task
//           serviceTaskList.forEach((task) => {
//             models[1].search(
//               task.GUID,
//               function (dbIDs) {
//                 if (!dbIDs || dbIDs.length === 0) {
//                   console.log("No matching objects found for: " + task.GUID);
//                   return;
//                 }

//                 // Log dbIDs to the console first
//                 // console.log("Found dbIDs for GUID:", task.GUID, dbIDs);

//                 // Push the dbIDs into the guiddbid array
//                 guiddbid = guiddbid.concat(dbIDs); // Concatenate the dbIDs into the guiddbid array

//                 // Set the theming color for each dbID
//                 const color = task.VectorColor; // Assuming you have a color (VectorColor) for each task
//                 dbIDs.forEach((dbid) => {
//                   models[1].setThemingColor(dbid, color); // Set theming color for each dbID
//                 });

//                 // Push the dbIDs into the alldbid array (for tracking all dbIDs)
//                 alldbid = alldbid.concat(dbIDs);
//               },
//               function (error) {
//                 console.error("Search error:", error); // Handle any potential search errors
//               }
//             );
//           });

//           // Delay logging the results to ensure the search operation finishes
//           setTimeout(() => {
//             console.log("All dbIDs:", alldbid); // Log the final alldbid after searches are done
//             console.log("All guiddbid:", guiddbid); // Log the final guiddbid

//             // Loop through the models only once
//             models.forEach((model) => {
//               // Hide all objects first
//               viewer.isolate([], model);

//               // Isolate the found objects
//               viewer.isolate(alldbid, model);
//             });

//             // Fit to view and highlight the found objects
//             viewer.fitToView(alldbid, models[1]);
//           }, 1000); // 1 second delay (adjust if needed)

//           alldbid = alldbid.concat(dbIDs);

//           color = new THREE.Vector4(0, 1, 0, 1); // Green color with full intensity (RGBA)
//           viewer.setSelectionColor(new THREE.Color(0, 1, 0)); // RGB: red, green, blue

//           // Optionally highlight the objects
//           models[1].setThemingColor(dbIDs, color);
//           dbIDs.forEach((dbid) => {
//             models[1].setThemingColor(dbid, color);
//           });
//           console.log(dbIDs);
//         },
//         function (error) {
//           console.error("Search error:", error); // Handle any potential search errors
//         }
//       );
//     } else {
//       // NO OUTPUT FROM SEARCHED FOR SERVICE ZONE
//       console.warn("No models loaded or invalid asset value.");
//     }
//   }
// }
