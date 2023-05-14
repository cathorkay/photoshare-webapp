import React from 'react';
import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Container,
    Tab,
    Tabs,
    TextField
} from '@mui/material';
import './LoginRegister.css';
import axios from 'axios';

class LoginRegister extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
        tab: 0,
        errorMessage: null,
     };
  }

  handleTabChange = (event, newTab) => {
    this.setState({ tab: newTab });
  };

  handleLogin = (event) => {
    event.preventDefault();
    axios.post(`http://localhost:3000/admin/login`, {
        login_name: event.target.elements.login_name.value,
        password: event.target.elements.password.value
    })
    .then((response) => {
        if (response && response.data) { // idk why this is here but it's working 
            this.props.newLogin(response.data); // if so, set the state to be loggedInUser = user
            this.setState({ errorMessage: null }); // erase existing error 
            console.log("handleLogin: Login successful!");
            this.props.onnewCurrentUser(response.data);
            console.log("handleLogin: set current user to ", response.data);
            this.props.setDisplaying("userDetails");
            console.log("handleLogin: setDisplaying to userDetails");
        }
    })
    .catch((error) => {
        this.setState({ errorMessage: error.response.data });
    });    
  };

  handleRegister = (event) => {
    event.preventDefault();
    axios.post(`http://localhost:3000/user`, {
        first_name: event.target.elements.first_name.value,
        last_name: event.target.elements.last_name.value,
        location: event.target.elements.location.value, 
        description: event.target.elements.description.value,
        occupation: event.target.elements.occupation.value,
        login_name: event.target.elements.login_name.value,
        password: event.target.elements.password.value,
        confirmPassword: event.target.elements.confirmPassword.value
    })
    .then((response) => {
        this.props.newLogin(response.data); // if so, set the state to be loggedInUser = user
        this.setState({ errorMessage: null }); // erase existing error 
        console.log("handleRegister: Registration successful!");
        this.props.onnewCurrentUser(response.data);
        console.log("handleLogin: set current user to ", response.data);
        this.props.setDisplaying("userDetails");
        console.log("handleLogin: setDisplaying to userDetails");
    })
    .catch((error) => {
        this.setState({ errorMessage: error });
    });
};
  
  render() {
    return (
        <Container className="main" maxWidth="lg">
            <Box display="flex" justifyContent="center" >
                <Tabs value={this.state.tab} onChange={this.handleTabChange}>
                    <Tab label="Login" />
                    <Tab label="Register" />
                </Tabs>
            </Box>
            <Box mt={3}> 
            {this.state.tab === 0 && (
                <form onSubmit={this.handleLogin}>
                <TextField name="login_name" label="Login Name" variant="outlined" margin="normal" fullWidth required />
                <TextField name="password" label="Password" type="password" variant="outlined" margin="normal" fullWidth required />
                <Button variant="contained" color="primary" fullWidth type="submit" >
                    Log In
                </Button>
                </form>
            )}
            {this.state.tab === 1 && (
                <form onSubmit={this.handleRegister}>
                <TextField name="first_name" label="First Name" variant="outlined" margin="normal" fullWidth required />
                <TextField name="last_name" label="Last Name" variant="outlined" margin="normal" fullWidth required />
                <TextField name="location" label="Location" variant="outlined" margin="normal" fullWidth required />
                <TextField name="description" label="Description" variant="outlined" margin="normal" fullWidth required />
                <TextField name="occupation" label="Occupation" variant="outlined" margin="normal" fullWidth required />
                <TextField name="login_name" label="Login Name" variant="outlined" margin="normal" fullWidth required />
                <TextField name="password" label="Password" type="password" variant="outlined" margin="normal" fullWidth required onChange={this.handlePasswordChange} />
                <TextField name="confirmPassword" label="Confirm Password" type="password" variant="outlined" margin="normal" fullWidth required onChange={this.handleConfirmPasswordChange} />
                <Button variant="contained" color="primary" fullWidth type="submit" >
                    Register Me
                </Button>
                </form>
            )}
            </Box>
            {this.state.errorMessage !== null && (
            <Alert severity="error">
                <AlertTitle>Error</AlertTitle>
                {this.state.errorMessage}
            </Alert>
            )}
        </Container>
    );
  }
}

export default LoginRegister;