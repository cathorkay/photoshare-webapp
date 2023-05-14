import React from 'react';
import {
  AppBar, Box, Button, Toolbar, Typography
} from '@mui/material';
import axios from 'axios';
import './TopBar.css';

class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "Home",
      version: 999
    };
  }

  componentDidMount() {
    const currURL = window.location.href;
    if (currURL !== 'http://localhost:3000/photo-share.html#/') {    
      const pathname = currURL.substring(currURL.indexOf("#") + 1);
      const userId = pathname.split('/').pop();
      const firstName = window.cs142models.userModel(userId).first_name;
      const lastName = window.cs142models.userModel(userId).last_name;

      if (pathname.startsWith('/users/')) {
        this.setState({ title: `${firstName} ${lastName}` });
      } else if (pathname.startsWith('/photos/')) {
        this.setState({ title: `Photos of ${firstName} ${lastName}` });
      } else {
        this.setState({ title: "Home" });
      }
    }

    axios.get('http://localhost:3000/test/info')
      .then((response) => {
        let v = response.data.__v;
        this.setState({ version: v });
      })
      .catch(error => console.log(error));
  }

  componentDidUpdate() {
    let newTitle;
    if (this.props.displaying === 'userDetails' && this.props.currentUser) {
      newTitle = `${this.props.currentUser.first_name} ${this.props.currentUser.last_name}`;
      if (this.state.title !== newTitle) this.setState( { title: newTitle });
    } else if (this.props.displaying === 'userPhotos' && this.props.currentUser) {
      newTitle = `Photos of ${this.props.currentUser.first_name} ${this.props.currentUser.last_name}`;
      if (this.state.title !== newTitle) this.setState( { title: newTitle });
    }
  }  
  

  handleLogout = (event) => {
    event.preventDefault();
    axios.post(`http://localhost:3000/admin/logout`)
      .then((response) => {
        this.props.setLoggedInUser(null);
        console.log("handleLogout: setLoggedInUser to null");
        console.log(response);
        console.log("handleLogout: Logout successful!");
        window.location.href = "/";
      })
      .catch((error) => {
        console.log("error logging out:", error);
      });
  };

  handleUploadButtonClicked = (e) => {
    e.preventDefault();
    if (this.uploadInput.files.length > 0) {
      // Create a DOM form and add the file to it under the name uploadedphoto
      const domForm = new FormData();
      domForm.append('uploadedphoto', this.uploadInput.files[0]);
      axios.post('/photos/new', domForm)
        .then((res) => {
          console.log(res);
        })
        .catch(err => console.log(`POST ERR: ${err}`));
    }
  };
  
  render() {
    return (
      <AppBar className="cs142-topbar-appBar" position="absolute">
        <Toolbar>
          <Box className="mainContainer">
            {this.props.loggedInUser !== null ? (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h5" sx={{ display: 'block' }}>
                    Hi, {this.props.loggedInUser ? this.props.loggedInUser.first_name : ''}!
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'block' }}>
                    Version: {this.state.version}
                  </Typography>
                </Box>
                <Typography variant="h5">
                  {this.state.title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <input type="file" accept="image/*" ref={(domFileRef) => { this.uploadInput = domFileRef; }} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained" onClick={this.handleUploadButtonClicked} sx={{ marginLeft: 1 }}>
                      Add Photo
                    </Button>
                    <Button variant="contained" onClick={this.handleLogout} sx={{ marginLeft: 1, backgroundColor: 'orangered' }}>
                      Log Out
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <Typography variant="h4" sx={{fontStyle: 'italic'}}>
                Please Login
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    );
  }  
}  
export default TopBar;