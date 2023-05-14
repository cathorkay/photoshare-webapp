import React from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia
} from '@mui/material';
import './userDetail.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/cards.css';

/**
 * Define UserDetail, a React component of CS142 project #5
 */
class UserDetail extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      mostRecentPhoto: null,
      mostCommentedPhoto: null,
      mentionedPhotos: [],
      userDetails: {},
    };
  }
  
  componentDidMount() { // when it loads for the first time
    axios.get(`http://localhost:3000/user/${this.props.match.params.userId}`)
      .then((response) => {
        this.props.onNewCurrentUser(response.data);
      })
      .catch((error) => {
        console.log(error);
      });

    axios.get(`http://localhost:3000/user/${this.props.match.params.userId}/topPhotos`)
      .then((response) => {
        this.setState({
          mostRecentPhoto: response.data.mostRecentPhoto,
          mostCommentedPhoto: response.data.mostCommentedPhoto
        });
      })
      .catch((error) => {
        console.log(error);
      });

    axios.get(`http://localhost:3000/user/${this.props.match.params.userId}/mentionedPhotos`)
      .then((response) => {
        this.setState({ mentionedPhotos: response.data });
        console.log("Mentioned photos: ", this.state.mentionedPhotos); // Add this line
      })
      .catch((error) => {
        console.log(error);
      });
    
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.userId !== this.props.match.params.userId) {
      axios.get(`http://localhost:3000/user/${this.props.match.params.userId}`)
        .then((response) => {
          this.props.onNewCurrentUser(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
  
      axios.get(`http://localhost:3000/user/${this.props.match.params.userId}/topPhotos`)
        .then((response) => {
          this.setState({
            mostRecentPhoto: response.data.mostRecentPhoto,
            mostCommentedPhoto: response.data.mostCommentedPhoto
          });
        })
        .catch((error) => {
          console.log(error);
        });

      axios.get(`http://localhost:3000/user/${this.props.match.params.userId}/mentionedPhotos`)
        .then((response) => {
          this.setState({ mentionedPhotos: response.data });
          console.log("Mentioned photos: ", this.state.mentionedPhotos); // Add this line
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  deleteAcc = () => {
    axios.delete(`http://localhost:3000/deleteUser/${this.props.match.params.userId}`)
      .then(() => {
        this.props.setLoggedInUser(null); // clear logged in user
        this.props.onNewCurrentUser(null); // clear current user 
        window.location.href = '/';
      })
      .catch((error) => {
        console.log(error);
      });
  };

  fetchUser = (user_id) => {
    axios.get(`http://localhost:3000/user/${user_id}`)
      .then((response) => {
        this.setState((prevState) => ({
          userDetails: {
            ...prevState.userDetails,
            [user_id]: response.data,
          },
        }));
      })
      .catch((error) => {
        console.log(error);
      });
  };  
  
  renderUserDetails = (user_id) => {
    const user = this.state.userDetails[user_id];
    if (user) {
      return `${user.first_name} ${user.last_name}`;
    }
    this.fetchUser(user_id); // Fetch user details if not available in the state
    return "Loading..."; // Show a loading message while fetching the user details
  };    
  render() {
    let firstName = "";
    let lastName = "";
    let occupation = "";
    let description = "";
    let location = "";

    if (this.props.currentUser) {
      firstName = this.props.currentUser.first_name;
      lastName = this.props.currentUser.last_name;
      occupation = this.props.currentUser.occupation;
      description = this.props.currentUser.description;
      location = this.props.currentUser.location;
    }


    return (
      <div id="container">
        <Typography variant='h4'>{`${firstName} ${lastName}`}</Typography>
        <Typography variant='body1'>{`📍 ${location}`}</Typography>
        <Typography variant='body1'>{`💼 ${occupation}`}</Typography>
        <Typography variant='body1'>{`🗣️ ${description}`}</Typography>
        {this.state.mostRecentPhoto && (
          <Card className="card-container">
            <CardActionArea component={Link} to={`/photos/${this.props.match.params.userId}`}>
              <CardMedia
                component="img"
                height="140"
                image={`/images/${this.state.mostRecentPhoto.file_name}`}
                alt="Most recent"
              />
              <CardContent>
                <Typography variant="h5" component="div">
                  Most Recent Photo
                </Typography>
                <Typography variant="body2" >
                  Date: {new Date(this.state.mostRecentPhoto.date_time).toLocaleString()}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        )}
        {this.state.mostCommentedPhoto && (
          <Card className="card-container">
            <CardActionArea component={Link} to={`/photos/${this.props.match.params.userId}`}>
              <CardMedia
                component="img"
                height="140"
                image={`/images/${this.state.mostCommentedPhoto.file_name}`}
                alt="Most commented"
              />
              <CardContent>
                <Typography variant="h5" component="div">
                  Most Commented Photo
                </Typography>
                <Typography variant="body2" >
                  Date: {new Date(this.state.mostCommentedPhoto.date_time).toLocaleString()}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        )}

        {this.state.mentionedPhotos && this.state.mentionedPhotos.length > 0 ? (
          <div>
            <Typography variant="h5" component="div">
              Photos with @mentions
            </Typography>
            {this.state.mentionedPhotos.map((photo) => (
              <Card key={photo._id} className="card-container">
                <CardActionArea component={Link} to={`/photos/${photo.user_id}`}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={`/images/${photo.file_name}`}
                    alt="Mentioned photo"
                  />
                  <CardContent>
                    <Link
                      to={`/users/${photo.user_id}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      <Typography variant="body2">
                        {this.renderUserDetails(photo.user_id)}
                      </Typography>
                    </Link>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </div>
        ) : (
          <Typography variant="body1">No photos with @mentions found</Typography>
        )}



        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
          <Button
            variant="contained"
            color="info"
            component={Link}
            to={`/photos/${this.props.match.params.userId}`}
            onClick={() => this.props.setDisplaying('userPhotos')}
          >
            {`${firstName}'s Photos`}
          </Button>
        </Box>
          {this.props.loggedInUser && this.props.loggedInUser._id === this.props.match.params.userId && (          
            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={this.deleteAcc}
              >
                Delete Account
              </Button>
        </Box>
          )}
      </div>
    );
  }
}

export default UserDetail;