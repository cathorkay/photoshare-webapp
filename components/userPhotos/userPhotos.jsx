import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  IconButton,
  List,
  ListItem,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { MentionsInput, Mention } from 'react-mentions';
import { Link } from "react-router-dom";
import axios from 'axios';
import AddComment from '../commenting/AddComment';
import './userPhotos.css';
import '../../styles/cards.css';

/**
 * Define UserPhotos, a React componment of CS142 project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      picArr: [],
      isLoading: true,
    };
  }

  isOwner = (user_id) => {
    return this.props.loggedInUser._id === user_id;
  };  

  handleClick = (user_id) => {
    let user = {};
    axios.get(`http://localhost:3000/user/${user_id}`)
      .then((response) => {
        user = response.data;
      })
      .catch((error) => {
        console.log(error);
      });
    this.props.onnewCurrentUser(user);
    this.props.setDisplaying('userDetails');
  };

  componentDidMount() { 
    axios.all([
      axios.get(`http://localhost:3000/photosOfUser/${this.props.match.params.userId}`),
      axios.get(`http://localhost:3000/user/list`),
    ])
    .then(
      axios.spread((photosResponse, usersResponse) => {
        const picArr = photosResponse.data;
        const users = usersResponse.data.map((user) => ({
          id: user._id,
          display: `${user.first_name} ${user.last_name}`,
        }));
        this.setState({ picArr, users, isLoading: false });
      })
    )
    .catch((error) => {
      console.log(error);
    });
  }
 

  updatePhotoComments = (newComment, photoId) => {
    console.log("updatePhotoComments: newComment arg -->", newComment)
    console.log("updatePhotoComments: photoId arg -->", photoId)
    this.setState(prevState => {
      const updatedPhotos = prevState.picArr.map(photo => {
        if (photo._id === photoId) {
          return {
            ...photo,
            comments: [...photo.comments, newComment],
          };
        }
        return photo;
      });
      console.log("updatePhotoComments: updatedPhotos -->", updatedPhotos)
      return { picArr: updatedPhotos };
    });
  };
  

  deletePhoto = (photo_id) => {
    axios.delete(`http://localhost:3000/deletePhoto/${photo_id}`)
      .then(() => {
        const updatedPics = this.state.picArr.filter((pic) => pic._id !== photo_id);
        this.setState({ picArr: updatedPics });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  deleteComment = (photo_id, comment_id) => {
    axios.delete(`http://localhost:3000/deleteComment/${photo_id}/${comment_id}`)
      .then(() => {
        const updatedPics = this.state.picArr.map((pic) => {
          if (pic._id !== photo_id) {
            return pic; // return pic unchanged
          }
          const updatedComments = pic.comments.filter((comment) => comment._id !== comment_id);
          return { ...pic, comments: updatedComments };
        });
        this.setState({ picArr: updatedPics });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  render() {

    const renderCommentWithMentions = (commentText) => {

      if (commentText === undefined) {
        console.warn("renderCommentWithMentions: commentText is undefined");
        return null;
      }

      console.log("renderCommentWithMentions: commentText arg -->", commentText)
      const mentionRegex = /@\[(.+?)\]\((.+?)\)/g;
      let result;
      let lastIndex = 0;
      const parts = [];
      while ((result = mentionRegex.exec(commentText)) !== null) {
        const textBeforeMention = commentText.slice(lastIndex, result.index);
        console.log("renderCommentWithMentions: textBeforeMention -->", textBeforeMention)
        lastIndex = mentionRegex.lastIndex;
        parts.push(textBeforeMention);
        const displayName = result[1];
        const userId = result[2];
        parts.push(
          <Link
          key={userId}
          to={`/users/${userId}`}
          onClick={() => {
            this.handleClick(userId);
          }}
          >
            {`@${displayName}`}
          </Link>
        );
        console.log("renderCommentWithMentions: parts array during while loop -->", parts)
      }
      console.log("renderCommentWithMentions: parts array AFTER while loop -->", parts)
      parts.push(commentText.slice(lastIndex));
      console.log("renderCommentWithMentions: final parts array:", parts)
      return parts;
    };

    if (this.state.isLoading) {
      return <div>Loading...</div>;
    } 

    const photoObjects = this.state.picArr;
    const photos = photoObjects.map(photo => (
      <ListItem key={photo._id}>
        <Card className="card-container-fullwidth" sx={{ maxWidth: '100%', position: 'relative' }}>
          {this.isOwner(photo.user_id) && (
            <IconButton
              edge="end"
              color="info"
              sx={{ position: 'absolute', top: 0, right: 10 }}
              onClick={() => this.deletePhoto(photo._id)}
            >
              <DeleteIcon/>
            </IconButton>
          )}
          <CardMedia
            component="img"
            className="card-media"
            image={`/images/${photo.file_name}`}
          />
          <CardContent>
            <Typography variant="caption">
              {`Photo Added: ${photo.date_time}`}
            </Typography>
            <List>
              {photo.comments && photo.comments.map(comment => (
                <ListItem key={comment._id}>
                  <Typography variant="body2" component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} >
                    {comment.user && (
                      <Link
                        to={`/users/${comment.user._id}`}
                        onClick={() => {
                          this.handleClick(comment.user._id);
                        }}
                        sx={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                      >
                        {comment.user.first_name} {comment.user.last_name}
                      </Link>
                    )}
                    {": "}
                    {renderCommentWithMentions(comment.comment)}
                    {this.isOwner(comment.user._id) && (
                      <IconButton
                        edge="end"
                        onClick={() => this.deleteComment(photo._id, comment._id)}
                      >
                        <DeleteIcon/>
                      </IconButton>
                    )}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <AddComment
              toThisPhotoID={`${photo._id}`}
              loggedInUser={this.props.loggedInUser}
              updatePhotoComments={(newComment) => this.updatePhotoComments(newComment, photo._id)}
            />
          </CardContent>
        </Card>
      </ListItem>
    ));
    return (
      <div>
        {photos}
      </div>
    );
  }
}

export default UserPhotos;