const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let threadId = "";
let replyId = "";

function updateThreadId(id) {
    threadId = id;
}

function updateReplyId(id) {
    replyId = id;
}

function accessThreadId() {
    return threadId;
}

function accessReplyId() {
    return replyId;
}

suite('Functional Tests', function () {

    suite('POST', function () {
        test('Creating a new thread: POST request to /api/threads/{board}', function (done) {
            chai.request(server)
                .post('/api/threads/test')
                .send({
                    text: 'Hello World',
                    delete_password: '123'
                })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    done();
                });
        });

        test('Creating a new reply: POST request to /api/replies/{board}', function (done) {
          chai.request(server)
            .post('/api/threads/test')
            .send({
              text: 'Hello World',
              delete_password: '123'
            })
            .end(function (err, res) {
              updateThreadId(res.body._id);
              chai.request(server)
                .post('/api/replies/test')
                .send({
                  thread_id: threadId,
                  text: 'Hello World',
                  delete_password: '123'
                })
                .end(function (err, res) {
                  assert.equal(res.status, 200);
                  done();
                });
            });
        });
    });

    suite('GET', function () {
        test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function (done) {
            chai.request(server)
                .get('/api/threads/test')
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isArray(res.body);
                    assert.ok(res.body.length <= 10);
                    res.body.forEach(function (thread) {
                        assert.ok(thread.replies.length <= 3);
                    });
                    done();
                });
        });

        test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function (done) {
            threadId = accessThreadId();
            chai.request(server)
                .get(`/api/replies/test?thread_id=${threadId}`)
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.isArray(res.body.replies);
                    updateReplyId(res.body.replies[0]._id);
                    done();
                });
        });
    });

    suite('PUT', function () {
        test('Reporting a thread: PUT request to /api/threads/{board}', function (done) {
            chai.request(server)
                .put('/api/threads/test')
                .send({
                    thread_id: '123',
                    report: true
                })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    done();
                });
        });

        test('Reporting a reply: PUT request to /api/replies/{board}', function (done) {
            chai.request(server)
                .put('/api/replies/test')
                .send({
                    thread_id: '123',
                    reply_id: '456',
                    report: true
                })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    done();
                });
        });
    });

    suite('DELETE', function () {
        test("Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password", function (done) {
          threadId = accessThreadId();
            chai
            .request(server)
            .delete("/api/replies/test")
            .send({
              thread_id: threadId,
              reply_id: "456",
              delete_password: "abc",
            })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, "incorrect password");
              done();
            });
        });

        test("Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password", function (done) {
            threadId = accessThreadId();
            replyId = accessReplyId();
            chai
            .request(server)
            .delete("/api/replies/test")
            .send({
              thread_id: threadId,
              reply_id: replyId,
              delete_password: "123",
            })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, "success");
              done();
            });
        });

        test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function (done) {
            threadId = accessThreadId();
            chai.request(server)
                .delete('/api/threads/test')
                .send({
                    thread_id: threadId,
                    delete_password: 'abc'
                })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'incorrect password');
                    done();
                });
        });

        test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function (done) {
            threadId = accessThreadId();
            chai.request(server)
                .delete('/api/threads/test')
                .send({
                    thread_id: threadId,
                    delete_password: '123'
                })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'success');
                    done();
                });
        });
    });

});
