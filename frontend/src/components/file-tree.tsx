import React, { useEffect, useState } from "react";
import axios from "axios";
import List from "@mui/material/List";
import { ListItem, Typography } from "@mui/material";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PersonIcon from "@mui/icons-material/Person";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from "@mui/icons-material/Help";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {
  Customer,
  Part,
  PartRevision,
  Trial,
  ProcessRun,
  File,
} from "../types";

export function FileTree() {
  const [data, setData] = useState([]);

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '75%',
    height: '75%',
    overflowY: 'auto',
    bgcolor: '#212121',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  // load data from backend API
  useEffect(() => {
    axios
      .get("http://localhost:3000/file-tree")
      .then((response) => {
        setData(response.data);
        console.log(response);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  // customer level component
  const CustomerItem: React.FC<{ customer: Customer }> = ({ customer }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <ListItemButton onClick={() => setOpen(!open)}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary={customer.customer_name} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          {customer.parts.map((part: Part) => (
            <PartItem key={part.part_name} part={part} />
          ))}
        </Collapse>
      </>
    );
  };

  // part level component
  const PartItem: React.FC<{ part: Part }> = ({ part }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <ListItemButton onClick={() => setOpen(!open)} sx={{ pl: 8 }}>
          <ListItemText primary={`Part: ${part.part_name}`} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          {part.part_revisions.map((partRevision: PartRevision) => (
            <PartRevisionItem
              key={partRevision.part_revision_name}
              partRevision={partRevision}
            />
          ))}
        </Collapse>
      </>
    );
  };

  // part revision level component
  const PartRevisionItem: React.FC<{ partRevision: PartRevision }> = ({
    partRevision,
  }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <ListItemButton onClick={() => setOpen(!open)} sx={{ pl: 16 }}>
          <ListItemText
            primary={`Revision: ${partRevision.part_revision_name}`}
          />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          {partRevision.trials.map((trial: Trial) => (
            <TrialItem key={trial.trial_uuid} trial={trial} />
          ))}
        </Collapse>
      </>
    );
  };

  // trial level component
  const TrialItem: React.FC<{ trial: Trial }> = ({ trial }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <ListItemButton onClick={() => setOpen(!open)} sx={{ pl: 24 }}>
          <ListItemIcon>
            {trial.trial_status === null ? (
              <HelpIcon color="action" />
            ) : trial.trial_status ? (
              <CheckCircleIcon color="success" />
            ) : (
              <CancelIcon color="error" />
            )}
          </ListItemIcon>
          <ListItemText primary={`Trial: ${trial.trial_uuid}`} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          {trial.process_runs.map((processRun: ProcessRun, index) => (
            <ProcessRunItem key={index} processRun={processRun} />
          ))}
        </Collapse>
      </>
    );
  };

  // process run level component
  const ProcessRunItem: React.FC<{ processRun: ProcessRun }> = ({
    processRun,
  }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <ListItemButton onClick={() => setOpen(!open)} sx={{ pl: 32 }}>
          <ListItemText primary={processRun.run_type} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          {processRun.files.map((file, index) => (
            <FileItem key={index} file={file} />
          ))}
        </Collapse>
      </>
    );
  };

  // file level component
  const FileItem: React.FC<{ file: File }> = ({ file }) => {
    const [fileContent, setFileContent] = useState('');
    const [href, setHref] = useState('');
    const [open, setOpen] = useState(false);
    const fileName = file.location.slice(file.location.lastIndexOf("/") + 1);

    // fetch text content of this file
    useEffect(() => {
      axios({
        url: `http://localhost:3000/file?path=${file.location}`,
        method: 'GET',
        responseType: 'blob'
      }).then(async (response) => {
        const text = await response.data.text();
        setFileContent(text);
        // create file link in browser's memory
        setHref(URL.createObjectURL(response.data))
      }).catch((error) => {
        console.error("Error downloading file:", error);
      })
    }, [file]);
    
    const downloadFile = () => {
      // create "a" HTML element with href to file & click
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', file.location);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    };

    // handlers for file preview modal
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    if (!fileContent) {
      return null;
    }
    return (
      <>
        <Modal
          open={open}
          onClose={handleClose}
        >
          <Box sx={modalStyle}>
            <Box sx={{ display: 'flex', alignItems: 'center', 'justifyContent': 'space-between'}}>
              <Typography id="modal-modal-title" variant="h6" component="h2">
                File Preview
              </Typography>
              <Button onClick={handleClose}>
                <CloseIcon />
              </Button>
            </Box>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              {fileContent.slice(0, 5000) + (fileContent.length > 5000 && ' ...')}
            </Typography>
          </Box>
        </Modal>
        <ListItem sx={{ pl: 40 }}>
          <ListItemText primary={fileName} />
          {/* Allow preview of only non-3D files */}
          {file.type !== "CAD" && (
            <ListItemIcon>
              <ListItemButton onClick={handleOpen}>
                <VisibilityIcon />
              </ListItemButton>
            </ListItemIcon>
          )}
          <ListItemIcon>
            <ListItemButton onClick={() => downloadFile()}>
              <DownloadIcon />
            </ListItemButton>
          </ListItemIcon>
        </ListItem>
      </>
    );
  };


  return (
    <List
      sx={{ width: "100%" }}
      component="nav"
      aria-labelledby="nested-list-subheader"
    >
      {data &&
        data.map((customer: Customer) => {
          return (
            <CustomerItem key={customer.customer_name} customer={customer} />
          );
        })}
    </List>
  );
}
