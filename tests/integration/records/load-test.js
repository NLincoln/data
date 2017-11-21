import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';

import {module, test} from 'qunit';

import DS from 'ember-data';

var hasMany = DS.hasMany;
var belongsTo = DS.belongsTo;
var Post, Comment, Author, env;
var run = Ember.run;

module("integration/load - Loading Records", {
  beforeEach() {
    Post = DS.Model.extend({
      comments: hasMany({ async: true }),
      author: belongsTo({ async: true }),
    });

    Comment = DS.Model.extend();
    Author = DS.Model.extend();

    env = setupStore({ post: Post, comment: Comment, author: Author });
  },

  afterEach() {
    run(env.container, 'destroy');
  }
});

test("When loading a record fails, the isLoading is set to false", function(assert) {
  env.adapter.findRecord = function(store, type, id, snapshot) {
    return Ember.RSVP.reject();
  };

  run(function() {
    env.store.findRecord('post', 1).then(null, assert.wait(function() {
      // store.recordForId is private, but there is currently no other way to
      // get the specific record instance, since it is not passed to this
      // rejection handler
      var post = env.store.recordForId('post', 1);

      assert.equal(post.get("isLoading"), false, "post is not loading anymore");
    }));
  });
});

test('When a relationship fails to load we dont do Bad Things', function(assert) {
  env.adapter.findBelongsTo = (store, snapshot, url) => {
    return Ember.RSVP.reject();
  };
  env.adapter.findRecord = () => Ember.RSVP.reject();
  return run(() => {
    env.store.push({
      data: {
        type: 'post',
        id: '1',
        relationships: {
          comments: {
            data: []
          },
          author: {
            data: {
              id: '2',
              type: 'author'
            }
          }
        }
      }
    });
    const post = env.store.peekRecord('post', 1)
    return post.get('author')
    .then(() => {
      assert.ok(false, 'Should not be called');
    })
    .catch(() => {
      assert.equal(post.get('author.id'), '2', 'author id should still be 2');
    });
  })

});
