import React from 'react';
import {
  Divider,
  List,
  ListItem,
  ListItemText
}
from '@mui/material';
import { Link } from 'react-router-dom';
import './userList.css';
import axios from 'axios';

/**
 * Define UserList, a React component of CS142 project #5
 */
class UserList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      users: []
    };
  }

  handleClick = (user) => {
    axios.get(`http://localhost:3000/user/${user._id}`) // Get user (full object) from db
    .then((response) => {
      this.props.onnewCurrentUser(response.data); // make that the currUser
    })
    .catch((error) => {
      console.log(error);
    });

    this.props.setDisplaying('userDetails');
  };

  componentDidMount() { 
    axios.get('http://localhost:3000/user/list')
      .then((response) => {
        const users = response.data;
        this.setState({ users });
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  render() {

    const { users } = this.state;

    const userItems = users.map(user => (
      <div key={user._id}>
        <ListItem component={Link} to={"/users/" + user._id} onClick={() => this.handleClick(user)}>
          <ListItemText primary={user.first_name + " " + user.last_name}/>
        </ListItem>
        <Divider/>
      </div>
    ));
    return (
      <div>
        <List component="nav">
          {userItems}
        </List>
      </div>
    );
  }
}

export default UserList;