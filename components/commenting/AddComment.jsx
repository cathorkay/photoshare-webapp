import React from 'react';
import {
  Button,
  Grid,
  TextField,
} from '@mui/material';
import { Mention, MentionsInput } from 'react-mentions';
import './addComment.css';
import axios from 'axios';

/**
 * Define addComment, a React componment of CS142 project #7
 */
class AddComment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comment: '',
      users: [],
      mentions: [],
    };
  }

  componentDidMount() { // when it loads for the first time
    axios.get(`http://localhost:3000/user/list`)
      .then((response) => {
        const users = response.data.map(user => ({
          id: user._id,
          display: `${user.first_name} ${user.last_name}`,
        }));
        this.setState({ users: users });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleAddComment = (event, photo_id) => {
    // console.log("handleAddComment: photo_id arg -->", photo_id)
    event.preventDefault();
    if (this.state.comment) {
      const commentData = {
        comment: this.state.comment,
        user_id: this.props.loggedInUser._id,
        mentions: this.state.mentions || [],
      };
      // console.log("handleAddComment: commentData object -->", commentData)
      console.log('handleAddComment: Sending mentions:', this.state.mentions);
      axios.post(`http://localhost:3000/addComment/${photo_id}`, commentData)
        .then((response) => {
          const newComment = response.data;
          // console.log("handleAddComment: newComment after POST request -->", newComment)
          newComment.user = this.props.loggedInUser;
          this.props.updatePhotoComments(newComment, photo_id);
          this.setState({ comment: "", mentions: [] });
          console.log('handleAddComment: this.state.mentions:', this.state.mentions);
        })      
        .catch((error) => {
          console.log(error);
        });
    }
  };

  render() {
    return (
      <div>
        <form onSubmit={(event) => this.handleAddComment(event, this.props.toThisPhotoID)}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={10}>
                <div className = "mentionsContainer">
                  <MentionsInput
                    name="commentInput"
                    value={this.state.comment}
                    onChange={(event, value, plainText, mentions) => {
                      console.log("onChange mentions:", mentions);
                      const extractedMentions = mentions.map(mention => mention.id);
                      this.setState({ comment: value, mentions: extractedMentions });
                    }}                    
                    className="mentionsInput"
                    placeholder="Write a comment"
                  >
                    <Mention
                      type="user"
                      trigger = "@"
                      data = {(search, callback) => {
                        const filteredUsers = this.state.users.filter((user) => 
                          user.display.toLowerCase().includes(search.toLowerCase())
                        );
                        callback(filteredUsers);
                      }}
                      renderSuggestion = {(suggestion, search, highlightedDisplay, index, focused) => (
                        <div className={`user ${focused ? 'focused' : ''}`}>
                          {highlightedDisplay}
                        </div>
                      )}
                      className = "mentionsMenu"
                    />
                  </MentionsInput>
                </div>
              </Grid>
              <Grid item xs={2}>
                <Button variant="contained" type="submit" sx={{ width: '100%' }}>
                Post
                </Button>
              </Grid>
            </Grid>
        </form>
      </div>
    );
  }
}

export default AddComment;