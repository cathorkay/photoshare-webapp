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
import { Link } from "react-router-dom";
import axios from 'axios';
import AddComment from '../commenting/AddComment';
import './userPhotos.css';
import '../../styles/cards.css';

class OnePhoto extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        photo: null,
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
        const { photo_id } = this.props;
    
        axios.get(`http://localhost:3000/photo/${photo_id}`)
        .then((response) => {
            const photo = response.data;
            this.setState({ photo, isLoading: false });
        })
        .catch((error) => {
            console.log(error);
        });
    }
  
    updatePhotoComments = (newComment, photoId) => {
        this.setState(prevState => {
            if (prevState.photo._id === photoId) {
            const updatedPhoto = {
                ...prevState.photo,
                comments: [...prevState.photo.comments, newComment],
            };
            return { photo: updatedPhoto };
            }
            return prevState;
        });
    };

    deletePhoto = (photo_id) => {
        axios.delete(`http://localhost:3000/deletePhoto/${photo_id}`)
         .then(() => {
            this.setState({ photo: null });
         })
         .catch((err) => {
            console.log(err);
         });
    };

    deleteComment = (photo_id, comment_id) => {
        axios.delete(`http://localhost:3000/deleteComment/${photo_id}/${comment_id}`)
          .then(() => {
            this.setState(prevState => {
              if (prevState.photo._id === photo_id) {
                const updatedComments = prevState.photo.comments.filter((comment) => comment._id !== comment_id);
                const updatedPhoto = { ...prevState.photo, comments: updatedComments };
                return { photo: updatedPhoto };
              }
              return prevState;
            });
          })
          .catch((err) => {
            console.log(err);
          });
    };

  render() {

    const renderCommentWithMentions = (commentText) => {
      const mentionRegex = /@\[(.+?)\]\((.+?)\)/g;
      let result;
      let lastIndex = 0;
      const parts = [];
      result = mentionRegex.exec(commentText);
      while (result !== null) {
        const textBeforeMention = commentText.slice(lastIndex, result.index);
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
      }
      parts.push(commentText.slice(lastIndex));
      return parts;
    };

    if (this.state.isLoading) {
      return <div>Loading...</div>;
    } 

    const photo = this.state.photo;

    return (
      <div>
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
      </div>
    );
  }
}

export default OnePhoto;