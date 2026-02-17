export function RepeatingTasks(viewer, RepeatingTask) {
  if (RepeatingTask === "TRUE") {
    // First, get the models from the viewer
    const models = viewer.impl.modelQueue().getModels();

    const header = document.getElementById("preview");
    header.style.top = "0em";

    viewer.resize();
    // Call the function to get the array of tasks and log it
    let taskArray = getSubgridDataFromURL();
    console.log(taskArray);

    let alldbidFunctionalLocation = [];
    let alldbidAsset = [];
    let alldbid = [];

    // Prepare color array
    const staticColors = [
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

    // Use promises to wait for all search operations to complete
    let searchPromises = taskArray.map((task, index) => {
      let promises = [];

      // Get the color based on the index (using modulo to cycle through colors)
      let color = staticColors[index % staticColors.length].vectorColor;

      // Extract the Functional Location ID and Hard Asset ID from the task object
      let funcLocID = task["Functional Location ID"];
      console.log("Functional Location ID:", funcLocID);
      if (funcLocID != "N") {
        promises.push(
          new Promise((resolve) => {
            // Search for the Functional Location ID in the first model (models[0])
            models[0].search(funcLocID, function (dbIDs) {
              console.log("Found dbIDs for Functional Location:", dbIDs);

              // Apply the color to each Functional Location dbID
              dbIDs.forEach((dbID) => {
                viewer.setThemingColor(dbID, color, models[0]);
              });

              // Array of promises for fetching properties of the dbIDs
              let propertyPromises = dbIDs.map((dbID) => {
                return new Promise((propResolve) => {
                  // Fetch properties for each dbID
                  models[0].getProperties(dbID, function (props) {
                    let assetIDValue = null;
                    let assetLevel = null;
                    let FLname = props.name; // Get the name of the Functional Location
                    let FLCategory = props.Category; // Get the category of the Functional Location

                    console.log("Properties for dbID:", dbID, props);
                    console.log("Properties Name:", props.name);

                    // Check if "Asset ID" or "Asset ID (GUID)" matches the searched value
                    props.properties.forEach(function (prop) {
                      if (
                        prop.displayName === "Asset ID" ||
                        prop.displayName === "Asset ID (GUID)"
                      ) {
                        if (prop.displayValue) {
                          assetIDValue = prop.displayValue;
                          console.log("Asset ID:", assetIDValue);
                        }
                      }
                      if (
                        prop.displayName === "Level" ||
                        prop.displayName === "Schedule Level"
                      ) {
                        if (prop.displayCategory === "Constraints") {
                          assetLevel = prop.displayValue; // Save the level value
                          console.log("Level:", assetLevel);
                        }
                      }
                      if (prop.displayName === "Category") {
                        if (prop.displayValue != "Revit Rooms" || prop.displayValue != "Revit Room") {
                          FLCategory = prop.displayValue; // Save the Functional Location name
                          console.log("Functional Location Name:", FLCategory);
                        }
                      }
                    });

                    // If Asset ID and Level match, and name is not null, store the dbID
                    // this should add in the filters assetLevel != null
                    if (
                      assetIDValue === funcLocID &&
                      assetIDValue != null &&
                      FLname != null &&
                      FLCategory != "Revit Rooms" ||
                      FLCategory != "Revit Room"
                    ) {
                      alldbidFunctionalLocation =
                        alldbidFunctionalLocation.concat(dbID);
                      alldbid = alldbid.concat(dbID);
                      console.log(
                        `Matching dbId: ${dbID} with Asset ID: ${assetIDValue} and Level: ${assetLevel} in model ${models[0].id}`
                      );
                      viewer.setThemingColor(dbID, color, models[0]);
                    }

                    // Resolve the property promise
                    propResolve();
                  });
                });
              });

              // Wait for all property fetches to complete before resolving the main promise
              Promise.all(propertyPromises).then(() => {
                resolve();
              });
            });
          })
        );
      }

      let hardAssetID = task["Hard Asset ID"];
      console.log("Hard Asset ID:", hardAssetID);
      if (hardAssetID != "N") {
        const models = viewer.impl.modelQueue().getModels(); // Get all models in the viewer
        models.forEach((model) => {
          promises.push(
            new Promise((resolve) => {
              model.search(hardAssetID, function (dbIDs) {
                console.log(
                  `Found dbIDs for asset in model ${model.id}:`,
                  dbIDs
                );

                // Array of promises for fetching properties
                let propertyPromises = dbIDs.map((dbID) => {
                  return new Promise((propResolve) => {
                    // Fetch properties for the dbID
                    model.getProperties(dbID, function (props) {
                      let assetIDValue = null;
                      let assetLevel = null;

                      console.log("Properties for dbID:", dbID, props);
                      console.log("Properties Name:", props.name);

                      // Check if "Asset ID" or "Asset ID (GUID)" matches the searched value
                      props.properties.forEach(function (prop) {
                        if (
                          prop.displayName === "Asset ID" ||
                          prop.displayName === "Asset ID (GUID)"
                        ) {
                          if (prop.displayValue) {
                            assetIDValue = prop.displayValue;
                            console.log("Asset ID:", assetIDValue);
                          }
                        }
                        if (
                          prop.displayName === "Level" ||
                          prop.displayName === "Schedule Level"
                        ) {
                          if (prop.displayCategory === "Constraints") {
                            assetLevel = prop.displayValue; // Save the level value
                            console.log("Level:", assetLevel);
                          }
                        }
                      });

                      // If Asset ID matches, store the dbID
                      if (
                        assetIDValue === hardAssetID &&
                        assetLevel != null &&
                        assetIDValue != null &&
                        props.name != null
                      ) {
                        alldbidAsset = alldbidAsset.concat(dbID);
                        alldbid = alldbid.concat(dbID);
                        console.log(
                          `Matching dbId: ${dbID} with Asset ID: ${assetIDValue} and Level: ${assetLevel} and with model ${model.id}`
                        );
                        viewer.setThemingColor(dbID, color, model);
                      }

                      // Resolve the property promise
                      propResolve();
                    });
                  });
                });

                // Wait for all property fetches to complete before resolving the main promise
                Promise.all(propertyPromises).then(() => {
                  resolve();
                });
              });
            })
          );
        });
      }

      return Promise.all(promises);
    });

    // After all search promises are resolved, proceed with isolation and selection
    Promise.all(searchPromises).then(() => {
      console.log("This is your dbid ", alldbid);
      console.log("This is your dbid for Asset", alldbidAsset);
      console.log("This is your dbid for FL", alldbidFunctionalLocation);
      const models = viewer.impl.modelQueue().getModels();
      //viewer.hide(alldbid); // Hide all dbIDs in the first model
      models.forEach((model) => {
        alldbid.forEach((dbId) => {
          model.getProperties(dbId, function (props) {
            let assetIDValue = null;
            let assetLevel = null;

            // Check if "Asset ID" matches the searched value and get the Level
            props.properties.forEach(function (prop) {
              if (prop.displayName === "Asset ID") {
                assetIDValue = prop.displayValue;
              }
              if (prop.displayName === "Asset ID (GUID)") {
                assetIDValue = prop.displayValue;
              }
              if (prop.displayName === "Level") {
                assetLevel = prop.displayValue; // Save the level value
                console.log("LAST PROCESS Level:", assetLevel);
              }
              if (prop.displayName === "Schedule Level") {
                assetLevel = prop.displayValue; // Save the level value
                console.log("Level:", assetLevel);
              }
            });

            // Check the level in the Levels Extension
            viewer
              .loadExtension("Autodesk.AEC.LevelsExtension")
              .then(function (levelsExt) {
                if (levelsExt && levelsExt.floorSelector) {
                  const floorData = levelsExt.floorSelector;
                  // console.log("Initial Floor Data:", floorData);

                  setTimeout(() => {
                    const levels = floorData._floors;
                    console.log("Floor Array after delay:", levels);

                    if (levels && levels.length > 0) {
                      levels.forEach((floor, index) => {
                        // console.log(`Floor ${index}:`, floor);
                      });
                    } else {
                      console.error("Floors array is still empty.");
                    }

                    // Search for the level by name in the levels array
                    let matchingLevel = levels.find(
                      (level) => level.name === assetLevel
                    );

                    if (matchingLevel) {
                      const selectedLevelIndex = matchingLevel.index;

                      // Change the floor level based on the index
                      if (alldbidAsset.length > 0) {
                        levelsExt.floorSelector.selectFloor(
                          selectedLevelIndex,
                          true
                        );
                      }

                      viewer
                        .loadExtension("Autodesk.BimWalk")
                        .then(function (bimWalkExt) {
                          // Start BimWalk after loading the extension
                          if (bimWalkExt) {
                            // bimWalkExt.activate();
                            viewer.select(alldbid, model); // Select all dbIDs at once for the model
                            // console.log("BimWalk started.");
                          } else {
                            console.error(
                              "BimWalk extension could not be loaded."
                            );
                          }
                        });
                    } else {
                      console.error(
                        "No matching level found for the asset level."
                      );
                    }
                  }, 1000); // Wait for 1 second before checking
                } else {
                  console.error(
                    "Levels Extension or floorSelector is not available."
                  );
                }
              });
          });
        });
      });

      // Set the selection color to green (or any default color for selection)
      viewer.setSelectionColor(new THREE.Color(0x892be3));

      // Fit the view to the found objects (combined bounding box as done earlier)

      if (alldbidFunctionalLocation.length > 0) {
        viewer.fitToView(alldbidFunctionalLocation, models[0]);
        if (alldbidAsset.length == 0) {
          models.forEach((model) => {
            viewer.isolate(alldbidFunctionalLocation, model);
          });
        }
      }

      if (alldbidAsset.length > 0) {
        models.forEach((model) => {
          viewer.fitToView(alldbidAsset, model);
        });
      }

      models.forEach((model) => {
        viewer.select(alldbid, model); // Select all dbIDs at once for the model
      });
    });

    createToolbarRepeatingTaskButton(viewer);
    showRepeatingTaskPanel(viewer, taskArray, staticColors);
  }
}

// Function to get subgrid data and return an array of task objects
function getSubgridDataFromURL() {
  let params = {};
  let queryString = window.location.search.substring(1);
  let queryParts = queryString.split("&");

  for (let i = 0; i < queryParts.length; i++) {
    let param = queryParts[i].split("=");
    params[decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
  }

  let subgridData = params["subgridData"];
  if (!subgridData) {
    console.log("No subgrid data found in the URL.");
    return [];
  }

  let tasks = subgridData.split("\n");
  let taskArray = [];

  tasks.forEach((task) => {
    if (task.trim() === "") return;

    let taskData = {};

    // Use regex to find key-value pairs more accurately
    let regex = /([\w\s\(\)\/\?\-]+):\s(.*?)(?=,\s[\w\s\(\)\/\?\-]+:\s|$)/g;
    let match;

    while ((match = regex.exec(task)) !== null) {
      let key = match[1].trim();
      let value = match[2].trim();
      taskData[key] = value;
    }

    taskArray.push(taskData);
  });

  return taskArray;
}

// Declare the button globally so it can be accessed in other functions
let showRepeatingTaskButton;

function createToolbarRepeatingTaskButton(viewer) {
  const toolbar = viewer.getToolbar();
  if (!toolbar) {
    console.error("Toolbar not found");
    return;
  }

  // Create a new toolbar button
  showRepeatingTaskButton = new Autodesk.Viewing.UI.Button(
    "showRepeatingTaskButton"
  );

  // Apply icon styling directly to the button's container
  const buttonContainer = showRepeatingTaskButton.container;
  buttonContainer.style.backgroundImage = "url(./images/task.svg)"; // Set your icon image source here
  buttonContainer.style.backgroundColor = "transparent"; // Make background transparent
  buttonContainer.style.backgroundSize = "32px"; // Adjust size of the background image
  buttonContainer.style.backgroundRepeat = "no-repeat"; // Ensure no repeat of the image
  buttonContainer.style.backgroundPosition = "center"; // Center the image inside the button

  showRepeatingTaskButton.setToolTip("Repeating Task"); // Set the tooltip for the button

  // Define the action when the button is clicked
  showRepeatingTaskButton.onClick = function () {
    if (viewer.RepeatingTaskPanel) {
      viewer.RepeatingTaskPanel.setVisible(
        !viewer.RepeatingTaskPanel.isVisible()
      );
    } else {
      showRepeatingTaskPanel(viewer, []); // Show panel even if no service tasks exist yet
    }
  };

  // Add the button to a new toolbar group
  let subToolbar = viewer.toolbar.getControl("myAppToolbar");
  if (!subToolbar) {
    subToolbar = new Autodesk.Viewing.UI.ControlGroup("myAppToolbar");
    toolbar.addControl(subToolbar);
  }
  subToolbar.addControl(showRepeatingTaskButton);

  // Call this function once the viewer is fully initialized
  viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, function () {
    createToolbarRepeatingTaskButton(viewer);
  });
}

// Function to create and display a docking panel
export function showRepeatingTaskPanel(viewer, taskArray, colorMapping) {
  // Create a custom Docking Panel class
  class RepeatingTaskPanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor(viewer, title, options) {
      super(viewer.container, title, options);

      // Set the panel styles
      this.container.style.top = "10px";
      this.container.style.left = "10px";
      this.container.style.width = "300px";
      this.container.style.height = "325px";
      this.container.style.resize = "auto";
      this.container.style.backgroundColor = "#333";
      this.container.style.title = "Tasks";

      // Create and configure the scroll container
      this.createScrollContainer();
    }

    // Create the content of the panel
    createScrollContainer() {
      // Create the scroll container
      this.scrollContainer = document.createElement("div");
      this.scrollContainer.style.overflow = "auto";
      this.scrollContainer.style.padding = "1em"; // Add padding to the scroll container
      this.scrollContainer.style.height = "100%"; // Ensure it takes full panel height
      this.container.appendChild(this.scrollContainer); // Append the scroll container to the panel

      // Create and append elements to the scroll container
      this.createPanelContent();
    }

    // Create the content inside the scroll container
    createPanelContent() {
      // Loop through the taskArray and create elements for each task
      taskArray.forEach((task, index) => {
        const taskName = task["Name"]; // Assuming the task name is stored under "Service Task"
        const color = colorMapping[index].name; // Get the color name for this index

        const container = document.createElement("div");
        container.style.marginBottom = "10px"; // Add space between elements

        // Display the task name and its color
        container.innerHTML = `<strong style="color: ${color.toLowerCase()};">${taskName}</strong>: <span style="color: ${color.toLowerCase()};">${color}</span>`;

        this.scrollContainer.appendChild(container);
      });
    }
  }

  // Check if a panel already exists and remove it
  if (viewer.RepeatingTaskPanel) {
    viewer.RepeatingTaskPanel.setVisible(false);
    viewer.RepeatingTaskPanel.uninitialize();
  }

  // Create a new panel with the title 'Service Task'
  viewer.RepeatingTaskPanel = new RepeatingTaskPanel(
    viewer,
    "Repeating Task",
    "Repeating Task",
    {}
  );

  // // Show the panel by setting it to visible
  // viewer.RepeatingTaskPanel.setVisible(true);
}

// Received message: {"type":"showTask","Name":"Change - Dark Light Source - (max 3,5m high) if there is a starter, change it too",
// "HardAsset":"64761da9-83d5-ee11-904d-0022489fdfca",
// "FunctionalLocation":"21b06458-4161-ee11-8df0-0022489fdfca"}




















// ************************************************** HEMY TASK HIGHLIGHTING FUNCTION **************************************************


// export function showTasks(viewer, RepeatingTask) {
//   viewer.showAll(); // Show all objects first
//   const models = viewer.impl.modelQueue().getModels();
//   const header = document.getElementById("preview");
//   header.style.top = "0em";
//   viewer.resize();

//   let selectionColor;
//   // viewer.setSelectionColor(new THREE.Color(0, 1, 0)); // RGB green (selection highlight)

//   const hardAssetID = RepeatingTask.HardAsset;
//   const funcLocID = RepeatingTask.FunctionalLocation;
//   const STBase = RepeatingTask.STBase.toLowerCase().trim();
//   const taskName = RepeatingTask.Name.toLowerCase().trim();

//   const cleaningRegex = /(clean|cleaning|mop|wipe|cloth)/i;
//   const repairRegex = /(fix|assess|issue|troubleshoot|assessment|control)/i;
//   const winterRegex = /(snow|ice)/i;
//   const greenRegex = /(green|green areas|maintain green areas)/i;


//   // if (cleaningRegex.test(taskName)) {
//   //   selectionColor = new THREE.Vector4(0, 0, 1, 1); // blue
//   //   viewer.setSelectionColor(new THREE.Color(0, 0, 1));
//   // } else if (repairRegex.test(taskName)) {
//   //   selectionColor = new THREE.Vector4(1, 1, 0, 1); // yellow
//   //   viewer.setSelectionColor(new THREE.Color(1, 1, 0));
//   // } else if (winterRegex.test(taskName)) {
//   //   selectionColor = new THREE.Vector4(0.231, 0.976, 0.965, 1); // cyan
//   //   viewer.setSelectionColor(new THREE.Color(0.231, 0.976, 0.965));
//   // } else if (greenRegex.test(taskName)) {
//   //   selectionColor = new THREE.Vector4(0.784, 0.976, 0.231, 1); // greenish
//   //   viewer.setSelectionColor(new THREE.Color(0.784, 0.976, 0.231));
//   // } else {
//   //   selectionColor = new THREE.Vector4(0.54, 0.17, 0.89, 1); // default purple
//   //   viewer.setSelectionColor(new THREE.Color(0.54, 0.17, 0.89));
//   // }

//   // console.log("cleaning match:", cleaningRegex.test(taskName));
//   // console.log("repair match:", repairRegex.test(taskName));
//   // console.log("winter match:", winterRegex.test(taskName));
//   // console.log("green match:", greenRegex.test(taskName));


//   if (cleaningRegex.test(STBase)) {
//     selectionColor = new THREE.Vector4(0, 0, 1, 1); // blue
//     viewer.setSelectionColor(new THREE.Color(0, 0, 1));
//   } else if (repairRegex.test(STBase)) {
//     selectionColor = new THREE.Vector4(1, 1, 0, 1); // yellow
//     viewer.setSelectionColor(new THREE.Color(1, 1, 0));
//   } else if (winterRegex.test(STBase)) {
//     selectionColor = new THREE.Vector4(0.231, 0.976, 0.965, 1); // cyan
//     viewer.setSelectionColor(new THREE.Color(0.231, 0.976, 0.965));
//   } else if (greenRegex.test(STBase)) {
//     selectionColor = new THREE.Vector4(0, 1, 0, 1); // greenish
//     viewer.setSelectionColor(new THREE.Color(0, 1, 0)); 
//   } else {
//     selectionColor = new THREE.Vector4(1.0, 0.349, 0.804, 1); // default pink
//     viewer.setSelectionColor(new THREE.Color(1.0, 0.349, 0.804,));
//   }


//   console.log("showTasks called with task name:", taskName);
//   console.log("showTasks called with st base:", STBase);
//   console.log("showTasks called with HardAsset [Actually a FL]:", hardAssetID); //
//   console.log("showTasks called with FunctionalLocation [Actually a HA]:", funcLocID);

//   let alldbid = [];
//   let alldbidAsset = [];
//   let alldbidFunctionalLocation = [];

//   // ✅ Helper: Process properties and check match
//   function processProps(
//     props,
//     dbID,
//     model,
//     expectedID,
//     outputArray,
//     type,
//     selectionColor
//   ) {
//     let assetIDValue = null;
//     let assetLevel = null;
//     let name = props.name;
//     let category = props.Category;

//     // Find values inside properties array
//     props.properties.forEach((prop) => {
//       const { displayName, displayValue, displayCategory } = prop;

//       if (displayName === "Asset ID" || displayName === "Asset ID (GUID)") {
//         assetIDValue = displayValue;
//       }

//       if (
//         (displayName === "Level" || displayName === "Schedule Level") &&
//         displayCategory === "Constraints"
//       ) {
//         assetLevel = displayValue;
//       }

//       if (displayName === "Category") {
//         category = displayValue;
//       }
//     });

//     // If category is Revit Room(s), skip early
//     if (category === "Revit Room" || category === "Revit Rooms") return;

//     const match =
//       assetIDValue === expectedID &&
//       assetIDValue != null &&
//       name != null &&
//       (type === "asset" || true); // category check already handled

//     if (match) {
//       outputArray.push(dbID);
//       alldbid.push(dbID);
//       viewer.setThemingColor(dbID, null, model);
//       viewer.setThemingColor(dbID, selectionColor, model);
//     }
//   }

//   // ✅ Helper: Search and process
// function searchAndProcess(model, id, type, outputArray, selectionColor) {
//   return new Promise((resolve) => {
//     model.search(id, (dbIDs) => {
//       const propPromises = dbIDs.map((dbID) => {
//         return new Promise((propResolve) => {
//           model.getProperties(dbID, (props) => {
//             console.log('Searched item properties:', props);
//             processProps(props, dbID, model, id, outputArray, type, selectionColor);
//             propResolve();
//           });
//         });
//       });

//       Promise.all(propPromises).then(resolve);
//     });
//   });
// }


//   const assetSearch = searchAndProcess(models[0], hardAssetID, "asset", alldbidAsset, selectionColor);
//   const funcLocSearch = searchAndProcess(models[0], funcLocID, "floc", alldbidFunctionalLocation, selectionColor);

//   Promise.all([assetSearch, funcLocSearch]).then(() => {
//     console.log("All dbIDs:", alldbid);
//     console.log("Asset dbIDs:", alldbidAsset);
//     console.log("Functional Location dbIDs:", alldbidFunctionalLocation);

//     const fitAndSelect = () => {
//       if (alldbidFunctionalLocation.length > 0) {
//         viewer.fitToView(alldbidFunctionalLocation, models[0]);
//         if (alldbidAsset.length === 0) {
//           models.forEach((model) => viewer.isolate(alldbidFunctionalLocation, model));
//         }
//       }

//       if (alldbidAsset.length > 0) {
//         models.forEach((model) => viewer.fitToView(alldbidAsset, model));
//       }

//       models.forEach((model) => viewer.select(alldbid, model));
//     };

//     const setLevelAndStartWalk = () => {
//       models.forEach((model) => {
//         alldbid.forEach((dbId) => {
//           model.getProperties(dbId, (props) => {
//             let assetLevel = null;

//             props.properties.forEach((prop) => {
//               if (["Level", "Schedule Level"].includes(prop.displayName)) {
//                 assetLevel = prop.displayValue;
//               }
//             });

//             viewer
//               .loadExtension("Autodesk.AEC.LevelsExtension")
//               .then((levelsExt) => {
//                 const levels = levelsExt.floorSelector?._floors || [];
//                 const matched = levels.find((lvl) => lvl.name === assetLevel);
//                 // && alldbidAsset.length > 0
//                 if (matched) {
//                   levelsExt.floorSelector.selectFloor(matched.index, true);

//                   viewer.loadExtension("Autodesk.BimWalk").then((bimWalkExt) => {
//                     if (bimWalkExt) {
//                       viewer.select(alldbid, model);
//                     }
//                   });
//                 }
//               });
//           });
//         });
//       });
//     };

//     setLevelAndStartWalk();
//     fitAndSelect();
//   });
// }

// #region ONE TASK
export function showTasks(viewer, RepeatingTask) {
  viewer.showAll(); 
  const models = viewer.impl.modelQueue().getModels();
  const header = document.getElementById("preview");
  header.style.top = "0em";
  viewer.resize();

  let selectionColor;
  // ! HA and FL got mixed up in the data source
  // ! HA actually contains FL IDs and vice versa
  const hardAssetID = RepeatingTask.FunctionalLocation;
  const funcLocID = RepeatingTask.HardAsset;
  const STBase = RepeatingTask.STBase.toLowerCase().trim();
  const taskName = RepeatingTask.Name.toLowerCase().trim();

  const cleaningRegex = /(clean|cleaning|mop|wipe|cloth)/i;
  const repairRegex = /(fix|assess|issue|troubleshoot|assessment|control)/i;
  const winterRegex = /(snow|ice)/i;
  const greenRegex = /(green|green areas|maintain green areas)/i;

  if (cleaningRegex.test(STBase)) {
    selectionColor = new THREE.Vector4(0, 0, 1, 1);
    viewer.setSelectionColor(new THREE.Color(0, 0, 1));
  } else if (repairRegex.test(STBase)) {
    selectionColor = new THREE.Vector4(1, 1, 0, 1);
    viewer.setSelectionColor(new THREE.Color(1, 1, 0));
  } else if (winterRegex.test(STBase)) {
    selectionColor = new THREE.Vector4(0.231, 0.976, 0.965, 1);
    viewer.setSelectionColor(new THREE.Color(0.231, 0.976, 0.965));
  } else if (greenRegex.test(STBase)) {
    selectionColor = new THREE.Vector4(0, 1, 0, 1);
    viewer.setSelectionColor(new THREE.Color(0, 1, 0)); 
  } else {
    selectionColor = new THREE.Vector4(1.0, 0.349, 0.804, 1);
    viewer.setSelectionColor(new THREE.Color(1.0, 0.349, 0.804));
  }

  // console.log("showTasks called with task name:", taskName);
  // console.log("showTasks called with st base:", STBase);
  // console.log("showTasks called with HardAsset [Actually a FL]:", hardAssetID);
  // console.log("showTasks called with FunctionalLocation [Actually a HA]:", funcLocID);

  let alldbid = [];
  let alldbidAsset = [];
  let alldbidFunctionalLocation = [];

  function processProps(props, dbID, model, expectedID, outputArray, type, selectionColor) {
    let assetIDValue = null;
    let assetLevel = null;
    let name = props.name;
    let category = props.Category;
    // console.log('Processing properties for dbID:', dbID, props);

    props.properties.forEach((prop) => {
      const { displayName, displayValue, displayCategory } = prop;

      if (displayName === "Asset ID (GUID)") { //displayName === "Asset ID" || 
        assetIDValue = displayValue;
      }

      if (
        (displayName === "Level" || displayName === "Schedule Level") &&
        displayCategory === "Constraints"
      ) {
        assetLevel = displayValue;
      }

      if (displayName === "Category") {
        category = displayValue;
      }
    });

    if (category === "Revit Room" || category === "Revit Rooms") return;
    // console.log(`Checking dbID ${dbID} with Asset ID: ${assetIDValue}, Level: ${assetLevel}, Name: ${name}, Category: ${category} against expected ID: ${expectedID}`);
    const match =
      assetIDValue === expectedID &&
      assetIDValue != null &&
      name != null;

    if (match) {
      outputArray.push(dbID);
      alldbid.push(dbID);
      viewer.setThemingColor(dbID, null, model);
      viewer.setThemingColor(dbID, selectionColor, model);
    }
  }

  function searchAndProcess(model, id, type, outputArray, selectionColor) {
    return new Promise((resolve) => {
      model.search(id, (dbIDs) => {
        if (!dbIDs || dbIDs.length === 0) {
          // console.log(`No dbIDs found for ${type} ID: ${id} in model ${model.id}`);
          return resolve();
        }
        // console.log(`Found dbIDs for ${type} in model ${model.id}:`, dbIDs);
        const propPromises = dbIDs.map((dbID) => {
          return new Promise((propResolve) => {
            model.getProperties(dbID, (props) => {
              processProps(props, dbID, model, id, outputArray, type, selectionColor);
              propResolve();
            });
          });
        });

        Promise.all(propPromises).then(resolve);
      });
    });
  }

  // 🔄 Search in ALL models
  const assetSearches = models.map((m) =>
    searchAndProcess(m, hardAssetID, "asset", alldbidAsset, selectionColor)
  );
  const funcLocSearches = models.map((m) =>
    searchAndProcess(m, funcLocID, "floc", alldbidFunctionalLocation, selectionColor)
  );

  Promise.all([...assetSearches, ...funcLocSearches]).then(() => {
    // console.log("All dbIDs:", alldbid);
    // console.log("Asset dbIDs:", alldbidAsset);
    // console.log("Functional Location dbIDs:", alldbidFunctionalLocation);

    const fitAndSelect = () => {
      if (alldbidFunctionalLocation.length > 0) {
        models.forEach((model) => {
          // viewer.fitToView(alldbidFunctionalLocation, model);
          if (alldbidAsset.length === 0) {
            // viewer.isolate(alldbidFunctionalLocation, model);
          }
        });
      }

      if (alldbidAsset.length > 0) {
        console.log("Fitting to Asset IDs");
        
        // Load the extension once, wait for it to finish
        viewer.loadExtension('Autodesk.ViewCubeUi').then((viewCube) => {

          models.forEach((model, index) => {
            // *clear colors for functional location IDs
            alldbidFunctionalLocation.forEach(dbId => viewer.setThemingColor(dbId, null, model));
            if (index === 2) {
              console.log("Skipping site model...");
              return;
            }


            // Start fit animation
            // viewer.fitToView(alldbidAsset, model);
            viewCube.setViewCube('top');

            // Wait until the fitToView camera animation completes
            const onCameraTransitionComplete = () => {
              console.log("Fit to view completed. Setting view cube...");
              // viewCube.setViewCube('front top');
              viewCube.setViewCube('top');
              const nav = viewer.navigation;
              
              // Remove listener so it doesn't trigger again
              viewer.removeEventListener(
                Autodesk.Viewing.CAMERA_TRANSITION_COMPLETED,
                onCameraTransitionComplete
              );
            };

            viewer.addEventListener(
              Autodesk.Viewing.CAMERA_TRANSITION_COMPLETED,
              onCameraTransitionComplete
            );
          });
        });
      }


      models.forEach((model) => viewer.select(alldbid, model));
    };

    const setLevelAndStartWalk = () => {
      models.forEach((model) => {
        alldbid.forEach((dbId) => {
          model.getProperties(dbId, (props) => {
            let assetLevel = null;

            // Ignore Revit Rooms
            const isRevitRoom = props.properties.some(
              (prop) =>
                prop.displayName === "Category" &&
                (prop.displayValue === "Revit Room" ||
                prop.displayValue === "Revit Rooms")
            );

            if (isRevitRoom) return;

            props.properties.forEach((prop) => {
              if (["Level", "Schedule Level"].includes(prop.displayName)) {
                assetLevel = prop.displayValue;
              }
            });
            // console.log("Properties for dbID:", dbId, props);
            // console.log("Asset Level for dbID", dbId, "is", assetLevel);
            viewer.loadExtension("Autodesk.AEC.LevelsExtension").then((levelsExt) => {
              const levels = levelsExt.floorSelector?._floors || [];
              const matched = levels.find((lvl) => lvl.name === assetLevel);
              if (matched) {
                levelsExt.floorSelector.selectFloor(matched.index, true);

                viewer.loadExtension("Autodesk.BimWalk").then((bimWalkExt) => {
                  if (bimWalkExt) {
                    viewer.select(alldbid, model);
                  }
                });
              }
            });
          });
        });
      });
    };

    setLevelAndStartWalk();
    fitAndSelect();
  });
}
// #endregion














// #region ALL TASKS
// export function showAllTasks(viewer, RepeatingTask) {
//   viewer.showAll();
//   const models = viewer.impl.modelQueue().getModels();
//   const header = document.getElementById("preview");
//   header.style.top = "0em";
//   viewer.resize();
//   console.log("SHOWING ALL TASK");

//   const JSONPayload = JSON.parse(RepeatingTask.JSONPayload);

//   const cleaningRegex = /(clean|cleaning|mop|wipe|cloth)/i;
//   const repairRegex = /(fix|assess|issue|troubleshoot|assessment|control|report)/i;
//   const winterRegex = /(snow|ice)/i;
//   const greenRegex = /(green|green areas|maintain green areas)/i;

//   let alldbid = [];
  

//   function processProps(props, dbID, model, expectedID, outputArray, type, color) {
//     let assetIDValue = null;
//     let assetLevel = null;
//     let name = props.name;
//     let category = props.Category;

//     props.properties.forEach((prop) => {
//       const { displayName, displayValue, displayCategory } = prop;

//       if (displayName === "Asset ID" || displayName === "Asset ID (GUID)") {
//         assetIDValue = displayValue;
//       }

//       if (
//         (displayName === "Level" || displayName === "Schedule Level") &&
//         displayCategory === "Constraints"
//       ) {
//         assetLevel = displayValue;
//       }

//       if (displayName === "Category") {
//         category = displayValue;
//       }
//     });

//     if (category === "Revit Room" || category === "Revit Rooms") return;

//     const match = assetIDValue === expectedID && assetIDValue != null && name != null;

//     if (match) {
//       outputArray.push(dbID);
//       alldbid.push(dbID);
//       viewer.setThemingColor(dbID, color, model);
//     }
//   }

//   function searchAndProcess(model, id, type, outputArray, color) {
//     return new Promise((resolve) => {
//       model.search(id, (dbIDs) => {
//         if (!dbIDs || dbIDs.length === 0) {
//           return resolve();
//         }

//         const propPromises = dbIDs.map(
//           (dbID) =>
//             new Promise((propResolve) => {
//               model.getProperties(dbID, (props) => {
//                 processProps(props, dbID, model, id, outputArray, type, color);
//                 propResolve();
//               });
//             })
//         );

//         Promise.all(propPromises).then(resolve);
//       });
//     });
//   }

//   const promises = [];

//   JSONPayload.forEach((task) => {
//     const { TaskTypeName, TaskName, FunctionalLocation, HardAssetID } = task;

//     const STBase = TaskTypeName.toLowerCase().trim();
//     const taskName = TaskName.toLowerCase().trim();

//     let selectionColor;
//     if (cleaningRegex.test(STBase) || cleaningRegex.test(taskName)) {
//       selectionColor = new THREE.Vector4(0, 0, 1, 1); // blue
//     } else if (repairRegex.test(STBase) || repairRegex.test(taskName)) {
//       selectionColor = new THREE.Vector4(1, 1, 0, 1); // yellow
//     } else if (winterRegex.test(STBase) || winterRegex.test(taskName)) {
//       selectionColor = new THREE.Vector4(0.231, 0.976, 0.965, 1); // cyan
//     } else if (greenRegex.test(STBase) || greenRegex.test(taskName)) {
//       selectionColor = new THREE.Vector4(0.784, 0.976, 0.231, 1); // greenish
//     } else {
//       selectionColor = new THREE.Vector4(1.0, 0.349, 0.804, 1); // pink
//     }

//     viewer.setSelectionColor(
//       new THREE.Color(selectionColor.x, selectionColor.y, selectionColor.z)
//     );

//     // Search in ALL models
//     if (FunctionalLocation && FunctionalLocation !== "N") {
//       models.forEach((m) =>
//         promises.push(searchAndProcess(m, FunctionalLocation, "floc", [], selectionColor))
//       );
//     }
//     if (HardAssetID && HardAssetID !== "N") {
//       models.forEach((m) =>
//         promises.push(searchAndProcess(m, HardAssetID, "asset", [], selectionColor))
//       );
//     }
//   });

//   Promise.all(promises).then(() => {
//     models.forEach((model) => viewer.select(alldbid, model));
//     if (alldbid.length > 0) {
//       models.forEach((model) => viewer.fitToView(alldbid, model));
//     }
//   });
// }






// helper: wait for camera transition event (with fallback)
function waitForCameraTransition(viewer, timeoutMs = 1200) {
  return new Promise((resolve) => {
    let done = false;
    const onComplete = () => {
      if (done) return;
      done = true;
      viewer.removeEventListener(Autodesk.Viewing.CAMERA_TRANSITION_COMPLETED, onComplete);
      resolve(true);
    };
    viewer.addEventListener(Autodesk.Viewing.CAMERA_TRANSITION_COMPLETED, onComplete);
    setTimeout(() => {
      if (done) return;
      done = true;
      viewer.removeEventListener(Autodesk.Viewing.CAMERA_TRANSITION_COMPLETED, onComplete);
      resolve(false);
    }, timeoutMs);
  });
}

// helper: get a representative world position for a dbId (uses fragment matrix)
function getWorldPositionForDbId(model, dbId) {
  if (!model) return null;
  const it = model.getInstanceTree();
  const fragList = model.getFragmentList();
  if (!it || !fragList) return null;

  let pos = null;
  it.enumNodeFragments(dbId, (fragId) => {
    // take first fragment's world matrix -> position
    const mtx = new THREE.Matrix4();
    fragList.getWorldMatrix(fragId, mtx);
    pos = new THREE.Vector3().setFromMatrixPosition(mtx);
    // note: we don't break enumNodeFragments; but using first frag is fine
  });
  return pos; // THREE.Vector3 or null
}

export async function showAllTasks(viewer, RepeatingTask) {
  viewer.showAll();
  const models = viewer.impl.modelQueue().getModels();
  const preview = document.getElementById("preview");
  if (preview) preview.style.top = "0em";
  viewer.resize();
  console.log("SHOWING ALL TASK (grouped)");

  const JSONPayload = JSON.parse(RepeatingTask.JSONPayload || "[]");

  const cleaningRegex = /(clean|cleaning|mop|wipe|cloth)/i;
  const repairRegex = /(fix|assess|issue|troubleshoot|assessment|control|report)/i;
  const winterRegex = /(snow|ice)/i;
  const greenRegex = /(green|green areas|maintain green areas)/i;
  const firehoseRegex = /(Annual maintenance service control for Fire Hose Reel)/i;
  const fireExtinguisherRegex = /(Annual maintenance service control for Handheld Fire Extinguisher)/i;

  const alldbid = [];
  const alldbidAsset = []; // only HardAsset dbIds
  const uniqueIDs = new Map();
  const assetTaskMap = new Map();

  // Group tasks & assign colors
  for (const { FunctionalLocation, HardAssetID, TaskTypeName, TaskName } of JSONPayload) {
    const STBase = (TaskTypeName || "").toLowerCase().trim();
    const taskName = (TaskName || "").toLowerCase().trim();

    let color;
    if (cleaningRegex.test(STBase) || cleaningRegex.test(taskName)) color = new THREE.Vector4(0, 0, 1, 1);
    else if (repairRegex.test(STBase) || repairRegex.test(taskName)) color = new THREE.Vector4(1, 1, 0, 1);
    else if (winterRegex.test(STBase) || winterRegex.test(taskName)) color = new THREE.Vector4(0.231, 0.976, 0.965, 1);
    else if (greenRegex.test(STBase) || greenRegex.test(taskName)) color = new THREE.Vector4(0.784, 0.976, 0.231, 1);
    else color = new THREE.Vector4(1.0, 0.349, 0.804, 1);

    if (HardAssetID && HardAssetID !== "N") {
      uniqueIDs.set(HardAssetID, color);
      if (!assetTaskMap.has(HardAssetID))
        assetTaskMap.set(HardAssetID, { dbid: null, model: null, color, tasks: [], type: STBase });
        assetTaskMap.get(HardAssetID).tasks.push(TaskName);
    }
  }

  // Process properties only for HardAssetIDs
  function processProps(props, dbID, model, expectedID, color) {
    let assetIDValue = null;
    let category = props.Category;

    props.properties.forEach(({ displayName, displayValue }) => {
      if (displayName === "Asset ID" || displayName === "Asset ID (GUID)") assetIDValue = (displayValue || "").trim();
      if (displayName === "Category") category = displayValue;
    });

    if (props.name === undefined || props.name === null) return;
    if (category === "Revit Room" || category === "Revit Rooms") return;

    if (assetIDValue === expectedID && assetIDValue != null) {
      alldbid.push(dbID);
      alldbidAsset.push(dbID);
      viewer.setThemingColor(dbID, color, model);
      const asset = assetTaskMap.get(assetIDValue);
      if (asset) {
        asset.dbid = dbID;
        asset.model = model;
      }
    }
  }

  async function searchAndColor(model, id, color) {
    return new Promise((resolve) => {
      model.search(id, (dbIDs) => {
        if (!dbIDs || dbIDs.length === 0) return resolve();
        Promise.all(
          dbIDs.map(
            (dbID) =>
              new Promise((r) =>
                model.getProperties(dbID, (props) => {
                  processProps(props, dbID, model, id, color);
                  r();
                })
              )
          )
        ).then(resolve);
      });
    });
  }

  // Run searches (skip model index 2 if you still need to)
  const allPromises = [];
  for (const [id, color] of uniqueIDs.entries()) {
    models.forEach((model, index) => {
      // remove the next lines if you don't want to skip any model
      if (index === 2) {
        console.log(`Skipping model index ${index} for HardAssetID ${id}`);
        return;
      }
      allPromises.push(searchAndColor(model, id, color));
    });
  }
  await Promise.allSettled(allPromises);

  if (alldbidAsset.length > 0) {
    models.forEach((model) => viewer.select(alldbidAsset, model));
    models.forEach((model) => viewer.fitToView(alldbidAsset, model));
  }

  // Build array of assets that have dbid + model and compute position
  const assetTaskArray = [];
  for (const [id, info] of assetTaskMap.entries()) {
    if (!info.dbid || !info.model) continue;
    const pos = getWorldPositionForDbId(info.model, info.dbid);
    if (!pos) {
      console.warn("No world position for", id, info.dbid);
      continue;
    }
    // slight vertical offset so sprite floats above object
    pos.z += 0.25;
    assetTaskArray.push({
      id,
      dbid: info.dbid,
      color: info.color,
      tasks: info.tasks,
      model: info.model,
      position: pos,
      type: info.type
    });
  }

  console.log("✅ Unique Hard Asset dbIds:", alldbidAsset);
  console.log("Grouped asset-task list:", assetTaskArray);

  // -------------------------
  // Create DataViz sprites
  // -------------------------
  if (assetTaskArray.length === 0) return assetTaskArray;

  // load extension
  const extension0 = await viewer.loadExtension("Autodesk.DataVisualization");
  const DataVizCore = Autodesk.DataVisualization.Core;

  const viewableData = new DataVizCore.ViewableData();
  viewableData.spriteSize = 30;

  const viewableMap = new Map();

  // add each asset as a sprite
  for (const asset of assetTaskArray) {
    const pos = asset.position;

    // --- Determine icon PER asset ---
    let iconURL = "./images/pin.svg"; // default
    let spriteColor = new THREE.Color(asset.color.x, asset.color.y, asset.color.z);

    const joinedTasks = asset.type.toLowerCase();

    console.log("Determining icon for tasks:", joinedTasks);

    if (/annual maintenance service control for fire hose reel/i.test(joinedTasks)) {
      iconURL = "./images/fire hose reel.svg";
      spriteColor = new THREE.Color(1, 1, 1);
    } else if (/annual maintenance service control for handheld fire extinguisher/i.test(joinedTasks)) {
      iconURL = "./images/fire extinguisher.svg";
      spriteColor = new THREE.Color(1, 1, 1);
    }

    // style
    const style = new DataVizCore.ViewableStyle(
      DataVizCore.ViewableType.SPRITE,
      spriteColor,
      iconURL
    );


    // create sprite
    const viewable = new DataVizCore.SpriteViewable(
      { x: pos.x, y: pos.y, z: pos.z },
      style,
      asset.dbid,
      asset.id
    );

    viewable.customData = {
      assetId: asset.id,
      tasks: asset.tasks,
      dbid: asset.dbid,
      model: asset.model,
      color: asset.color,
    };

    viewableData.addViewable(viewable);
    viewableMap.set(asset.dbid, viewable);
  }

  await viewableData.finish();
  extension0.addViewables(viewableData);
  viewer.viewableMap = viewableMap;




  

  // Click handler for sprites
  // --- Sprite Click Handler (robust version with level + viewCube) ---
  const attachSpriteClickHandler = () => {
    viewer.removeEventListener(DataVizCore.MOUSE_CLICK, onSpriteClick);
    viewer.addEventListener(DataVizCore.MOUSE_CLICK, onSpriteClick);
    console.log("✅ Sprite click event attached.");

    // Delay markTaskDone call for testing
    // const timeoutMs = 3000; // 1 second
    // setTimeout(() => {
    //   markTaskDone(viewer, "ef9cc73b-1d1d-f011-998b-7c1e527684d6", "Conduct - Fire Fighting System - Maintenance Inspection. Use Inspection Template");
    // }, timeoutMs);
  };

  const onSpriteClick = async (event) => {
    try {
      if (!event || !event.dbId) return;

      const spriteId = event.dbId;
      const viewable = viewableMap.get(spriteId);
      if (!viewable || !viewable.customData) return;

      // normalize data fields
      const { dbid, model, assetId, tasks, pointId, objectDBID } = viewable.customData;
      const targetDbId = dbid || objectDBID || spriteId;
      const targetModel = model || dbIdModelMap?.get(targetDbId);

      console.log("🟣 Sprite clicked:", assetId ?? pointId ?? spriteId, targetDbId, tasks);

      if (!targetModel || !targetDbId) return;

      // --- 1️⃣ select and fit to the asset ---
      viewer.select([targetDbId], targetModel);
      try {
        viewer.fitToView([targetDbId], targetModel);
      } catch {
        viewer.fitToView([targetDbId]);
      }

      // --- 2️⃣ wait for camera transition (smooth) ---
      await waitForCameraTransition(viewer, 1000);

      // --- 3️⃣ switch to correct Level if found ---
      targetModel.getProperties(targetDbId, async (props) => {
        try {
          console.log("Asset properties for level switch:", props);
          const levelProp = props.properties.find((p) =>
            ["Level", "Schedule Level"].includes(p.displayName) && p.displayCategory === "Constraints"
          );
          console.log("Found level property:", levelProp);
          if (levelProp && levelProp.displayValue) {
            const assetLevel = levelProp.displayValue;
            const levelsExt = await viewer.loadExtension("Autodesk.AEC.LevelsExtension");
            const levels = levelsExt.floorSelector?._floors || [];
            console.log("Switching to asset level:", levels);
            console.log("Available levels:", levels.map(lv => lv.name));
            const matched = levels.find((lvl) => lvl.name === assetLevel);
            if (matched) {
              console.log("🔹 Switching to level:", matched.name);
              levelsExt.floorSelector.selectFloor(matched.index, true);
            }
          }
        } catch (err) {
          console.warn("Level switch failed", err);
        }
      });

      // --- 4️⃣ orient the view cube to top view ---
      try {
        const viewCube = await viewer.loadExtension("Autodesk.ViewCubeUi");
        viewCube?.setViewCube?.("top");
      } catch (err) {
        console.warn("ViewCube set failed", err);
      }

      // --- 5️⃣ show task panel ---
      showTaskPanel(viewer, viewable.customData.tasks)
    } catch (err) {
      console.error("❌ Sprite click handler error:", err);
    }
  };

  // Attach handler safely
  attachSpriteClickHandler();

  return assetTaskArray;
}


// Function to create and display a docking panel
export function showTaskPanel(viewer, taskArray = []) {
  class RepeatingTaskPanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor(viewer, title) {
      super(viewer.container, title);

      this.container.style.top = "10px";
      this.container.style.left = "10px";
      this.container.style.width = "300px";
      this.container.style.height = "325px";
      this.container.style.backgroundColor = "#333";
      this.container.style.color = "#fff";
      this.container.style.overflow = "hidden";
      this.container.style.resize = "auto";
      this.container.classList.add("task-panel");

      this.createScrollContainer();
    }

    createScrollContainer() {
      this.scrollContainer = document.createElement("div");
      this.scrollContainer.style.overflow = "auto";
      this.scrollContainer.style.padding = "1em";
      this.scrollContainer.style.height = "100%";
      this.container.appendChild(this.scrollContainer);

      this.createPanelContent();
    }

    createPanelContent() {
      if (!Array.isArray(taskArray) || taskArray.length === 0) {
        this.scrollContainer.innerHTML = `<p>No tasks available</p>`;
        return;
      }

      taskArray.forEach((task, index) => {
        const container = document.createElement("div");
        container.style.marginBottom = "10px";
        container.style.borderBottom = "1px solid #555";
        container.style.paddingBottom = "5px";
        container.innerHTML = `
          <strong style="color:#ffd700;">Task ${index + 1}</strong><br>
          <span>${task}</span>
        `;
        this.scrollContainer.appendChild(container);
      });
    }
  }

  // remove existing
  if (viewer.RepeatingTaskPanel) {
    viewer.RepeatingTaskPanel.setVisible(false);
    viewer.RepeatingTaskPanel.uninitialize();
  }

  // create & show new
  viewer.RepeatingTaskPanel = new RepeatingTaskPanel(viewer, "Repeating Tasks");
  viewer.RepeatingTaskPanel.setVisible(true);
}



// #region MARK TASK DONE
// Mark a Hard Asset as Done using its HardAssetID (not dbId)
export async function markTaskDone(viewer, hardAssetId, taskName) {
  const dataVizExtn = viewer.getExtension("Autodesk.DataVisualization");
  const viewableMap = viewer.viewableMap;
  if (!dataVizExtn || !viewableMap) return;

  // Find target sprite
  const targetSprite = [...viewableMap.values()].find(
    v => v?.customData?.assetId === hardAssetId
  );
  if (!targetSprite) {
    console.warn(`No sprite found for HardAssetID: ${hardAssetId}`);
    return;
  }

  console.log("Target sprite found:", targetSprite);

  // ✅ Update only the matching task name
  const data = targetSprite.customData;
  data.tasks = data.tasks.map(t =>
    t === taskName ? (t.includes("(Done)") ? t : `${t} (Done)`) : t
  );

  // ✅ Check if ALL tasks under this sprite are done
  const allDone = data.tasks.every(t => t.includes("(Done)"));

  if (!allDone) {
    console.log(`⚠️ Not all tasks done for ${hardAssetId}, skipping color update.`);
  } else {
    // ✅ Store color in both customData and DataViz internal dataset
    const newColor = { r: 0, g: 1, b: 0 };
    data.color = newColor;

    const spriteDbId = targetSprite.dbId;
    const sprites = dataVizExtn.viewableData.viewables;
    const spriteInData = sprites.find(v => v.dbId === spriteDbId);
    if (spriteInData) {
      spriteInData.style.color = new THREE.Color(newColor.r, newColor.g, newColor.b);
    }

    // ✅ Update the visible sprite
    dataVizExtn.invalidateViewables([spriteDbId], () => ({
      color: newColor
    }));

    console.log(`✅ All tasks done for ${hardAssetId} — sprite color updated to green.`);
  }

  const models = viewer.impl.modelQueue().getModels();
  viewer.fitToView(models[0]);
  // ✅ Force refresh (always run to ensure visual sync)
  setTimeout(() => viewer.impl.invalidate(true, true, true), 100);
}







// #endregion






// export async function showAllTasks(viewer, RepeatingTask) {
//   viewer.showAll();
//   const models = viewer.impl.modelQueue().getModels();
//   const preview = document.getElementById("preview");
//   if (preview) preview.style.top = "0em";
//   viewer.resize();
//   console.log("SHOWING ALL TASK (grouped)");

//   const JSONPayload = JSON.parse(RepeatingTask.JSONPayload);

//   const cleaningRegex = /(clean|cleaning|mop|wipe|cloth)/i;
//   const repairRegex = /(fix|assess|issue|troubleshoot|assessment|control|report)/i;
//   const winterRegex = /(snow|ice)/i;
//   const greenRegex = /(green|green areas|maintain green areas)/i;

//   const alldbid = [];
//   const alldbidAsset = []; // ✅ only HardAsset dbIds
//   const uniqueIDs = new Map();
//   const assetTaskMap = new Map();

//   // Group tasks & assign colors
//   for (const { FunctionalLocation, HardAssetID, TaskTypeName, TaskName } of JSONPayload) {
//     const STBase = (TaskTypeName || "").toLowerCase().trim();
//     const taskName = (TaskName || "").toLowerCase().trim();

//     let color;
//     if (cleaningRegex.test(STBase) || cleaningRegex.test(taskName)) color = new THREE.Vector4(0, 0, 1, 1);
//     else if (repairRegex.test(STBase) || repairRegex.test(taskName)) color = new THREE.Vector4(1, 1, 0, 1);
//     else if (winterRegex.test(STBase) || winterRegex.test(taskName)) color = new THREE.Vector4(0.231, 0.976, 0.965, 1);
//     else if (greenRegex.test(STBase) || greenRegex.test(taskName)) color = new THREE.Vector4(0.784, 0.976, 0.231, 1);
//     else color = new THREE.Vector4(1.0, 0.349, 0.804, 1);

//     if (HardAssetID && HardAssetID !== "N") {
//       uniqueIDs.set(HardAssetID, color);
//       if (!assetTaskMap.has(HardAssetID))
//         assetTaskMap.set(HardAssetID, { dbid: null, model: null, color, tasks: [] });
//       assetTaskMap.get(HardAssetID).tasks.push(TaskTypeName);
//     }
//   }

//   // ✅ Process properties only for HardAssetIDs
//   function processProps(props, dbID, model, expectedID, color) {
//     let assetIDValue = null;
//     let category = props.Category;

//     console.log('Processing properties for dbID:', dbID, props);

//     props.properties.forEach(({ displayName, displayValue }) => {
//       if (displayName === "Asset ID" || displayName === "Asset ID (GUID)") assetIDValue = displayValue;
//       if (displayName === "Category") category = displayValue;
//     });

//     if(props.name === undefined || props.name === null) return;

//     if (category === "Revit Room" || category === "Revit Rooms") return;

//     if (assetIDValue === expectedID && assetIDValue != null) {
//       alldbid.push(dbID);
//       alldbidAsset.push(dbID); // ✅ store in hard asset list
//       viewer.setThemingColor(dbID, color, model);

//       const asset = assetTaskMap.get(assetIDValue);
//       if (asset) {
//         asset.dbid = dbID;
//         asset.model = model;
//       }
//     }
//   }

//   async function searchAndColor(model, id, color) {
//     return new Promise((resolve) => {
//       model.search(id, (dbIDs) => {
//         if (!dbIDs || dbIDs.length === 0) return resolve();
//         Promise.all(
//           dbIDs.map(
//             (dbID) =>
//               new Promise((r) =>
//                 model.getProperties(dbID, (props) => {
//                   processProps(props, dbID, model, id, color);
//                   r();
//                 })
//               )
//           )
//         ).then(resolve);
//       });
//     });
//   }

//   // ✅ Run searches, skip 3rd model
//   const allPromises = [];
//   for (const [id, color] of uniqueIDs.entries()) {
//     models.forEach((model, index) => {
//       if (index === 2) {
//         console.log(`Skipping model index ${index} for HardAssetID ${id}`);
//         return;
//       }
//       allPromises.push(searchAndColor(model, id, color));
//     });
//   }

//   await Promise.allSettled(allPromises);

//   if (alldbidAsset.length > 0) {
//     models.forEach((model) => viewer.select(alldbidAsset, model));
//     models.forEach((model) => viewer.fitToView(alldbidAsset, model));
//   }

//   const assetTaskArray = Array.from(assetTaskMap.entries()).map(([id, info]) => ({
//     id,
//     dbid: info.dbid,
//     color: info.color,
//     tasks: info.tasks,
//     model: info.model,
//   }));

//   console.log("✅ Unique Hard Asset dbIds:", alldbidAsset);
//   console.log("Grouped asset-task list:", assetTaskArray);

//   // ===== Markups =====
//   const container = viewer.container;
//   if (window.getComputedStyle(container).position === "static")
//     container.style.position = "relative";

//   let wrapper = container.querySelector(".asset-markup-wrapper");
//   if (!wrapper) {
//     wrapper = document.createElement("div");
//     wrapper.className = "asset-markup-wrapper";
//     Object.assign(wrapper.style, {
//       position: "absolute",
//       left: "0",
//       top: "0",
//       width: "100%",
//       height: "100%",
//       pointerEvents: "none",
//       zIndex: 9999,
//     });
//     container.appendChild(wrapper);
//   }
//   wrapper.innerHTML = "";

//   for (const asset of assetTaskArray) {
//     if (!asset.dbid || !asset.model) continue;
//     addCircleMarkupForAsset(viewer, wrapper, asset);
//   }

//   return assetTaskArray;

//   function addCircleMarkupForAsset(viewer, wrapperEl, asset) {
//     const { dbid, model, color, id } = asset;
//     try {
//       const instanceTree = model.getInstanceTree();
//       const fragList = model.getFragmentList();
//       if (!instanceTree || !fragList) return;

//       let position = null;
//       instanceTree.enumNodeFragments(dbid, (fragId) => {
//         const matrix = new THREE.Matrix4();
//         fragList.getWorldMatrix(fragId, matrix);
//         const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
//         pos.z += 0.3;
//         position = pos;
//       });

//       if (!position) return;

//       const screenPoint = viewer.worldToClient(position);

//       const circle = document.createElement("div");
//       circle.className = "custom-circle-markup";
//       Object.assign(circle.style, {
//         position: "absolute",
//         width: "18px",
//         height: "18px",
//         border: `3px solid rgb(${Math.round(color.x * 255)}, ${Math.round(color.y * 255)}, ${Math.round(color.z * 255)})`,
//         borderRadius: "50%",
//         backgroundColor: `rgb(${Math.round(color.x * 255)}, ${Math.round(color.y * 255)}, ${Math.round(color.z * 255)})`,
//         left: `${Math.round(screenPoint.x - 9)}px`,
//         top: `${Math.round(screenPoint.y - 9)}px`,
//         cursor: "pointer",
//         pointerEvents: "auto",
//         zIndex: 10000,
//       });

//       circle._worldCenter = position.clone();
//       circle.dataset.dbid = dbid;
//       circle.title = `Asset: ${id}\nTasks: ${asset.tasks.length}`;

//       circle.addEventListener("click", async (ev) => {
//         ev.stopPropagation();
//         console.log("Clicked Hard Asset dbId:", dbid, "assetID:", id, "tasks:", asset.tasks);

//         try {
//           viewer.fitToView([dbid], asset.model);
//           viewer.select([dbid], asset.model);
//         } catch (e) {
//           try { viewer.fitToView(dbid, asset.model); } catch (e2) { console.warn("fitToView fallback failed", e2); }
//         }

//         await waitForCameraTransition(viewer, 1000);

//         try {
//           const viewCube = await viewer.loadExtension("Autodesk.ViewCubeUi");
//           if (viewCube && typeof viewCube.setViewCube === "function") {
//             viewCube.setViewCube("top");
//           }
//         } catch (err) {
//           console.warn("Could not load/set ViewCube:", err);
//         }
//       });

//       wrapperEl.appendChild(circle);

//       // Keep position synced on camera move
//       const onCam = () => {
//         const newScreen = viewer.worldToClient(circle._worldCenter);
//         circle.style.left = `${Math.round(newScreen.x - 9)}px`;
//         circle.style.top = `${Math.round(newScreen.y - 9)}px`;
//       };
//       viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, onCam);
//       circle._onCam = onCam;

//       // 👇 New: Hide markups outside cut planes
//       const onCut = () => {
//         const cutPlanes = viewer.getCutPlanes();
//         if (!cutPlanes || cutPlanes.length === 0) {
//           circle.style.display = "block";
//           return;
//         }
//         const visible = isPointInsideSectionBox(circle._worldCenter, cutPlanes);
//         circle.style.display = visible ? "block" : "none";
//       };
//       viewer.addEventListener(Autodesk.Viewing.CUTPLANES_CHANGED_EVENT, onCut);
//       circle._onCut = onCut;

//     } catch (err) {
//       console.error("addCircleMarkupForAsset error for", asset, err);
//     }
//   }
// }

// function waitForCameraTransition(viewer, timeoutMs = 1200) {
//   return new Promise((resolve) => {
//     let done = false;

//     const onComplete = () => {
//       if (done) return;
//       done = true;
//       viewer.removeEventListener(Autodesk.Viewing.CAMERA_TRANSITION_COMPLETED, onComplete);
//       resolve(true);
//     };

//     viewer.addEventListener(Autodesk.Viewing.CAMERA_TRANSITION_COMPLETED, onComplete);

//     // fallback: resolve after timeout so your UI won't hang if the event never fires
//     setTimeout(() => {
//       if (done) return;
//       done = true;
//       viewer.removeEventListener(Autodesk.Viewing.CAMERA_TRANSITION_COMPLETED, onComplete);
//       resolve(false);
//     }, timeoutMs);
//   });
// }







// #endregion ALL TASKS
