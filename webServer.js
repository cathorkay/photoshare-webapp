/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to 127.0.0.1:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const console = require('console');


var async = require('async');

var express = require('express');
var app = express();

const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");

app.use(session({secret: "secretKey", resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

// XXX - Your submission should work without this line. Comment out or delete this line for tests and before submission!
// var cs142models = require('./modelData/photoApp.js').cs142models;
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';
    
    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', async function (request, response) {
    if (!request.session.loggedIn) response.status(401).send("User is not logged in");
    try {
        const usersFromDB = await User.find({}, '_id first_name last_name');
        response.status(200).send(usersFromDB);
    } catch(error) {
        response.status(400).send("Could not fetch users... 👪❓");
    }
});

/* P7 1️⃣
 * URL /admin/login - Login a user
 */
app.post('/admin/login', async function (request, response) {
    try {
        const login_name = request.body.login_name;
        const password = request.body.password;
        const user = await User.findOne({ login_name: login_name });
        if (user) {
            if (user.password === password) { // if the password matches that of user in db 
                request.session.loggedIn = true;
                request.session.user = user;
                response.status(200).send(user);
            } else {
                response.status(400).send("Incorrect password");
            }
        } else {
            response.status(400).send("Login Name doesn't belong to a registered account");
        }
    } catch(error) {
        response.status(500).send("Internal server error");
    }
});

/* P7 1️⃣
 * URL /admin/logout - Log a user out
 */
app.post('/admin/logout', function (request, response) {
    if (request.session.loggedIn) {
        request.session.destroy(function(error) {
            console.log(error);
        });
        response.status(200).send("User logged out successfully");
    } else {
        response.status(400).send("No user logged in.");
    }
});

/* P7 2️⃣
 * URL /commentsOfPhoto/:photo_id - Add a comment to the photo whose id is photo_id
 */

app.post('/commentsOfPhoto/:photo_id', async function (request, response) {
    if (!request.session.loggedIn) {
        response.status(400).send("User must be logged in");
        return;
    }
    if (request.body.comment === "") {
        response.status(400).send("Comment cannot be empty!");
        return;
    }
    const photo_id = request.params.photo_id;
    Photo.findOne({ _id: photo_id }, function(err, photo) {
        if (err) {
            response.status(400).send("Photo not found.");
            return;
        }
        const currComments = photo.comments;
        if (!currComments) {
            photo.comments = [];
        }
        photo.comments.push({
            comment: request.body.comment,
            user_id: request.session.user._id,
            date_time: new Date().toISOString(),
        });
        photo.save()
        .then(() => {
            response.status(200).send();
        })
        .catch((e) => {
            console.error(e);
            response.status(500).send("Unable to add comment.");
        });
    });
});
  

/* P7 3️⃣
 * URL /photos/new - Add a new photo
 */
const processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
app.post('/photos/new', function (request, response) { 
    try {
        if (!request.session.loggedIn) {
            return response.status(401).send("User is not logged in");
        }

        processFormBody(request, response, function (err) {
            if (err || !request.file) {
                return response.status(400).send("Error: No file specified!");
            }

            if (request.file.fieldname !== 'uploadedphoto') {
                return response.status(400).send("Wrong field name!");
            }
          
            const timestamp = new Date().valueOf();
            const filename = 'U' +  String(timestamp) + request.file.originalname;
          
            fs.writeFile("./images/" + filename, request.file.buffer, function (error) {
                if (error) {
                    return response.status(500).send("Writing file failed");
                }
                Photo.create({
                    file_name: filename,
                    user_id: request.session.user._id,
                    comments: [],
                }, function(err2, photo) {
                    if (err2) { 
                        return response.status(400).send("Error creating Mongoose photo");
                    }
                    console.log("SUCCESSFULLY created photo");
                    photo.save();
                    return response.status(200).send("Photo uploaded successfully");
                });
                return null; 
            });
            return null; 
        });
        return null;

    } catch(error) {
        return response.status(400).send("Bad request");
    }
});


/* P7 4️⃣
 * URL /user - Allows a user to register.
 */

app.post('/user', async function (request, response) {
    const first_name = request.body.first_name;
    const last_name = request.body.last_name;
    const location = request.body.location;
    const description = request.body.description;
    const occupation = request.body.occupation;
    const login_name = request.body.login_name;
    const password = request.body.password;
    const confirmPassword = request.body.confirmPassword;

    User.findOne({ login_name: login_name }, async function (err, info) {
        if (err) {
            console.log("Login Name invalid: ", err);
            return;
        }
        if (info) {
            response.status(400).send("Login Name already exists.");
            return;
        }
        if (password !== confirmPassword) {
            response.status(400).send("Passwords must match");
            return;
        }
        const newUser = {
            first_name: first_name,
            last_name: last_name,
            location: location,
            description: description,
            occupation: occupation,
            login_name: login_name,
            password: password
        };
        User.create(newUser, function(error, user) {
            if (error) {
                console.log("Error creating new user: ", error);
                response.status(400).send(JSON.stringify(error));
                return;
            }
            request.session.loggedIn = true;
            request.session.user = user;
            response.status(200).send(user);
        });
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', async function (request, response) {
    if (!request.session.loggedIn) response.status(401).send("User is not logged in");
    try {
        const user = await User.findById(request.params.id);
        const userJSON = JSON.parse(JSON.stringify(user)); // turn into JS object
        delete userJSON.__v; // remove __v
        response.status(200).send(userJSON);
    } catch(error) {
        response.status(400).send("User not found 🙍❓");
    }
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', async function (request, response) {
    if (!request.session.loggedIn) response.status(401).send("User is not logged in");
    const id = request.params.id;
    try {
        // remove the __v field
        const photosWithout__v = await Photo.find({ user_id: id }).select('-__v'); // minus the __v field 
        // replace user_id with bare minimum user obj
        const photosToBeCleaned = photosWithout__v.map(async (photo) => {
            const comments = photo.comments.map(async (c) => {
                // get the user who wrote the comment
                let commentAuthor = {};
                const commentAuthorPromise = await new Promise((resolve, reject) => {
                    User.findById(c.user_id, (err, user) => {
                        if (err) {
                            reject(err);
                        } else {
                            commentAuthor = {...user.toObject()};
                            // delete extra fields
                            delete commentAuthor.location;
                            delete commentAuthor.occupation;
                            delete commentAuthor.description;
                            delete commentAuthor.__v;
                            resolve(commentAuthor);
                        }
                    });
                });
                commentAuthor = await commentAuthorPromise;
                const comment = {
                    ...c.toObject(),
                    user: commentAuthor
                };
                delete comment.user_id;
                return comment;
            });
            return {
                ...photo.toObject(),
                comments: await Promise.all(comments)
            };
        });
        const photos = await Promise.all(photosToBeCleaned);
        response.status(200).send(photos);
    } catch(error) {
        response.status(400).send("Could not get photos from that user id... 📸❓");
    }
});

app.get('/photo/:photo_id', async function (request, response) {
    if (!request.session.loggedIn) response.status(401).send("User is not logged in");
    const photo_id = request.params.photo_id;
    try {
      const photo = await Photo.findById(photo_id).select('-__v');
      if (!photo) {
        response.status(404).send("Photo not found 📸❓");
        return;
      }
      const comments = photo.comments.map(async (c) => {
        let commentAuthor = {};
        const commentAuthorPromise = await new Promise((resolve, reject) => {
          User.findById(c.user_id, (err, user) => {
            if (err) {
              reject(err);
            } else {
              commentAuthor = { ...user.toObject() };
              delete commentAuthor.location;
              delete commentAuthor.occupation;
              delete commentAuthor.description;
              delete commentAuthor.__v;
              resolve(commentAuthor);
            }
          });
        });
        commentAuthor = await commentAuthorPromise;
        const comment = {
          ...c.toObject(),
          user: commentAuthor
        };
        delete comment.user_id;
        return comment;
      });
  
      const cleanedPhoto = {
        ...photo.toObject(),
        comments: await Promise.all(comments)
      };
  
      response.status(200).send(cleanedPhoto);
    } catch (error) {
      response.status(400).send("Could not get photo by id... 📸❓");
    }
});  


app.delete('/deletePhoto/:photo_id', async (request, response) => {
    try {
        const photo = await Photo.findByIdAndDelete(request.params.photo_id);
        if (!photo) {
            return response.status(400).send("Photo not found ❓");
        }
        response.status(200).send("Photo successfully deleted");
    } catch(error) {
        response.status(500).send("Error deleting photo");
    }
})

app.delete('/deleteComment/:photo_id/:comment_id', async (request, response) => {
    try {
        console.log("Request received for deleting comment: ", request);
        const { photo_id, comment_id } = request.params;
        const photo = await Photo.findById(photo_id);
        if (!photo) {
            return response.status(404).send("Photo not found");
        }
        const updatedComments = photo.comments.filter(
            (comment) => comment._id.toString() !== comment_id
            );
            if (photo.comments.length === updatedComments.length) {
                return response.status(404).send("Comment not found");
            }
            photo.comments = updatedComments;
            await photo.save();
            response.status(200).send("Comment successfully deleted");
        } catch(err) {
            console.log('Error in /deleteComment/:photo_id/:comment_id:', err);
            response.status(500).send("Server error");
        }
    })
    
app.post('/addComment/:photo_id', async (request, response) => {
    try {
        const { photo_id } = request.params;
        const { comment, user_id, mentions } = request.body;

        const photo = await Photo.findById(photo_id);
        if (!photo) {
            return response.status(404).send("Photo not found");
        }

        let formattedComment = comment;
        mentions.forEach(mention => {
            const mentionTag = `@(${mention.display})[${mention.id}]`;
            formattedComment = formattedComment.replace(`@${mention.display}`, mentionTag);
        });

        const newComment = {
            comment: formattedComment,
            user_id,
            date_time: new Date().toISOString(),
            mentions: mentions || [],
        };

        photo.comments.push(newComment);
        await photo.save();

        const populatedPhoto = await Photo.findById(photo_id).populate(`comments.${photo.comments.length - 1}.user_id`, 'first_name last_name');
        const populatedComment = populatedPhoto.comments[populatedPhoto.comments.length - 1];

        console.log('Populated comment:', populatedComment);
        response.status(200).send(populatedComment);
    } catch (error) {
        console.error('Error details:', error);
        response.status(500).send("Server error");
    }
});
    
    
app.delete('/deleteUser/:user_id', async (request, response) => {
    try {
        const user = await User.findByIdAndDelete(request.params.user_id);
        if (!user) {
            return response.status(400).send("User not found");
        }
        await Photo.deleteMany({ user_id: request.params.user_id });
        await Photo.updateMany({}, {$pull: { comments: {user_id: request.params.user_id } }});
        response.status(200).send("User account successfully deleted");
    } catch(error) {
        response.status(500).send("Error deleting user account");
    }
})

app.get('/user/:userId/topPhotos', async (request, response) => {
    const userId = request.params.userId;
    try {
        const mostRecentPhoto = await Photo.findOne({ user_id: userId }).sort({ date_time: -1 }).exec();
        const mostCommentedPhoto = await Photo.aggregate([
            { $match: { user_id: mongoose.Types.ObjectId(userId)}},
            { $project: { num_comments: { $size: '$comments' }, user_id: 1, file_name: 1, date_time: 1 }},
            { $sort: { num_comments: -1 } },
            { $limit: 1 },
        ]).exec();
        response.status(200).send({ mostRecentPhoto: mostRecentPhoto, mostCommentedPhoto: mostCommentedPhoto[0] });
    } catch (error) {
        response.status(500).send("Error deleting user account");
    }
});

app.get('/user/:userId/mentionedPhotos', function (request, response) {
    const { userId } = request.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        response.status(400).send('Invalid user ID');
      return;
    }
    Photo.find({ 'comments.mentions': userId })
      .populate('user_id', 'first_name last_name')
      .exec(function (err, photos) {
        if (err) {
            response.status(500).send('Error fetching mentioned photos');
          return;
        }
        response.status(200).send(photos);
      });
  });

app.post('/photo/:photoId/mention/:userId', function (request, response) {
    const { photoId, userId } = request.params;
    if (!mongoose.Types.ObjectId.isValid(photoId) || !mongoose.Types.ObjectId.isValid(userId)) {
        response.status(400).send('Invalid photo or user ID');
      return;
    }
    Photo.findOne({ _id: photoId }, function (err, photo) {
        if (err || !photo) {
            response.status(404).send('Photo not found');
            return;
        }
        // Find the comment that contains the mention
        const mentionRegex = new RegExp(`\\@\\[(.+?)\\]\\(${userId}\\)`);
        const comment = photo.comments.find(c => mentionRegex.test(c.comment));

        if (!comment) {
            response.status(404).send('Comment with mention not found');
            return;
        }
        // Add the mentioned user to the mentions array if not already present
        if (!comment.mentions.includes(userId)) {
            comment.mentions.push(userId);
        }
        // Save the updated photo
        photo.save(function (err) {
            if (err) {
                response.status(500).send('Failed to update photo');
                return;
            }
            response.status(200).send('Mention added successfully');
        });
    });
});  

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://127.0.0.1:' + port + ' exporting the directory ' + __dirname);
});