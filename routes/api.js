'use strict';

function uniqueId() {
  let namespace = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return namespace.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function replyCount(replies) {
  return replies.filter(reply => reply.thread_id === thread._id).length;
}

const replies = [];
const boards = {};

module.exports = function (app) {
  app
    .route("/api/threads/:board")
    .get(function (req, res) {
      const board = req.params.board;
      if (boards[board]) {
        res.json(boards[board].map(thread => {
          return {
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: thread.replies.slice(0, 3).map(reply => {
              return {
                _id: reply._id,
                text: reply.text,
                created_on: reply.created_on
              };
            })
          };
        }));
      } else {
        res.json([]);
      }
    })
    .post(function (req, res) {
      let threadData = req.body;
      let board = req.params.board;
      let thread = {
        _id: uniqueId(),
        text: threadData.text,
        created_on: new Date(Date.now()).toISOString(),
        bumped_on: new Date(Date.now()).toISOString(),
        reported: false,
        delete_password: threadData.delete_password,
        replies: [],
        reply_count: replyCount(replies),
      };

      // Create a new board if it doesn't exist
      if (!boards[board]) {
        boards[board] = [];
      }

      // Add the new thread to the board's threads array
      boards[board].push(thread);

      res.json(thread);
    })
    .put(function (req, res) {
      let board = req.params.board;
      let thread_id = req.body.thread_id;
      let thread = boards[board].find((thread) => thread._id === thread_id);
      if (thread) {
        thread.reported = true;
        res.send("reported");
      } else {
        res.send("thread not found");
      }
    })
    .delete(function (req, res) {
      let board = req.params.board;
      let thread_id = req.body.thread_id;
      let delete_password = req.body.delete_password;
      let thread = boards[board].find((thread) => thread._id === thread_id);
      if (thread.delete_password === delete_password) {
        boards[board] = boards[board].filter((thread) => thread._id !== thread_id);
        res.send("success");
      } else {
        res.send("incorrect password");
      }
    });
 
  app.route("/api/replies/:board")
    .get(function (req, res) {
      let board = req.params.board;
      let thread_id = req.query.thread_id;
      let thread = boards[board].find((thread) => thread._id === thread_id);
      if (thread) {
        let threadData = { ...thread };
        delete threadData.delete_password;
        delete threadData.reported;
        let replies = thread.replies.map((reply) => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on,
        }));
        res.json({ ...threadData, replies });
      } else {
        res.json({ error: "Thread not found" });
      }
    })
    .post(function (req, res) {
      let board = req.params.board;
      let threadData = req.body;
      let thread_id = threadData.thread_id;
      let text = threadData.text;
      let delete_password = threadData.delete_password;

      let reply = {
        _id: uniqueId(),
        text: text,
        created_on: new Date(Date.now()).toISOString(),
        delete_password: delete_password,
        reported: false
      };

      // Find the thread and add the reply to the replies array
      let thread = boards[board].find(thread => thread._id === thread_id);
      if (thread) {
        thread.replies.push(reply);
        thread.bumped_on = reply.created_on;
        res.json(reply);
      } else {
        res.status(404).json({ error: "Thread not found" });
      }
    })
    .put(function (req, res) {
      let board = req.params.board;
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      let thread = boards[board].find(thread => thread._id === thread_id);
      if (thread) {
        let reply = thread.replies.find(reply => reply._id === reply_id);
        if (reply) {
          reply.reported = true;
          res.send("reported");
        } else {
          res.send("reply not found");
        }
      } else {
        res.send("thread not found");
      }
    })
    .delete(function (req, res) {
      let board = req.params.board;
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      let delete_password = req.body.delete_password;
      let thread = boards[board].find(thread => thread._id === thread_id);
      if (thread) {
        let reply = thread.replies.find(reply => reply._id === reply_id);
        if (reply && reply.delete_password === delete_password) {
          reply.text = "[deleted]";
          res.send("success");
        } else {
          res.send("incorrect password");
        }
      } else {
        res.send("reply not found");
      }
    });  
};
