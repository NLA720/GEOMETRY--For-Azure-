
const express = require('express');
const Axios = require('axios');
const cors = require('cors'); // Import CORS
// const bodyParser = require('body-parser');
const { getAuthorizationUrl, authCallbackMiddleware, authRefreshMiddleware, getUserProfile } = require('../services/aps.js');
const { APS_CLIENT_ID, APS_CLIENT_SECRET } = require('../config.js');

var scopes = 'data:read data:write';
const querystring = require('querystring');

const sql = require('mssql');

//
// Azure SQL configuration
const config = {
    user: 'sqlserverdb8_admin',
    password: 'jCz91%z%FlS7',
    server: 'sqlserverdb8.database.windows.net',
    database: 'SQLDB_DB8',
    options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: true, // Change to false in production for a secure setup
    },
    pool: {
        max: 10, // Maximum number of connections in the pool
        min: 0,  // Minimum number of connections in the pool
        idleTimeoutMillis: 30000 // Close idle connections after 30 seconds
    },
    requestTimeout: 60000,  // Increase request timeout to 60 seconds
    connectionTimeout: 30000  // Increase connection timeout to 30 seconds
};

let router = express.Router();

// Enable CORS with specific origin (your Dynamics URL)
router.use(cors());


router.get('/api/auth/login', function (req, res) {
    res.redirect(getAuthorizationUrl());
});

router.get('/api/auth/logout', function (req, res) {
    req.session = null;
    res.redirect('/');
});


router.get('/api/auth/callback', authCallbackMiddleware, (req, res) => {
    const publicToken = req.session.public_token;
    const refreshToken = req.session.refresh_token;
    const expires_at = req.session.expires_at;
    const internal_token = req.session.internal_token;

     // window.opener.postMessage({ token: '${publicToken}' }, window.location.origin);

    res.send(`
        <script>
            if (window.opener) {
                // Send the token back to the parent window
               
                window.opener.postMessage({ token: '${publicToken}', refreshToken: '${refreshToken}', expires_at: '${expires_at}', internal_token: '${internal_token}' }, window.location.origin);

                window.close();  // Close the popup
            }
        </script>
    `);
});


// router.get('/api/auth/token', authRefreshMiddleware, function (req, res) {
//     res.json(req.publicOAuthToken);
// });


// 'Authorization': `Basic SERuVXlvcDFCcjZoS2dGa1BGTWZka3JOY1k4MTFpTTc1OUJFQ2hwWWtmZVVaM3JyOkJoRzdNaG1FMjdka1RuY3ZiRjFGOFlMd09wRllxT3I0aTN2ak9zUWpwVVplUGkzdnBhMW1VcTNHNlgwdjdLUHA=`,

// ENABLE TOP CODE TO VIEW THE SIDEBAR MAIN.MJS, AUTH/TOKEN, AUTH/PROFILE

router.get('/api/auth/token', async (req, res) => {
    try {
        const response = await Axios({
            method: 'POST',
            url: 'https://developer.api.autodesk.com/authentication/v2/token',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                // 'Accept': 'application/json',
                'x-user-id': '3a15881a-370e-4d72-80f7-8701c4b1806c'
            },
            data: querystring.stringify({
                client_id: APS_CLIENT_ID,
                client_secret: APS_CLIENT_SECRET,
                grant_type: 'client_credentials',
                scope: 'data:read data:write account:read viewables:read',
            })
        });

        if (response.status === 200 && response.data.access_token) {
            res.json({
                access_token: response.data.access_token,
                refresh_token: response.data.access_token,
                expires_in: response.data.expires_in,
                internal_token: response.data.access_token
            });
        } else {
            console.error('Authentication failed, invalid response:', response.data);
            res.status(400).json({ error: 'Failed to authenticate: Invalid response from API' });
        }

    } catch (error) {
        // Log detailed error for debugging
        console.error('Error during authentication:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to authenticate', details: error.response?.data || error.message });
    }
});


// router.get('/api/auth/profile', async function (req, res, next) {
//     try {
//         const authToken = req.headers.authorization?.split(' ')[1]; // Extract token from headers
//         const profile = await getUserProfile(authToken);
//         res.json({ name: `${profile.name}` });
//     } catch (err) {
//         next('ERROR: ' + err);
//     }
// });


// ENABLE TOP CODE TO VIEW THE SIDEBAR MAIN.MJS, AUTH/TOKEN, AUTH/PROFILE

router.get('/api/auth/profile', async function (req, res, next) {
    try {
        const authToken = req.headers.authorization?.split(' ')[1]; // Extract token from headers
        // const profile = await getUserProfile(authToken);
        // res.json({ name: `${profile.name}` });
        res.json({ name: authToken });
    } catch (err) {
        next('ERROR: ' + err);
    }
});


// Create a connection pool (this will be reused for all requests)
let poolPromise;

async function getPool() {
    if (!poolPromise) {
        // Create the pool only once on the first request
        poolPromise = sql.connect(config);
    }
    return poolPromise;
}




// --------------------------------------------------------------------------- LIVE DATA ---------------------------------------------------------------------------
//* TEMP SENSOR
//#region TEMP SENSOR
// Route to retrieve sensor value
router.get('/api/sensor/:location', async (req, res) => {
    const location = req.params.location;
    try {
        // Get the connection pool
        const pool = await getPool();

        // Query the database
        const result = await pool.request()
            .input('location', sql.VarChar, location)
            .query('SELECT TOP (1) [value], [observationTime] FROM [dbo].[LiveData] WHERE sensorId = @location ORDER BY observationTime DESC');

        if (result.recordset.length > 0) {
            res.json({ value: result.recordset[0].value });
        } else {
            res.status(404).send('Sensor not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving sensor value');
    }
});
// #endregion

//! TEMPERATURE SENSOR V2 [HG62]
// #region TEMPERATURE SENSOR V2 [HG62]
router.get('/api/sensorv2/:location', async (req, res) => {
    const location = req.params.location;
    try {
        // Get the connection pool
        const pool = await getPool();

        // Query the database
        const result = await pool.request()
            .input('location', sql.VarChar, location)
            .query('SELECT TOP (1) [value], [observationTime] FROM [dbo].[LiveData] WHERE deviceId = @location ORDER BY observationTime DESC');

        if (result.recordset.length > 0) {
            res.json({ value: result.recordset[0].value });
        } else {
            res.status(404).send('Sensor not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving sensor value');
    }
});
// #endregion

//* LIGHT SENSOR
//#region LIGHT SENSOR
router.get('/api/LightSensor/:location', async (req, res) => {
    const location = req.params.location;
    try {
        // Get the connection pool
        const pool = await getPool();

        // Query the database
        const result = await pool.request()
            .input('location', sql.VarChar, location)
            .query('SELECT TOP (1) [value], [observationTime] FROM [dbo].[LiveData] WHERE sensorId = @location ORDER BY observationTime DESC');

        if (result.recordset.length > 0) {
            res.json({ value: result.recordset[0].value });
        } else {
            res.status(404).send('Sensor not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving sensor value');
    }
});
// #endregion


//! fetch graph data
//#region fetch graph data
router.get('/api/graphdata/:location', async (req, res) => {
    const location = req.params.location;
    try {
        // Get the connection pool
        const pool = await getPool();

        // Query the database
        const result = await pool.request()
            .input('location', sql.VarChar, location)
            .query(`
                SELECT TOP (1)
                FORMAT(ld.observationTime, 'HH:mm - dd MMM') AS observationTime,
                    ld.value
                FROM
                    [dbo].[LiveData] ld
                WHERE
                    ld.sensorId = @location
                ORDER BY
                    ld.observationTime DESC
            `);

        if (result.recordset.length > 0) {
            res.json(result.recordset);
        } else {
            res.status(404).send('No data found for the specified location');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving graph data');
    }
});
//#endregion



//! TEMP SETPOINT HG62
// #region TEMP SETPOINT HG62
router.get('/api/TempSetpoint/:location', async (req, res) => {
    const location = req.params.location;
    try {
        // Get the connection pool
        const pool = await getPool();

        // Query the database
        const result = await pool.request()
            .input('location', sql.VarChar, location)
            .query(`
                WITH RankedData AS (
                    SELECT 
                        [deviceId], 
                        [value], 
                        [observationTime], 
                        [quantityKind], 
                        ROW_NUMBER() OVER (PARTITION BY [quantityKind] ORDER BY [observationTime] DESC) AS rn 
                    FROM 
                        [dbo].[LiveData] 
                    WHERE 
                        deviceId = @location 
                        AND (quantityKind LIKE '%HG62_Sensor%' OR quantityKind LIKE '%HG62_Setpoint%')
                )
                SELECT 
                    [deviceId], 
                    [value], 
                    [observationTime], 
                    [quantityKind]
                FROM 
                    RankedData
                WHERE 
                    rn = 1;
            `);

        if (result.recordset.length > 0) {
            // Assuming you want to respond with both value and setpoint based on quantityKind
            const sensorData = result.recordset.reduce((acc, record) => {
                if (record.quantityKind.includes('Sensor')) {
                    acc.value = record.value;
                }
                if (record.quantityKind.includes('Setpoint')) {
                    acc.setpoint = record.value;
                }
                acc.observationTime = record.observationTime; // Format the date
                return acc;
            }, {});

            res.json(sensorData);
        } else {
            res.status(404).send('Sensor not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving sensor value');
    }
});
// #endregion



// --------------------------------------------------------------------------- LIVE DATA ---------------------------------------------------------------------------










const sessionDataStore = {};  // Store data per session

// Endpoint to receive data from Power Apps
router.post('/api/data', (req, res) => {
    const powerAppsData = req.body;
    console.log('Received Data:', powerAppsData);
  
    // Respond back to Power Apps
    res.status(200).send('Data received successfully');
});



 
//*ASSET AUTOMATION
//#region ASSET AUTOMATION
router.get("/api/acc/getElementsByCategory", async (req, res) => {
  const authToken = req.headers.authtoken;
  const EXCHANGE_ID = req.headers["exchangeid"];
  const category = req.headers["category"];


  if (!authToken || !EXCHANGE_ID || !category) {
    return res.status(400).json({ error: "Missing required headers (authtoken, exchangeid, category)" });
  }

  const query = `
    query GetElements($exchangeId: ID!, $elementFilter: ElementFilterInput, $elementPagination: PaginationInput) {
      exchange(exchangeId: $exchangeId) {
        elements(filter: $elementFilter, pagination: $elementPagination) {
          pagination {
            cursor
            pageSize
          }
          results {
            id
            name
            alternativeIdentifiers {
                externalElementId
            }
            properties {
              results {
                name
                value
              }
            }
          }
        }
      }
    }
  `;

  try {
    let allResults = [];
    let cursor = "";
    let hasMore = true;

    while (hasMore) {
      const gqlResponse = await fetch(
        "https://developer.api.autodesk.com/dataexchange/2023-05/graphql",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Region: "EMEA"
          },
          body: JSON.stringify({
            query,
            variables: {
              exchangeId: EXCHANGE_ID,
              elementFilter: { query: `property.name.category=="${category}"` },
              elementPagination: { limit: 100, cursor }
            },
            operationName: "GetElements"
          })
        }
      );

      const data = await gqlResponse.json();

      if (!data?.data?.exchange?.elements) {
        throw new Error("Invalid GraphQL response");
      }

      const elements = data.data.exchange.elements;
      allResults.push(...elements.results);

      if (elements.pagination.cursor) {
        cursor = elements.pagination.cursor;
      } else {
        hasMore = false;
      }
    }

    // 🔑 Clean properties into key/value pairs
    const cleanedResults = allResults.map(el => {
    const props = {};
    el.properties.results.forEach(p => {
        props[p.name] = p.value;
    });
    return {
        id: el.id,
        name: el.name,
        revitGuid: el.alternativeIdentifiers?.externalElementId || null,
        elementId: el.alternativeIdentifiers?.originalSystemId || null,
        ...props
    };
    });

    res.status(200).json({ count: cleanedResults.length, results: cleanedResults });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Unexpected error", details: err.message });
  }
});
// #endregion






//get all objects without category [DB8]

// router.get("/api/acc/getWalls", async (req, res) => {
//   const EXCHANGE_ID = "ZXhjfm5YNXNGbDB0bmRqeXBYTzhOV2VqQktfTDJDfmRjMWUxNDE4LTJjYTAtMzlhNS1hZTc3LTkyZGQzNDU3MTg2Mw";
//   const authToken = req.headers["authtoken"];

//   if (!authToken) {
//     return res.status(400).json({ error: "Missing Authorization token" });
//   }

//   try {
//     const query = `
//       query GetAllElements($exchangeId: ID!, $elementPagination: PaginationInput) {
//         exchange(exchangeId: $exchangeId) {
//           elements(pagination: $elementPagination) {
//             pagination {
//               cursor
//               pageSize
//             }
//             results {
//               id
//               name
//               properties {
//                 results {
//                   name
//                   value
//                 }
//               }
//             }
//           }
//         }
//       }
//     `;

//     let allResults = [];
//     let cursor = "";
//     let hasMore = true;

//     while (hasMore) {
//       const gqlResponse = await fetch(
//         "https://developer.api.autodesk.com/dataexchange/2023-05/graphql",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${authToken}`,
//             "Content-Type": "application/json",
//             "Region": "EMEA"
//           },
//           body: JSON.stringify({
//             query,
//             variables: {
//               exchangeId: EXCHANGE_ID,
//               elementPagination: { limit: 100, cursor }
//             },
//             operationName: "GetAllElements"
//           })
//         }
//       );

//       const data = await gqlResponse.json();

//       const elements = data.data.exchange.elements;
//       allResults.push(...elements.results);

//       if (elements.pagination.cursor) {
//         cursor = elements.pagination.cursor;
//       } else {
//         hasMore = false;
//       }
//     }

//     // 🔑 Flatten properties into key/value
//     const cleanedResults = allResults.map(el => {
//       const props = {};
//       el.properties.results.forEach(p => {
//         props[p.name] = p.value;
//       });
//       return {
//         id: el.id,
//         name: el.name,
//         ...props
//       };
//     });

//     res.status(200).json({ count: cleanedResults.length, results: cleanedResults });

//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).json({ error: "Unexpected error", details: err.message });
//   }
// });







// router.post('/export-pdf', async (req, res) => {
//   const { urn, viewableID, sheetName } = req.body;

//   if (!urn || !viewableID) return res.status(400).send('Missing urn or viewableID');

//   try {
    
//     const authToken = req.headers.authorization?.split(' ')[1]; // Extract token from headers
//      console.log(authToken)
//     const jobResp = await fetch(`https://developer.api.autodesk.com/modelderivative/v2/designdata/job`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${authToken}`
//       },
//       body: JSON.stringify({
//         input: { urn },
//         output: {
//           formats: [{ type: 'pdf', views: ['2d'], advanced: { sheetIds: [viewableID] } }]
//         }
//       })
//     });

//     if (!jobResp.ok) {
//       const text = await jobResp.text();
//       console.error('Job submission failed:', text);
//       return res.status(500).send('Failed to start PDF job');
//     }

//     const jobData = await jobResp.json();
//     res.json({ status: 'submitted', jobData });

//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Failed to export PDF');
//   }
// });


// module.exports = router;

// const express = require("express");
// const fetch = require("node-fetch"); // make sure node-fetch v2 installed
// const router = express.Router();

// const express = require("express");
// const fetch = require("node-fetch"); // if using node 18+, can use global fetch
// const router = express.Router();


///here

// router.post("/export-pdf", async (req, res) => {
//   const { containerId, versionId, sheetName } = req.body;

//   if (!containerId || !versionId) {
//     return res.status(400).send("Missing containerId or versionId");
//   }

//   try {
//     // ACC requires a 3-legged access token with data:read
//     const accessToken = req.headers.authorization?.split(" ")[1];
//     if (!accessToken) return res.status(401).send("Missing Authorization token");

//     // Trigger the PDF extraction job
//     const pdfJobResp = await fetch(
//       `https://developer.api.autodesk.com/acc/v1/containers/${containerId}/versions/${versionId}/relationships/derivatives`,
//       {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${accessToken}`,
//           "Content-Type": "application/vnd.api+json"
//         },
//         body: JSON.stringify({
//           jsonapi: { version: "1.0" },
//           data: {
//             type: "derivatives",
//             attributes: {
//               outputType: "pdf",
//               sheetIds: req.body.sheetIds ? req.body.sheetIds : []
//             }
//           }
//         })
//       }
//     );

//     if (!pdfJobResp.ok) {
//       const text = await pdfJobResp.text();
//       console.error("PDF job failed:", text);
//       return res.status(500).send("Failed to start PDF job");
//     }

//     const jobData = await pdfJobResp.json();

//     // Polling the job until it's ready
//     const derivativeId = jobData.data.id; // job derivative ID
//     let pdfReady = false;
//     let downloadUrl;

//     while (!pdfReady) {
//       await new Promise(r => setTimeout(r, 3000));

//       const statusResp = await fetch(
//         `https://developer.api.autodesk.com/acc/v1/containers/${containerId}/versions/${versionId}/relationships/derivatives/${derivativeId}`,
//         { headers: { Authorization: `Bearer ${accessToken}` } }
//       );

//       const statusData = await statusResp.json();

//       if (statusData.data.attributes.status === "success") {
//         pdfReady = true;
//         downloadUrl = statusData.data.attributes.downloadUrl;
//       } else if (statusData.data.attributes.status === "failed") {
//         return res.status(500).send("PDF generation failed");
//       }
//     }

//     // Fetch the PDF and pipe it to the client
//     const pdfResp = await fetch(downloadUrl);
//     const pdfBuffer = await pdfResp.arrayBuffer();

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="${sheetName || "sheet"}.pdf"`
//     );
//     res.send(Buffer.from(pdfBuffer));

//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Error exporting PDF");
//   }
// });



// module.exports = router;




// router.post("/export-pdf", async (req, res) => {
//   const { urn, viewableID, sheetName } = req.body;

//   if (!urn || !viewableID)
//     return res.status(400).send("Missing urn or viewableID");

//   try {
    

//     // 1️⃣ Start PDF translation job
//     const jobResp = await fetch(
//       "https://developer.api.autodesk.com/modelderivative/v2/designdata/job",
//       {
//         method: "POST",
//         headers: {
//             "Authorization": `Bearer ${accessToken}`,
//           "Content-Type": "application/vnd.api+json"
//         },
//         body: JSON.stringify({
//           input: { urn },
//           output: {
//             formats: [{
//               type: "pdf",
//               views: ["2d"],
//               advanced: {
//                 sheetIds: [viewableID]
//               }
//             }]
//           }
//         })
//       }
//     );

//     if (!jobResp.ok) {
//   const err = await jobResp.text();
//   console.error("AUTODESK ERROR:", err);
//   return res.status(500).send(err);
// }


//     // 2️⃣ Poll until ready
//     let pdfUrn;
//     while (!pdfUrn) {
//       await new Promise(r => setTimeout(r, 3000));

//       const manifestResp = await fetch(
//         `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`,
//         { headers: { Authorization: `Bearer ${accessToken}` } }
//       );

//       const manifest = await manifestResp.json();

//       const pdfDerivative = manifest.derivatives?.find(d => d.outputType === "pdf");

//       if (pdfDerivative?.children?.length) {
//         pdfUrn = pdfDerivative.children[0].urn;
//       }
//     }

//     // 3️⃣ Download the PDF
//     const pdfResp = await fetch(
//       `https://developer.api.autodesk.com/derivativeservice/v2/derivatives/${pdfUrn}`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     const buffer = await pdfResp.buffer();

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="${sheetName || "sheet"}.pdf"`
//     );
//     res.send(buffer);

//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Export failed");
//   }
// });

// module.exports = router;


// Get 2-legged token
// async function getAccessToken() {
//   const resp = await fetch(
//     "https://developer.api.autodesk.com/authentication/v1/authenticate",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded"
//       },
//       body: new URLSearchParams({
//         client_id: process.env.FORGE_CLIENT_ID,
//         client_secret: process.env.FORGE_CLIENT_SECRET,
//         grant_type: "client_credentials",
//         scope: "data:read data:write bucket:read"
//       })
//     }
//   );

//   const data = await resp.json();
//   return data.access_token;
// }


// Get 2-legged token

//   const resp = await fetch(
//     "https://developer.api.autodesk.com/authentication/v1/authenticate",
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded"
//       },
//       body: new URLSearchParams({
//         client_id: process.env.FORGE_CLIENT_ID,
//         client_secret: process.env.FORGE_CLIENT_SECRET,
//         grant_type: "client_credentials",
//         scope: "data:read data:write bucket:read"
//       })
//     }
//   );

//   const data = await resp.json();
//   return data.access_token;

const app = express();

// Add this **before your routes**
app.use(express.json());

router.post("/export-pdf", async (req, res) => {
  const { urn, viewableID, sheetName } = req.body;

  if (!urn || !viewableID)
    return res.status(400).send("Missing urn or viewableID");

  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) return res.status(401).send("Missing access token");

  try {
    // 1️⃣ Start PDF translation job
    const jobResp = await fetch(
      "https://developer.api.autodesk.com/modelderivative/v2/designdata/job",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: { urn },
          output: {
            formats: [
              {
                type: "pdf",
                views: ["2d"],
                advanced: { sheetIds: [viewableID] } // Use the correct viewableID here!
              }
            ]
          }
        })
      }
    );

    if (!jobResp.ok) {
      const err = await jobResp.text();
      console.error("AUTODESK ERROR:", err);
      return res.status(500).send(err);
    }

    const jobData = await jobResp.json();
    console.log("PDF job submitted:", jobData);

    // 2️⃣ Poll for PDF availability (with timeout)
    let pdfUrn = null;
    const start = Date.now();

    while (!pdfUrn) {
      if (Date.now() - start > 60000) { // timeout 60s
        return res.status(500).send("PDF translation timed out");
      }

      await new Promise(r => setTimeout(r, 3000));

      const manifestResp = await fetch(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const manifest = await manifestResp.json();

      if (manifest.status === "failed") {
        return res.status(500).send("PDF translation failed");
      }

      const pdfDerivative = manifest.derivatives?.find(d => d.outputType === "pdf");

      if (pdfDerivative?.children?.length) {
        pdfUrn = pdfDerivative.children[0].urn;
      }
    }

    // 3️⃣ Download PDF
    const pdfResp = await fetch(
      `https://developer.api.autodesk.com/derivativeservice/v2/derivatives/${pdfUrn}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const buffer = await pdfResp.buffer();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sheetName || "sheet"}.pdf"`
    );

    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send("Export failed");
  }
});

module.exports = router;
