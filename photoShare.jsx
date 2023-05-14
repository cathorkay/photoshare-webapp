import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';
import {
  Grid, Paper
} from '@mui/material';
import './styles/main.css';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import LoginRegister from './components/loginRegister/LoginRegister';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      currentUser: null, 
      displaying: 'home', 
      loggedInUser: null 
    };
  }

  setCurrentUser = (newCurrentUser) => {
    this.setState({currentUser: newCurrentUser});
  };

  setDisplaying = (nowDisplaying) => {
    this.setState({ displaying: nowDisplaying });
  };

  setLoggedInUser = (newLogin) => {
    this.setState({ loggedInUser: newLogin });
  };

  render() {
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <TopBar 
            currentUser={this.state.currentUser} 
            displaying = {this.state.displaying} 
            setDisplaying = {this.setDisplaying} 
            loggedInUser = {this.state.loggedInUser} 
            setLoggedInUser = {this.setLoggedInUser}
          />
        </Grid>
        <div className="cs142-main-topbar-buffer"/>

        { this.state.loggedInUser && (
          <Grid item sm={3}>
            <Paper className="cs142-main-grid-item">
              <UserList 
                onnewCurrentUser={this.setCurrentUser} 
                setDisplaying = {this.setDisplaying} 
              />
            </Paper>
          </Grid>
        )}

        <Grid item sm={9}>
          <Paper className="cs142-main-grid-item" >
            <Switch>

            <Route exact path="/">
              {this.state.loggedInUser ? (
                <Redirect to={`/user/${this.state.loggedInUser._id}`} />
              ) : (
                <LoginRegister
                  onnewCurrentUser={this.setCurrentUser}
                  newLogin={this.setLoggedInUser}
                  setDisplaying={this.setDisplaying}
                />
              )}
            </Route>
            <Route exact path="/user/:userId" render={({ match }) => (
              <UserDetail
                setLoggedInUser={this.setLoggedInUser}
                onNewCurrentUser={this.setCurrentUser}
                currentUser={this.state.currentUser}
                loggedInUser={this.state.loggedInUser}
                setDisplaying={this.setDisplaying}
                match={match}
              />
            )} />

            {
              this.state.loggedInUser ?
                (
                  <Route
                    path="/users/:userId"
                    render={(props) => (
                      <UserDetail
                        {...props}
                        setLoggedInUser={this.setLoggedInUser}
                        onNewCurrentUser={this.setCurrentUser}
                        currentUser={this.state.currentUser}
                        loggedInUser={this.state.loggedInUser}
                        setDisplaying={this.setDisplaying}
                      />
                    )}
                  />
                )
                : 
                <Redirect path="/users/:id" to="/login-register" />
            }

            {
              this.state.loggedInUser ?
                (
                  <Route
                    path="/photos/:userId"
                    render={ props => (
                      <UserPhotos 
                        {...props} 
                        onnewCurrentUser={this.setCurrentUser} 
                        setDisplaying={this.setDisplaying}
                        loggedInUser={this.state.loggedInUser}
                      />
                    )}
                  />
                )
                : 
                <Redirect path="/photos/:userId" to="/login-register" />
            }

            {
              this.state.loggedInUser ?
                (
                  <Route
                    path="/users" 
                    component={UserList} 
                    onnewCurrentUser={this.setCurrentUser} 
                    setDisplaying={this.setDisplaying}
                  />
                )
                : 
                <Redirect path="/users" to="/login-register" />
            }

            </Switch>
          </Paper>
        </Grid>
      </Grid>
      </div>
      </HashRouter>
    );
  }
}


ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);
