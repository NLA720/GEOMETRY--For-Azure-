import * as functions from './viewerSidebar.mjs';
import { showLiveDataPanel, createToolbarLiveDataButton, createToolbarLiveDataListButton, showLiveDataListPanel } from './Live_Data/LiveData.mjs';
import { HardAssetSearch } from './Hemy_Functions/HardAssets.mjs';
import { ServiceZoneSearch, spaceInventorySearch } from './Hemy_Functions/ServiceZone.mjs';
import { FunctionalLocationSearch, zoneFunctionalLocation, highlightFLByTask, prewarmFunctionalLocationCacheFromModel } from './Hemy_Functions/FunctionalLocation.mjs';
import { RepeatingTasks, showTasks, showAllTasks } from './Hemy_Functions/RepeatingTasks.mjs';
import { WOServiceTask } from './Hemy_Functions/WOServiceTask.mjs';
import { Sol11PicsSPRITES } from './SOL11_23/sol11360pics.mjs';
import { AgreementFunctionalLocationSearch } from './Hemy_Functions/Agreement.mjs';
import { markTaskDone } from './Hemy_Functions/RepeatingTasks.mjs';


async function getAccessToken(callback) {
    try {
        // const resp = await fetch('/api/auth/token');

        const access_token = localStorage.getItem('authToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const expires_in = localStorage.getItem('expires_at');
        const internal_token = localStorage.getItem('internal_token');


        // if (!resp.ok)
        //     throw new Error(await resp.text());
        // const { access_token, expires_in } = await resp.json();
        // console.log('Access Token Retrieved:', access_token);
        // console.log('Token Expires In:', expires_in);
        callback(access_token, expires_in);
    } catch (err) {
        alert('Could not obtain access token. See the console for more details.');
        console.error(err);        
    }
}

export function initViewer(container) {
    return new Promise(function (resolve, reject) {
        Autodesk.Viewing.Initializer({ env: 'AutodeskProduction', getAccessToken }, async function () {
            const config = {
                extensions: [
                    // 'Autodesk.DocumentBrowser',
                    // 'Autodesk.AEC.LevelsExtension',
                    // 'Autodesk.DataVisualization',
                    // 'HistogramExtension',
                    // 'IconMarkupExtension',
                ]
            };
            const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);

            viewer.start();
            viewer.setTheme('dark-theme');
            viewer.setOptimizeNavigation(true)
            viewer.setQualityLevel(false, false);
            viewer.setGroundShadow(false);
            viewer.setGroundReflection(false);
            viewer.setProgressiveRendering(true);



            const canvas = viewer.impl.canvas;

            window.viewerInstance = viewer; // Store the viewer instance globally for access in other modules

            resolve(viewer);
        });
    });
}
// ******************************* WORKING ************************


export function loadModel(viewer, urns, hubId, projectId, folderId, ServiceZone, FunctionalLocation, model, RepeatingTask) {
    window.LiveData = model; // Store LiveData globally for access in other modules
    let modelsToLoad = urns;
    let modelAbbreviation = model;

    let modelsLoaded = 0; // Keep track of how many models have loaded

    // console.log(modelsToLoad);

    async function checkAllModelsLoaded() {

        // console.log("CHECK: " + modelsLoaded);

        if (modelsLoaded === modelsToLoad.length) {
            // window.parent.postMessage({ type: "ready-for-data" }, "*");
            // console.log(viewer.getAllModels(), "All models have been loaded.");
            const accessToken = localStorage.getItem('authToken'); // Retrieve the access token
            const models = viewer.impl.modelQueue().getModels();
            // Perform actions only when all models are loaded

            // let model = viewer.getAllModels()[0]; //!<< Check the first model just for demo
            // let fragList = model.getFragmentList();
            // let hiddenDbIds = Object.keys( fragList.vizflags ).filter(fragId => !fragList.isFragVisible( fragId )).map(fragId => fragList.getDbIds( fragId ) );
            
            // if (allModelsInitialized) return;
            if (viewer.model) {
                // allModelsInitialized = true; // 🔐 HARD STOP
                viewer.loadExtension('Autodesk.DataVisualization').then(() => {
                    console.log('Autodesk.DataVisualization loaded.');
                });

                viewer.loadExtension('Autodesk.DocumentBrowser').then(() => {
                    console.log('Autodesk.DocumentBrowser loaded.');
                });
    
                viewer.loadExtension('Autodesk.AEC.LevelsExtension').then((levelsExt) => {
                    console.log('Autodesk.AEC.LevelsExtension loaded.');
                });

                viewer.loadExtension('Autodesk.FullScreen').then(() => {
                    console.log('Autodesk.FullScreen loaded.');
                });

                viewer.loadExtension('Autodesk.AEC.Minimap3DExtension').then(() => {
                    console.log('Autodesk.Minimap3DExtension loaded.');
                });

                viewer.unloadExtension('Autodesk.Explode');
                
                const navTools = viewer.toolbar.getControl('navTools');
                navTools.removeControl('toolbar-orbitTools');
                navTools.removeControl('toolbar-panTool');
                navTools.removeControl('toolbar-zoomTool');
                navTools.removeControl('toolbar-cameraSubmenuTool');
                

                if(model === 'DB8' || model === 'HG62'){
                    showLiveDataPanel(viewer);
                    showLiveDataListPanel(viewer, model);
                    createToolbarLiveDataListButton(viewer, model);
                }else if(model === 'SOL11'){
                    Sol11PicsSPRITES(viewer);
                }

                // async function hideGenericModels(viewer, model) {
                //     // Wrap getObjectTree in a promise
                //     const instanceTree = await new Promise((resolve, reject) => {
                //         model.getObjectTree(function(tree) {
                //             resolve(tree);
                //         }, reject);
                //     });

                //     const dbIdsToHide = [];

                //     // Collect all dbIds
                //     const rootId = instanceTree.getRootId();
                //     const allDbIds = [];
                //     instanceTree.enumNodeChildren(rootId, function(dbId) {
                //         allDbIds.push(dbId);
                //     }, true);

                //     // For each dbId, get properties as a promise
                //     const propertyPromises = allDbIds.map(dbId => {
                //         return new Promise(resolve => {
                //             model.getProperties(dbId, function(props) {
                //                 if (props && props.properties) {
                //                     const categoryProp = props.properties.find(p => p.displayName === 'Category');
                //                     const zoneNameProp = props.properties.find(p => p.displayName === 'NV3DZoneName');

                //                     if (
                //                         categoryProp &&
                //                         categoryProp.displayValue === 'Revit Generic Models' &&
                //                         zoneNameProp &&
                //                         !zoneNameProp.displayValue.includes('Parking Area')
                //                     ) {
                //                         dbIdsToHide.push(dbId);
                //                     }
                //                 }
                //                 resolve();
                //             }, true);
                //         });
                //     });

                //     // Wait for all property checks to finish
                //     await Promise.all(propertyPromises);

                //     // Hide the collected nodes
                //     if (dbIdsToHide.length > 0) {
                //         viewer.hide(dbIdsToHide);
                //         console.log('Hiding Generic Models:', dbIdsToHide);
                //     }
                // }

                
                // viewer.anyLayerHidden();
                // console.log("Aggregate Hidden Nodes:", viewer.anyLayerHidden());

                
                // Call surface shading setup or any other actions here
                viewer.loadExtension('Autodesk.AEC.LevelsExtension').then(function(levelsExt) {
                    if (levelsExt && levelsExt.floorSelector) {
                        levelsExt.floorSelector.addEventListener(Autodesk.AEC.FloorSelector.SELECTED_FLOOR_CHANGED, function(event) {
                            const selectedLevelIndex = event.levelIndex; // Get the level index from the event
                            console.log(`Selected Floor Index: ${selectedLevelIndex}`);
                
                            // Check if the loaded model is named "DB8"
                            //let LiveData = localStorage.getItem('LiveData');
                            let LiveData = model;
                            console.log(LiveData);
                            if (LiveData === 'DB8' || LiveData === 'HG62' && selectedLevelIndex !== undefined && selectedLevelIndex >= 0) {
                                viewer.LiveDataListPanel.changedfloor(viewer, selectedLevelIndex, LiveData); // Call LiveDataListPanel
                             }
                        });
                
                        // Optionally, set a default floor after loading the extension
                        // levelsExt.floorSelector.selectFloor(0, true);
                
                        // Get and log the floor data
                        // const floorData = levelsExt.floorSelector;
                        // console.log("Initial Floor Data:", floorData);

                        // setTimeout(() => {
                        //     const floorAr = floorData._floors;
                        //     console.log("Floor Array after delay:", floorAr);

                        //     if (floorAr && floorAr.length > 0) {
                        //         floorAr.forEach((floor, index) => {
                        //             console.log(`Floor ${index}:`, floor);
                        //         });
                        //     } else {
                        //         console.error("Floors array is still empty.");
                        //     }
                        // }, 1000); // Wait for 1 second before checking


                    } else {
                        console.error("Levels Extension or floorSelector is not available.");
                    }
                });
                
                
                


                // Add click event listener to show the dbid of the selected object
                // viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function (event) {
                //     const selectedItems = viewer.getSelection();
                //     if (selectedItems.length > 0) {
                //         const dbid = selectedItems[0];
                //         console.log("Selected object dbid: " + dbid);

                //         // Get the screen coordinates from the mouse click
                //             const screenPoint = new THREE.Vector2(event.canvasX, event.canvasY);
                            
                //             // Convert screen coordinates to world coordinates
                //             const worldPoint = viewer.clientToWorld(screenPoint);

                //             console.log('World Coordinates:', worldPoint);
                //     }
                // }); 


                // const aecModelData = viewer.model.getData();
                // if (aecModelData) {
                //     console.log('AEC Model Data available:', aecModelData);
                // } else {
                //     console.log('AEC Model Data not available for this model.');
                // }


                let HardAsset = localStorage.getItem('HardAssetChecker');

                // #region FUNCTIONS

                localStorage.setItem("is2D", "false");

                await prewarmFunctionalLocationCacheFromModel(models[1]);

                viewer.addEventListener(
                    Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                    () => hideGenericModels(viewer, models[1])
                );

                [
                Autodesk.Viewing.ISOLATE_EVENT,
                Autodesk.Viewing.SHOW_ALL_EVENT
                ].forEach(evt =>
                viewer.addEventListener(evt, () =>
                    hideGenericModels(viewer, models[1])
                )
                );

                HardAssetSearch(viewer, HardAsset);

                ServiceZoneSearch(viewer, ServiceZone);

                FunctionalLocationSearch (viewer, FunctionalLocation);

                RepeatingTasks(viewer, RepeatingTask);

                WOServiceTask(viewer);

                AgreementFunctionalLocationSearch(viewer, window.agreementFL);

                highlightFLByTask(viewer, window.serviceZone);

                spaceInventorySearch(viewer, window.spaceInventory);

                // #endregion

                // TASK colors highlight websocket
                if (window.socket) {
                    window.socket.onmessage = async (event) => {
                    const message = JSON.parse(event.data);
                        if (message.type === "showTask") {
                            console.log("Received message:", event.data);
                            showTasks(viewer, message);
                        } else if(message.type === "showAllTask"){ 
                            console.log("Received message [show all task]:", event.data);
                            showAllTasks(viewer, message);
                        } else if(message.type === "showZone"){ 
                            console.log("Received message [show all zones]:", event.data);
                            zoneFunctionalLocation(viewer, message);
                        } else if (message.type === "completeTask") {
                            console.log("Received message [complete task]:", message);
                            console.log("Marking task as done for Hard Asset:", message.hardAsset, "Task Name:", message.taskName);
                            markTaskDone(viewer, message.hardAsset, message.taskName);
                        } else if (message.type === "showFirePlan") {
                            functions.firePlansPanel();
                        } else if (message.type === "showSheets2D") {
                            functions.sheets2DPanel();
                        } else if (message.type === "showLiveData") {
                            functions.liveDataPanel();
                        } else if (message.type === "closeInsidePanel") {
                            functions.closeInsidePanel();
                        }else {
                            console.log("Unknown message type received:", message.type);
                        }


                    };
                }


                let urn, modelUrn, urns = [];
                models.forEach(model => {
                    urn = model.getDocumentNode().getDefaultGeometry().children[1].data.urn; // Get the URN of the first model
                    modelUrn = urn.split('fs.file:')[1].split('/')[0];
                    urns.push(modelUrn);
                });

                window.urns = urns; // Store the URNs globally for access in other modules

                const canvas = viewer.impl.canvas;

                let lastTap = 0;
                canvas.addEventListener('click', async function (event) {
                    const now = Date.now();
                    const aggregateSelection = viewer.getAggregateSelection();
                    if (now - lastTap < 300) {
                        // console.log("🔥 DOUBLE TAP FIRED ON MOBILE!");
                        lastTap = 0;

                        if (!aggregateSelection?.length) return;

                        const iframe = document.getElementById("iframeTest");
                        const closeBtn = document.getElementById("closeIframeBtn");

                        // only bind close once
                        if (!closeBtn._bound) {
                            closeBtn._bound = true;
                            closeBtn.addEventListener("click", () => {
                                iframe.classList.remove("show");
                                iframe.src = "";
                                closeBtn.style.visibility = "hidden";
                                setTimeout(() => viewer.resize(), 300);
                            });
                        }

                        // parse userType once
                        const params = new URLSearchParams(window.location.search);
                        const userType = params.get("user");

                        for (const selection of aggregateSelection) {
                            const model = selection.model;
                            const dbId = selection.selection?.[0];
                            if (!dbId) continue;

                            // ----- getProperties (wrap in Promise)
                            const props = await new Promise(resolve => {
                                model.getProperties(dbId, p => resolve(p));
                            });

                            // ----- extract GlobalID
                            let globalID = null;
                            for (const prop of props.properties) {
                                if ((prop.displayName === "Asset ID" || prop.displayName === "Asset ID (GUID)") &&
                                    prop.displayValue) {
                                    globalID = prop.displayValue;
                                    break;
                                }
                            }
                            if (!globalID) continue;

                            // ----- classification
                            let isFunctionalLocation = false;

                            // CRM check (non-blocking)
                            (async () => {
                                try {
                                    const crmResp = await fetch(
                                        `https://org47a0b99a.crm4.dynamics.com/api/data/v9.2/msdyn_functionallocations(${globalID})`,
                                        { headers: { "Accept": "application/json;odata.metadata=none" } }
                                    );
                                    if (crmResp.ok) {
                                        isFunctionalLocation = true;
                                    }
                                } catch { /* ignore */ }
                            })();

                            // fallback logic
                            if (!isFunctionalLocation) {
                                const functionalKeywords = [
                                    "room","rooms","space","spaces","area","areas","corridor","hallway","hall",
                                    "passage","lobby","vestibule","foyer","gallery","concourse","stair","stairs",
                                    "staircase","stairwell","escalator","lift lobby","elevator lobby","shaft","riser",
                                    "mechanical room","electrical room","communication room","server room","telco",
                                    "riser room","pump room","fire pump room","control room","plant room",
                                    "boiler room","chiller room","toilet","washroom","bathroom","lavatory","wc",
                                    "shower","pantry","kitchen","storage","storeroom","janitor","cleaner","archive",
                                    "file room","meeting room","conference room","boardroom","office","zone","zones",
                                    "mass","revit mass","fire zone","hvac zone","text"
                                ];

                                for (const prop of props.properties) {
                                    const val = (prop.displayValue ?? "").toString().toLowerCase();

                                    if (prop.displayName === "Category") {
                                        if (["revit mass", "rooms", "spaces", "areas"].includes(val)) {
                                            isFunctionalLocation = true;
                                            break;
                                        }
                                    }

                                    if (["Type Name", "Family", "Name"].includes(prop.displayName)) {
                                        if (functionalKeywords.some(k => val.includes(k))) {
                                            isFunctionalLocation = true;
                                            break;
                                        }
                                    }
                                }
                            }

                            const isHardAsset = !isFunctionalLocation;

                            // ----- Build URL
                            let appId;
                            if (userType === "tenant") {
                                appId = "63879c3c-5060-f011-bec1-7c1e527684d6";
                            } else if (userType === "supplier") {
                                appId = "230c5e7c-1bd1-ef11-8eea-000d3ab86138";
                            } else {
                                appId = "2019ee4f-38bc-ef11-b8e9-000d3ab86138";
                            }

                            const entity = isHardAsset ? "msdyn_customerasset" : "msdyn_functionallocation";
                            const newUrl = `https://org47a0b99a.crm4.dynamics.com/main.aspx?appid=${appId}&pagetype=entityrecord&etn=${entity}&id=${globalID}`;

                            // ----- Show iframe instantly
                            iframe.src = newUrl;
                            iframe.classList.add("show");
                            closeBtn.style.visibility = "visible";
                            setTimeout(() => viewer.resize(), 300);

                            // notify container
                            window.parent.postMessage({ type: "openUrl", url: newUrl }, "*");
                        }
                    } else {
                         if (aggregateSelection && aggregateSelection.length > 0) { // Check if aggregateSelection is defined and has items
                            aggregateSelection.forEach(selection => {
                                // console.log("Processing selection:", selection); // Log the selection details
                    
                                const model = selection.model;           // Get the selected model
                                // console.log("Model:", model);            // Log the model
                    
                                const dbIdArray = selection.selection;   // Get the selected object IDs from the selection array
                                // console.log("dbIdArray:", dbIdArray);    // Log the dbIdArray
                    
                                if (dbIdArray && dbIdArray.length > 0) { // Ensure dbIdArray is defined and has objects
                                    const dbId = dbIdArray[0];           // Assume the first selected object for demonstration
                                    console.log("Selected dbId:", dbId); // Log the selected dbId
                    
                                    const instanceTree = model.getInstanceTree();
                                    // console.log("InstanceTree:", instanceTree); // Log the instance tree to ensure it's available
                    
                                    if (instanceTree) {
                                        instanceTree.enumNodeFragments(dbId, (fragId) => {
                                            const fragList = model.getFragmentList();    // Use the correct model's fragment list
                                            const matrix = new THREE.Matrix4();
                                            fragList.getWorldMatrix(fragId, matrix);
                    
                                            const position = new THREE.Vector3();
                                            position.setFromMatrixPosition(matrix);
                    
                                            console.log(`World Coordinates (Model ${model.id}): x=${position.x}, y=${position.y}, z=${position.z}`);
                                        });
                                    } else {
                                        console.log("InstanceTree not available for model:", model);
                                    }
                                } else {
                                    console.log("No objects selected in dbIdArray.");
                                }
                            });
                        } else {
                            console.log('No objects selected or aggregate selection is undefined.');
                        }
                    }
                    lastTap = now;
                });

                // ENABLE IF WANT TO SEARCH OBJECT IN MODEL

                // const overlay = document.getElementById('overlay');

                // overlay.style.visibility = 'visible';

                // document.getElementById("search").addEventListener("click", function first() {
                //     // viewer.search(
                //     //   document.getElementById("filter").value,
                //     //   function (dbIDs) {
                //     //     viewer.isolate(dbIDs);
                //     //     viewer.fitToView(dbIDs);
                //     // });

                //     viewer.search(document.getElementById("filter").value, function(dbIDs) {

                //         // Loop through the models only once
                //         models.forEach(model => {
                //             // Hide all objects first
                //             viewer.isolate([], model);

                //             // Isolate the found objects
                //             viewer.isolate(dbIDs, model);
                //         });

                //         // Fit to view and highlight the found objects
                //         viewer.fitToView(dbIDs);

                //         const color = new THREE.Vector4(1, 0, 0, 1);  // Red color with full intensity (RGBA)
                //         viewer.setThemingColor(dbIDs, color);  // Optionally highlight the objects

                //         viewer.setSelectionColor(new THREE.Color(1, 0, 0));  // RGB: red, green, blue
                //         viewer.select(dbIDs);  // Optionally highlight the objects
            
                //         // Disable further selections after this point
                        
                //     }, function(error) {
                //         console.error('Search error:', error);  // Handle any potential search errors
                //     });
                // });              
            }
        }
    }


// keep it outside so it's remembered across calls
let offset = null;

// #region load options

async function onDocumentLoadSuccess(doc) {
    let viewables = doc.getRoot().getDefaultGeometry();

    let loadOptions;
    if (modelsLoaded === 0) {
        loadOptions = {
            keepCurrentModels: true,
            applyRefPoint: true,
            skipHiddenFragments: true
        };
    } else {
        loadOptions = {
            keepCurrentModels: true,
            globalOffset: offset, // now it has the first model’s value
            applyRefPoint: true,
            skipHiddenFragments: true
        };
    }

    try {
        console.log("Loading model with options:", loadOptions);
        const model = await viewer.loadDocumentNode(doc, viewables, loadOptions);

        // save offset from the *first* model
        if (modelsLoaded === 0) {
            offset = model.getData().globalOffset || { x: 0, y: 0, z: 0 };
            console.log("Saved offset from first model:", offset);
        }

        modelsLoaded++;
        checkAllModelsLoaded();

    } catch (error) {
        console.error("Error loading model into viewer:", error);
        alert("Error loading model into viewer. See console for details.");
    }
}
// #endregion



    // Failure handler for loading models
    function onDocumentLoadFailure(code, message) {
        console.error("Failed to load model:", message);
        alert("Could not load model. See console for details.");
    }


    // Function to fetch the latest version URN of a file inside a folder
    async function fetchLatestUrn(hubId, projectId, folderId, baseUrn) {
        const accessToken = localStorage.getItem('authToken');
    
        const versionsUrl = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${baseUrn}/versions`;
        const response = await fetch(versionsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
    
        const versionsData = await response.json();
    
        if (versionsData.data && versionsData.data.length > 0) {
            let latestVersionUrn = versionsData.data[0].id;
            
            const AppState = {
                URN: latestVersionUrn
              };              
            // Your override logic
            if (latestVersionUrn === 'urn:adsk.wipemea:fs.file:vf.q8g1LE0vQ2WO5AHJ9Kd55A?version=3asda0') {
                latestVersionUrn = 'urn:adsk.wipemea:fs.file:vf.q8g1LE0vQ2WO5AHJ9Kd55A?version=20';
            } else if (latestVersionUrn === 'urn:adsk.wipemea:fs.file:vf.Oiuj-KZlQGWHcvIe4nDKKQ?version=73') {
                latestVersionUrn = 'urn:adsk.wipemea:fs.file:vf.Oiuj-KZlQGWHcvIe4nDKKQ?version=70';
            }

            console.log('Latest Version URN:', latestVersionUrn);
            return btoa(latestVersionUrn); // Base64 encode
        } else {
            console.error('No versions found for the file.');
            throw new Error('No versions found');
        }
    }
    
    async function loadModels() {
        try {
            // ✅ Fetch all latest URNs in parallel
            const latestUrns = await Promise.all(
                modelsToLoad.map(async (baseUrn) => {
                    try {
                        return await fetchLatestUrn(hubId, projectId, folderId, baseUrn);
                    } catch (error) {
                        console.error(`Failed to fetch latest URN for ${baseUrn}:`, error);
                        alert(`Could not fetch latest URN for ${baseUrn}. See console for details.`);
                        return null; // Skip this model
                    }
                })
            );
    
            // ✅ Filter out failed fetches (nulls)
            const validUrns = latestUrns.filter(urn => urn);
    
            // 🔄 Load each model sequentially
            for (let modelUrn of validUrns) {
                console.log(`Attempting to load model with URN: urn:${modelUrn}`);
    
                await new Promise((resolve, reject) => {
                    Autodesk.Viewing.Document.load(
                        'urn:' + modelUrn,
                        async (doc) => {
                            await onDocumentLoadSuccess(doc).then(resolve).catch(reject);
                        },
                        onDocumentLoadFailure
                    );
                });
            }
        } catch (error) {
            console.error("Unexpected error in loadModels:", error);
        }
    }
    // Load each model sequentially
    loadModels();
}


const lockedGenericDbIds = new Set();

async function hideGenericModels(viewer, model) {
  const instanceTree = await new Promise((resolve, reject) => {
    model.getObjectTree(resolve, reject);
  });

  const rootId = instanceTree.getRootId();
  const allDbIds = [];

  instanceTree.enumNodeChildren(rootId, dbId => {
    allDbIds.push(dbId);
  }, true);

  const checks = allDbIds.map(dbId => {
    return new Promise(resolve => {
      model.getProperties(dbId, props => {
        if (!props?.properties) return resolve();

        const categoryProp = props.properties.find(
          p => p.displayName === 'Category'
        )?.displayValue;

        const zoneProp = props.properties.find(
          p => p.displayName === 'NV3DZoneName'
        )?.displayValue;

        const isGenericCategory =
          categoryProp === 'Revit Generic Models' ||
          categoryProp === 'Generic Models' ||
          categoryProp === 'Revit Mass' ||
          categoryProp === 'Mass';

        // ✅ EXACT MATCH with prewarm
        if (isGenericCategory && zoneProp) {
          lockedGenericDbIds.add(dbId);
        }

        resolve();
      });
    });
  });

  await Promise.all(checks);

  if (!lockedGenericDbIds.size) return;

  const ids = [...lockedGenericDbIds];

//   console.log('Ghosting Generic Models:', ids);

//   viewer.select(ids, model);
  // 👻 Locked ghost mode
  viewer.setGhosting(true);
  viewer.hide(ids, model);
//   viewer.lockSelection(ids, true, model);

  // Prevent isolate / show from bringing them back
//   viewer.impl.visibilityManager.setNodeOff(ids, true);

//   viewer.impl.invalidate(true);

//   console.log(`Locked ${ids.length} Generic Models`);
}








// ******************************* WORKING ************************


// export function loadModel(viewer, urns) {
//     function onDocumentLoadSuccess(doc) {
//         // Load the model geometry
//         let viewables = doc.getRoot().getDefaultGeometry();

//         // Load the model and apply the placement transform
//         return viewer.loadDocumentNode(doc, viewables, {
//             globalOffset: { x: 0, y: 0, z: 0 },  // force all models to origin
//             placementTransform: (new THREE.Matrix4()).setPosition({ x: 0, y: 0, z: 0 })  // Force placement to origin
//         });
//     }

//     function onDocumentLoadFailure(code, message) {
//         console.error('Could not load model. See console for more details.', message);
//         alert('Could not load model. See console for more details.');
//     }

//     function loadModelSequentially(viewer, urns) {
//         if (!urns || urns.length === 0) return;

//         const loadDocument = (urn) => {
//             return new Promise((resolve, reject) => {
//                 Autodesk.Viewing.Document.load('urn:' + urn, (doc) => {
//                     onDocumentLoadSuccess(doc)
//                         .then(() => {
//                             console.log(`Loaded model with URN: ${urn}`);
//                             resolve();
//                         })
//                         .catch((error) => {
//                             console.error(`Error loading model: ${urn}`, error);
//                             reject(error);
//                         });
//                 }, onDocumentLoadFailure);
//             });
//         };

//         // Sequentially load the models one after another
//         urns.reduce((promise, urn) => {
//             return promise.then(() => loadDocument(urn));
//         }, Promise.resolve())
//             .then(() => {
//                 console.log("All models loaded successfully.");
//             })
//             .catch((error) => {
//                 console.error("Error loading models:", error);
//             });
//     }

//     // If no URNs are provided, use sample URNs for testing
//     const sampleUrns = [
//         { name: '3D - dsa3J29U', urn: 'dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLmN1eTlfS1FpU3lhZHFVdTJhSV9Cc2c/dmVyc2lvbj0xMw' },
//         { name: 'SMY-DB8-SITE', urn: 'dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLnNSZk9sS1BJVE1HM3pTZ0JvZUYzV3c/dmVyc2lvbj00' },
//         { name: 'SMY-DB8-xxx-SIT-R24', urn: 'dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLnhkWFJlcVYwVDFhem9XdWVFaVNuemc/dmVyc2lvbj0xNg' }
//     ];

//     const modelsToLoad = urns.length > 0 ? urns : sampleUrns.map(model => model.urn); // Use provided URNs or fallback to sample URNs
//     console.log(modelsToLoad);

//     // Load models sequentially
//     loadModelSequentially(viewer, modelsToLoad);
// }


// export function loadModel(viewer, urns = null) {
//     function onDocumentLoadSuccess(doc) {
//         // Load the model geometry
//         viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry())
//             .then(() => {
//                 // Once the geometry is loaded, call surface shading setup
//                 viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function () {
//                     if (viewer.model) {
//                     }
//                 });
//             })
//             .catch((error) => {
//                 console.error("Error loading geometry:", error);
//             });
//     }
    

//     function onDocumentLoadFailure(code, message) {
//         alert('Could not load model. See console for more details.');
//         console.error(message);
//     }

//     // If no URNs are provided, use sample URNs for testing
//     const sampleUrns = [
//         { name: '3D - dsa3J29U', urn: 'dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLmN1eTlfS1FpU3lhZHFVdTJhSV9Cc2c/dmVyc2lvbj0xMw', xform: {x:50,y:0,z:100} },
//         { name: 'SMY-DB8-xxx-SIT-R24', urn: 'dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLnNSZk9sS1BJVE1HM3pTZ0JvZUYzV3c/dmVyc2lvbj00', xform: {x:50,y:0,z:-50} },
//         { name: 'SMY-DB8-xxx-SIT-R24', urn: 'dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLnhkWFJlcVYwVDFhem9XdWVFaVNuemc/dmVyc2lvbj0xNg', xform: {x:50,y:0,z:-50} }

//         // { name: 'HG62 MEP', urn: 'dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLnZGZ01YNjRUVDBDcWU4THhZa2RvVUE/dmVyc2lvbj0xNw' },
//         // { name: 'HG62 ARCHI', urn: 'dXJuOmFkc2sud2lwZW1lYTpmcy5maWxlOnZmLlV3aG1UYUU1UlEyMS0tbm1DUWQycEE/dmVyc2lvbj05OQ' }
//     ];

//     const modelsToLoad = sampleUrns; // Use provided URNs or fallback to sample URNs

//     // Loop through each model and load them
//     modelsToLoad.forEach((model) => {
//         console.log(`Loading model: ${model.name || "Unnamed"} with URN: ${model.urn}`);
//         Autodesk.Viewing.Document.load('urn:' + model.urn, onDocumentLoadSuccess, onDocumentLoadFailure);
//     });
// }














//                                WORKING
//added levels filter
// async function getAccessToken(callback) {
//     try {
//         const resp = await fetch('/api/auth/token');
//         if (!resp.ok)
//             throw new Error(await resp.text());
//         const { access_token, expires_in } = await resp.json();
//         callback(access_token, expires_in);
//     } catch (err) {
//         alert('Could not obtain access token. See the console for more details.');
//         console.error(err);        
//     }
// }

// export function initViewer(container) {
//     return new Promise(function (resolve, reject) {
//         Autodesk.Viewing.Initializer({ env: 'AutodeskProduction', getAccessToken }, function () {
//             const config = {
//                 extensions: ['Autodesk.DocumentBrowser', 'Autodesk.AEC.LevelsExtension'] // Load custom extension here
//             };
//             const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
//             viewer.start();
//             viewer.setTheme('dark-theme');
//             resolve(viewer);
//         });
//     });
// }

// export function loadModel(viewer, urn) {
//     function onDocumentLoadSuccess(doc) {
//         viewer.loadDocumentNode(doc, doc.getRoot().getDefaultGeometry());
//     }
//     function onDocumentLoadFailure(code, message) {
//         alert('Could not load model. See console for more details.');
//         console.error(message);
//     }
//     Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
// }


// ******************************* WORKING ************************










