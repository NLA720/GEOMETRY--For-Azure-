export function FunctionalLocationSearch(viewer, FunctionalLocation){
    // Assuming this is part of your search function when Hard Asset is selected
    if (FunctionalLocation === 'TRUE') {

        const FunctionalLocationID = localStorage.getItem('uniqueID');

        // First, get the models from the viewer
        const models = viewer.impl.modelQueue().getModels();

        // Ensure models are loaded before proceeding
        if (models && models.length > 0) {

            // Perform the search within the loaded models
            models[1].search(FunctionalLocationID, function(dbIDs) {

                // If no objects are found, handle it gracefully
                if (!dbIDs || dbIDs.length === 0) {
                    console.log('No matching objects found for: ' + FunctionalLocationID);
                    return;
                }

                // Loop through the models only once
                models.forEach(model => {
                    // Hide all objects first
                    viewer.isolate([], model);

                    // Isolate the found objects
                    viewer.isolate(dbIDs, model);
                });

                // Fit to view and highlight the found objects
                viewer.fitToView(dbIDs, models[1]);
                let color = '';

                color = new THREE.Vector4(0, 1, 0, 1);  // Green color with full intensity (RGBA)
                viewer.setSelectionColor(new THREE.Color(0, 1, 0));  // RGB: red, green, blue

                // Optionally highlight the objects
                models[1].setThemingColor(dbIDs, color);  
                viewer.select(dbIDs, models[1]);  // Optionally highlight the objects
                console.log(dbIDs);

            }, function(error) {
                console.error('Search error:', error);  // Handle any potential search errors
            });
        } else {
            console.warn('No models loaded or invalid asset value.');
        }

    }
}



// #region Service Zone Hemy X
// export async function highlightFLByTask(viewer, message) {
//   // Expecting message.payload = [ { flId, flName, taskNames: [...] }, ... ]
//   console.log("Highlight FL by Task message received.");
//   console.log("Message payload:", message);
  
//   await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

//   // Detect the actual data shape (message is already an array)
//   let flData;

//   if (Array.isArray(message)) {
//     flData = message;
//   } else if (Array.isArray(message.payload)) {
//     flData = message.payload;
//   } else if (message.JSONPayload) {
//     try {
//       flData = JSON.parse(message.JSONPayload);
//     } catch {
//       flData = [];
//     }
//   } else {
//     flData = [];
//   }

//   console.log("Message data:", flData);

//   if (!Array.isArray(flData) || flData.length === 0) {
//     console.warn("No FL data found in message.");
//     return;
//   }
  
//   console.log("Parsed FL + Tasks Data:", flData);

//   const models = viewer.impl.modelQueue().getModels();
//   if (!models?.length || flData.length === 0) return;

//   // Clear any existing theming
//   models.forEach(model => viewer.clearThemingColors(model));

//   // Build a map for debugging / fallback: flId -> flName
//   const idToName = {};
//   flData.forEach(fl => {
//     idToName[fl.flId] = fl.flName || "(no name)";
//     // set group = first task or "No Task"
//     fl.group = (!fl.taskNames || fl.taskNames.length === 0) ? "No Task" : fl.taskNames[0];
//   });

//   // Unique groups
//   const groups = [...new Set(flData.map(z => z.group))];
//   console.log("Task Groups:", groups);

//   // Assign colors per group
//   const groupColors = {};
//   groups.forEach((g, i) => {
//     const hue = (i * 360 / groups.length) / 360;
//     const c = new THREE.Color().setHSL(hue, 0.8, 0.5);
//     groupColors[g] = new THREE.Vector4(c.r, c.g, c.b, 1);
//   });

//   // Build grouped FLs using FL IDs (not names)
//   const grouped = groups.map(g => ({
//     group: g,
//     // locations is an array of flId strings
//     locations: flData.filter(z => z.group === g).map(z => z.flId)
//   }));

//   console.log("Grouped FL by Task (IDs):", grouped);
//   console.log("FL id->name map:", idToName);

//   // Helper to run searches for one group and return aggregated matched dbIds per model
//   async function searchGroupModels(groupLocations) {
//     const searchPromises = models.map(model =>
//       new Promise(resolve => {
//         let matchedIds = [];
//         let pending = groupLocations.length;

//         // If no locations in this group, resolve with empty
//         if (pending === 0) return resolve({ model, matchedIds });

//         groupLocations.forEach(flId => {
//           model.search(
//             flId, // SEARCH USING THE FL ID (GUID)
//             dbIDs => {
//               console.log(`Search for FLId "${flId}" returned IDs (model ${model.id}):`, dbIDs);
//               if (dbIDs?.length) matchedIds.push(...dbIDs);
//               if (--pending === 0) resolve({ model, matchedIds });
//             },
//             err => {
//               console.warn(`Search error for FLId "${flId}" on model ${model.id}:`, err);
//               if (--pending === 0) resolve({ model, matchedIds });
//             }
//           );
//         });
//       })
//     );

//     return Promise.all(searchPromises);
//   }

//   // Process each group
//   for (const { group, locations } of grouped) {
//     const color = groupColors[group];

//     // 1) Try searching by FL ID
//     const resultsById = await searchGroupModels(locations);

//     // 2) Check if ANY model found matches; if none found across all models,
//     //    fallback to searching by FL NAME (useful if GUIDs aren't present in the model)
//     const totalMatchesById = resultsById.reduce((sum, r) => sum + (r.matchedIds?.length || 0), 0);

//     let finalResults = resultsById;

//     if (totalMatchesById === 0) {
//       console.warn(`No matches found by FLId for group "${group}". Falling back to search by FL name.`);

//       // Build parallel locations-by-name array ordered the same as 'locations' (flId -> flName)
//       const names = locations.map(id => idToName[id] || id);

//       // Run searches using names instead
//       const searchByNamePromises = models.map(model =>
//         new Promise(resolve => {
//           let matchedIds = [];
//           let pending = names.length;
//           if (pending === 0) return resolve({ model, matchedIds });

//           names.forEach(name => {
//             model.search(
//               name,
//               dbIDs => {
//                 console.log(`Fallback search for name "${name}" returned (model ${model.id}):`, dbIDs);
//                 if (dbIDs?.length) matchedIds.push(...dbIDs);
//                 if (--pending === 0) resolve({ model, matchedIds });
//               },
//               err => {
//                 console.warn(`Fallback search error for name "${name}" on model ${model.id}:`, err);
//                 if (--pending === 0) resolve({ model, matchedIds });
//               }
//             );
//           });
//         })
//       );

//       finalResults = await Promise.all(searchByNamePromises);
//     }

//     // Apply theming color to all matched dbIds for each model
//     for (const { model, matchedIds } of finalResults) {
//       if (!matchedIds || matchedIds.length === 0) continue;

//       // Deduplicate matchedIds before applying (just in case)
//       const uniqueIds = Array.from(new Set(matchedIds));
//       uniqueIds.forEach(id => viewer.setThemingColor(id, color, model));
//       console.log(`Group "${group}" → ${uniqueIds.length} matches in model ${model.id}. Example FL names:`,
//         uniqueIds.slice(0,5).map(_ => idToName[locations[0]])); // small helpful log
//     }
//   }

//   console.log("Highlighting complete.");
// }

export async function highlightFLByTask(viewer, message) {
  console.log("Highlight FL by Task message received.");
  console.log("Message payload:", message);
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  let flData;

  if (Array.isArray(message)) {
    flData = message;
  } else if (Array.isArray(message.payload)) {
    flData = message.payload;
  } else if (message.JSONPayload) {
    try {
      flData = JSON.parse(message.JSONPayload);
    } catch {
      flData = [];
    }
  } else {
    flData = [];
  }

  console.log("Message data:", flData);

  if (!Array.isArray(flData) || flData.length === 0) {
    console.warn("No FL data found in message.");
    return;
  }
  
  console.log("Parsed FL + Tasks Data:", flData);

  // 🔥 Get ONLY Model 2
  const models = viewer.impl.modelQueue().getModels();
  const model2 = models[1];

  if (!model2) {
    console.warn("Model 2 not found.");
    return;
  }

  // 🔥 Clear only Model 2 theming
  viewer.clearThemingColors(model2);

  const idToName = {};
  flData.forEach(fl => {
    idToName[fl.flId] = fl.flName || "(no name)";
    fl.group = (!fl.taskNames || fl.taskNames.length === 0)
      ? "No Task"
      : fl.taskNames[0];
  });

  const groups = [...new Set(flData.map(z => z.group))];
  console.log("Task Groups:", groups);

  const groupColors = {};
  groups.forEach((g, i) => {
    const hue = (i * 360 / groups.length) / 360;
    const c = new THREE.Color().setHSL(hue, 0.8, 0.5);
    groupColors[g] = new THREE.Vector4(c.r, c.g, c.b, 1);
  });

  const grouped = groups.map(g => ({
    group: g,
    locations: flData.filter(z => z.group === g).map(z => z.flId)
  }));

  console.log("Grouped FL by Task (IDs):", grouped);

  // 🔥 OPTIONAL — single helper for searching Model 2 w/ FL IDs
  async function searchGroupInModel2(groupLocations) {
    return new Promise(resolve => {
      let matchedIds = [];
      let pending = groupLocations.length;

      if (pending === 0) return resolve(matchedIds);

      groupLocations.forEach(flId => {
        model2.search(
          flId,
          dbIDs => {
            if (dbIDs?.length) matchedIds.push(...dbIDs);
            if (--pending === 0) resolve(matchedIds);
          },
          () => {
            if (--pending === 0) resolve(matchedIds);
          }
        );
      });
    });
  }

  // Process each group
  for (const { group, locations } of grouped) {
    const color = groupColors[group];

    // 🔥 Only search-by-ID in Model 2
    const matchedIds = await searchGroupInModel2(locations);

    if (!matchedIds || matchedIds.length === 0) {
      console.warn(`No matches in Model 2 for group "${group}".`);
      continue;
    }

    const uniqueIds = Array.from(new Set(matchedIds));

    // 🔥 Apply theming ONLY to Model 2
    uniqueIds.forEach(id => viewer.setThemingColor(id, color, model2));

    console.log(`Group "${group}" → ${uniqueIds.length} matches in Model 2`);
  }

  console.log("Highlighting complete.");
}


// #endregion






// #region Zone FL
// export async function zoneFunctionalLocation(viewer, message) {
//   viewer.clearSelection();
//   const zoneData = JSON.parse(message.JSONPayload || "[]");
//   console.log("Parsed zone data:", zoneData);

//   const models = viewer.impl.modelQueue().getModels();

//   // Clear all theming at start
//   models.forEach(model => viewer.clearThemingColors(model));

//   if (!models?.length || !Array.isArray(zoneData) || zoneData.length === 0) return;

//   // Colors
//   const red = new THREE.Vector4(1, 0, 0, 1);
//   const green = new THREE.Vector4(0, 1, 0, 1);
//   const redSel = new THREE.Color(1, 0, 0);
//   const greenSel = new THREE.Color(0, 1, 0);

//   // Group FunctionalLocations by Tenant
//   const tenantGroups = [...new Set(zoneData.map(z => z.Tenant))].map(t => ({
//     tenant: t,
//     locations: zoneData.filter(z => z.Tenant === t).map(z => z.FunctionalLocation),
//   }));

//   const model2 = models[1];
//   if (!model2) {
//     console.warn("Second model not found!");
//     return;
//   }

//   // 🔥 Loop stays EXACTLY the same — only small async fix inside
//   for (const { tenant, locations } of tenantGroups) {

//     const tenantColor = tenant === "Unoccupied" ? red : green;
//     const selectionColor = tenant === "Unoccupied" ? redSel : greenSel;

//     let allDbIds = [];

//     // 🔥 ONLY change: wrap each search in a Promise
//     const searches = locations.map(loc => {
//       return new Promise(resolve => {
//         model2.search(
//           loc,
//           dbIDs => {
//             if (dbIDs?.length) {

//               allDbIds.push(...dbIDs);

//               dbIDs.forEach(id => viewer.setThemingColor(id, tenantColor, model2));

//               // Progressive selection (you keep this)
//               viewer.select(dbIDs, model2);
//               viewer.setSelectionColor(selectionColor);

//               console.log(`Tenant "${tenant}" → ${dbIDs.length} matches in model ${model2.id}`);
//             }
//             resolve();
//           },
//           err => {
//             console.warn("Search error:", err);
//             resolve();
//           }
//         );
//       });
//     });

//     // 🔥 Only new line: wait for all search callbacks
//     await Promise.all(searches);

//     // NOW allDbIds is filled → this finally works
//     console.log("Selecting all matched dbIds:", allDbIds);
//     viewer.select(allDbIds, model2);
//   }
// }



// CACHE TEST
const functionalLocationCache = new Map();
// key: modelId
// value: Map<FunctionalLocationName, dbId[]>

export async function zoneFunctionalLocation(viewer, message) {
  viewer.clearSelection();

    const models = viewer.impl.modelQueue().getModels();
  // models.forEach(m => viewer.clearThemingColors(m));
  models.forEach(model => viewer.clearThemingColors(model));

  const zoneData = JSON.parse(message.JSONPayload);
  if (!Array.isArray(zoneData) || zoneData.length === 0) return;

  const model2 = models[1];
  if (!model2) {
    console.warn("Second model not found");
    return;
  }

  // Colors
  const red = new THREE.Vector4(1, 0, 0, 1);
  // const green = new THREE.Vector4(0, 1, 0, 1);
  const pink = new THREE.Vector4(0.902, 0.451, 0.890, 1);

  const redSel = new THREE.Color(1, 0, 0);
  // const greenSel = new THREE.Color(0, 1, 0);
  const pinkSel = new THREE.Color(0.902, 0.451, 0.890);
  /* -----------------------------
     1. Build cache (SEARCH BY ID)
  ------------------------------*/
  console.log("Building / using FL cache for model:", functionalLocationCache);
  if (!functionalLocationCache.has(model2.id)) {
    functionalLocationCache.set(model2.id, new Map());
  }

  const locationMap = functionalLocationCache.get(model2.id);

  // Unique FunctionalLocation IDs
  // const uniqueLocations = [...new Set(zoneData.map(z => z.FunctionalLocation))];

  const uniqueLocations = [
    ...new Set(
      zoneData
        .map(z => z.FunctionalLocation)
        .filter(loc => typeof loc === "string" && loc.trim() !== "")
    )
  ];


  // Run searches ONLY for uncached IDs
  const searches = uniqueLocations
    .filter(loc => !locationMap.has(loc))
    .map(loc => {
      return new Promise(resolve => {
        model2.search(
          loc,
          dbIds => {
            locationMap.set(loc, dbIds || []);
            resolve();
          },
          err => {
            console.warn("Search error for", loc, err);
            locationMap.set(loc, []);
            resolve();
          }
        );
      });
    });

  // Wait for missing searches only
  await Promise.all(searches);

  /* -----------------------------
     2. Group by tenant
  ------------------------------*/
  const tenantGroups = [...new Set(zoneData.map(z => z.Tenant))].map(t => ({
    tenant: t,
    locations: zoneData
      .filter(z => z.Tenant === t)
      .map(z => z.FunctionalLocation)
  }));

  /* -----------------------------
     3. Apply theming & selection
  ------------------------------*/
  let finalSelection = [];

  // for (const { tenant, locations } of tenantGroups) {
  //   const themeColor = tenant === "Unoccupied" ? red : pink;
  //   const selectColor = tenant === "Unoccupied" ? redSel : pinkSel;

  //   let tenantDbIds = [];

  //   for (const loc of locations) {
  //     const ids = locationMap.get(loc);
  //     if (ids?.length) tenantDbIds.push(...ids);
  //   }

  //   tenantDbIds.forEach(id =>
  //     viewer.setThemingColor(id, themeColor, model2)
  //   );

  //   if (tenantDbIds.length) {
  //     viewer.setSelectionColor(selectColor);
  //     finalSelection.push(...tenantDbIds);
  //   }
  // }


  tenantGroups.forEach(({ tenant, locations }, index) => {
    const isLast = index === tenantGroups.length - 1;

    const themeColor = tenant === "Unoccupied" ? red : pink;
    const selectColor = tenant === "Unoccupied" ? redSel : pinkSel;

    let tenantDbIds = [];

    for (const loc of locations) {
      const ids = locationMap.get(loc);
      if (ids?.length) tenantDbIds.push(...ids);
    }

    tenantDbIds.forEach(id =>
      viewer.setThemingColor(id, themeColor, model2)
    );

    // ONLY push selection if this is the last tenantGroup
    if (isLast && tenantDbIds.length) {
      viewer.setSelectionColor(selectColor);
      finalSelection.push(...tenantDbIds);
    }
  });


  // Force repaint (important)
  viewer.impl.invalidate(true);
  viewer.setGhosting(true);
  viewer.select(finalSelection, model2);

  

  // /* -----------------------------
  //   3. Apply theming & selection
  // ------------------------------*/

  // let selectionDbIds = [];
  // const activeTenant = "Unoccupied";

  // for (const { tenant, locations } of tenantGroups) {
  //   const isActive = tenant === activeTenant;
  //   const themeColor = tenant === "Unoccupied" ? red : green;

  //   let tenantDbIds = [];

  //   for (const loc of locations) {
  //     const ids = locationMap.get(loc);
  //     if (ids?.length) tenantDbIds.push(...ids);
  //   }

  //   // Apply theming to ALL
  //   tenantDbIds.forEach(id =>
  //     viewer.setThemingColor(id, themeColor, model2)
  //   );

  //   // ✅ ONLY push dbIds for the active group
  //   if (isActive) {
  //     selectionDbIds.push(...tenantDbIds);
  //     viewer.setSelectionColor(
  //       tenant === "Unoccupied" ? redSel : greenSel
  //     );
  //   }
  // }

  // // Force repaint
  // viewer.impl.invalidate(true);

  // // Select ONLY the active tenant group
  // viewer.select(selectionDbIds, model2);

  
}
// #endregion










// #region Prewarm FL Cache
export async function prewarmFunctionalLocationCacheFromModel(model) {
  console.log("Building / using FL cache for model:", functionalLocationCache);
  if (!functionalLocationCache.has(model.id)) {
    functionalLocationCache.set(model.id, new Map());
  }

  const locationMap = functionalLocationCache.get(model.id);

  const instanceTree = await new Promise((resolve, reject) => {
    model.getObjectTree(resolve, reject);
  });

  const rootId = instanceTree.getRootId();
  const allDbIds = [];

  instanceTree.enumNodeChildren(rootId, dbId => {
    allDbIds.push(dbId);
  }, true);

  const propPromises = allDbIds.map(dbId => {
    return new Promise(resolve => {
      model.getProperties(dbId, props => {
        if (!props?.properties) return resolve();

        const categoryProp = props.properties.find(
          p => p.displayName === 'Category'
        );

        const zoneProp = props.properties.find(
          p => p.displayName === 'NV3DZoneName'
        );

        if (
          categoryProp?.displayValue === 'Revit Generic Models' ||
          categoryProp?.displayValue === 'Generic Models' ||
          categoryProp?.displayValue === 'Revit Mass' ||
          categoryProp?.displayValue === 'Mass' &&
          zoneProp?.displayValue
        ) {
          const zoneId = props.properties.find(
            p => p.displayName === 'Asset ID (GUID)'
          )?.displayValue;

          // if (!locationMap.has(zoneId)) {
          //   locationMap.set(zoneId, []);
          // }

          // 🚫 HARD STOP: no empty / invalid zone IDs
          if (typeof zoneId !== "string" || zoneId.trim() === "") {
            resolve();
            return;
          }

          if (!locationMap.has(zoneId)) {
            locationMap.set(zoneId, []);
          }

          locationMap.get(zoneId).push(dbId);
        }

        resolve();
      });
    });
  });

  await Promise.all(propPromises);

  console.log(
    `Prewarm complete: ${locationMap.size} functional locations cached`
  );
}
// #endregion