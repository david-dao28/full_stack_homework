const cors = require("cors");
const express = require("express");
const mysql = require("mysql");
const streamZip = require("node-stream-zip");

const app = express();

app.use(cors());

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST_IP,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

const buildHierarchy = (rows) => {
  
  /*
  file tree structure:
  - customer
    - customer_name: string
    - parts: []
      - part_name: string
      - part_revisions: []
        - part_revision_name: string
        - trials: []
          - trial_uuid: string
          - trial_status: boolean
          - process_runs: []
            - run_type: string
            - files: []
              - file_location: string
              - file_type: string
  */

  const hierarchicalData = [];
  rows.forEach((row) => {
    const { customer_name, part_name, part_revision_name, trial_uuid, trial_success, process_run_type, file_location, file_type } = row;
    const customerIndex = hierarchicalData.findIndex((customer) => customer.customer_name === customer_name);
  
    if (customerIndex === -1) {
      hierarchicalData.push({
        customer_name,
        parts: [
          {
            part_name,
            part_revisions: [
              {
                part_revision_name,
                trials: [
                  {
                    trial_uuid,
                    trial_status: trial_success,
                    process_runs: [
                      {
                        run_type: process_run_type,
                        files: [{ location: file_location, type: file_type }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    } else {
      const partIndex = hierarchicalData[customerIndex].parts.findIndex((part) => part.part_name === part_name);
  
      if (partIndex === -1) {
        hierarchicalData[customerIndex].parts.push({
          part_name,
          part_revisions: [
            {
              part_revision_name,
              trials: [
                {
                  trial_uuid,
                  trial_status: trial_success,
                  process_runs: [
                    {
                      run_type: process_run_type,
                      files: [{ location: file_location, type: file_type }],
                    },
                  ],
                },
              ],
            },
          ],
        });
      } else {
        const revisionIndex = hierarchicalData[customerIndex].parts[partIndex].part_revisions.findIndex(
          (revision) => revision.part_revision_name === part_revision_name
        );
  
        if (revisionIndex === -1) {
          hierarchicalData[customerIndex].parts[partIndex].part_revisions.push({
            part_revision_name,
            trials: [
              {
                trial_uuid,
                trial_status: trial_success,
                process_runs: [
                  {
                    run_type: process_run_type,
                    files: [{ location: file_location, type: file_type }],
                  },
                ],
              },
            ],
          });
        } else {
          const trialIndex = hierarchicalData[customerIndex].parts[partIndex].part_revisions[revisionIndex].trials.findIndex(
            (trial) => trial.trial_uuid === trial_uuid
          );
  
          if (trialIndex === -1) {
            hierarchicalData[customerIndex].parts[partIndex].part_revisions[revisionIndex].trials.push({
              trial_uuid,
              trial_status: trial_success,
              process_runs: [
                {
                  run_type: process_run_type,
                  files: [{ location: file_location, type: file_type }],
                },
              ],
            });
          } else {
            const runIndex = hierarchicalData[customerIndex].parts[partIndex].part_revisions[revisionIndex].trials[
              trialIndex
            ].process_runs.findIndex((run) => run.run_type === process_run_type);
  
            if (runIndex === -1) {
              hierarchicalData[customerIndex].parts[partIndex].part_revisions[revisionIndex].trials[
                trialIndex
              ].process_runs.push({
                run_type: process_run_type,
                files: [{ location: file_location, type: file_type }],
              });
            } else {
              hierarchicalData[customerIndex].parts[partIndex].part_revisions[revisionIndex].trials[
                trialIndex
              ].process_runs[runIndex].files.push({ location: file_location, type: file_type });
            }
          }
        }
      }
    }
  });
  return hierarchicalData
};


app.get("/file-tree", (req, res) => {
  pool.query(
    "SELECT " +
      "customer.name as customer_name," +
      "part.name as part_name," +
      "part_revision.name as part_revision_name," +
      "trial.uuid as trial_uuid," +
      "trial.success as trial_success," +
      "process_run.type as process_run_type," +
      "file.location as file_location," +
      "file.type as file_type " +
      "FROM customer " +
      "LEFT JOIN part ON customer.uuid = part.customer_uuid " +
      "LEFT JOIN part_revision ON part.uuid = part_revision.part_uuid " +
      "LEFT JOIN trial ON part_revision.uuid = trial.part_revision_uuid " +
      "LEFT JOIN process_run ON trial.uuid = process_run.trial_uuid " +
      "LEFT JOIN process_run_file_artifact ON process_run.uuid = process_run_file_artifact.process_run_uuid " +
      "LEFT JOIN file ON process_run_file_artifact.file_artifact_uuid = file.uuid or part_revision.geometry_file_uuid = file.uuid",
    (err, results) => {
      if (err) {
        console.log("error:", err);
        return res.send(err);
      } else {
        const rows = results.map((row) => ({
          customer_name: row.customer_name,
          part_name: row.part_name,
          part_revision_name: row.part_revision_name,
          trial_uuid: row.trial_uuid,
          trial_success: row.trial_success,
          process_run_type: row.process_run_type,
          file_location: row.file_location,
          file_type: row.file_type,
        }));

        // send over hierarchical data to frontend for ease of use
        const result = JSON.stringify(buildHierarchy(rows), null, 2);
        return res.send(result);
      }
    }
  );
});


app.get("/file", (req, res) => {
  const zip = new streamZip({
    file: 'files.zip',
    storeEntries: true
  });
  const filePath = `files/${req.query.path}`;
  // console.log(req.query.path)

  zip.on('ready', () => {
    const content = zip.entryDataSync(filePath).toString('utf8');
    zip.close();
    return res.send(content);
  })
})


app.listen(process.env.REACT_APP_SERVER_PORT, () => {
  console.log(
    `Machina Lab Server now listening on port ${process.env.REACT_APP_SERVER_PORT}`
  );
});
