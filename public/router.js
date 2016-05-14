var App = Vue.extend({});

var router = new VueRouter();


var URL_BASE = 'http://seishun-api.pocke.me';
// var URL_BASE = 'http://192.168.100.246:3000';
function create_url(endpoint) {
  // TODO: ここを書き換えてURL作る
  // return '/api/guchi' + endpoint
  return URL_BASE + '/guchi/' + endpoint;
}

var MasterData = $.ajax({
  // /master_data は /guchi 下でないので、 create_url が使えない
  url: URL_BASE + '/master_data',
  method: 'POST',
});

Vue.component("g-header", {
  template: "#g-header",
  props: ['title', 'path'],
});

router.map({
  '/': {
    component: Vue.extend({
      created: function () {
        router.go('/guchis');
      }
    })
  },
  '/sign_in': {
    component: Vue.extend({
      template: '#sign_in',
      data: function () {
        return {
          name: ''
        };
      },
      methods: {
        sign_in: function () {
          var name = this.name;
          $.ajax({
            url: create_url('/sessions/sign_in'),
            data: JSON.stringify({name: name}),
          }).done(function (data) {
            setUser(data.data);
            router.go('/guchis');
          }).fail(function () {
            // ほとんどの場合ユーザーが存在しないのでサインアップへ
            router.go('/sign_up');
          });
        },
      }
    })
  },
  '/sign_up': {
    component: Vue.extend({
      template: '#sign_up',
      data: function () {
        return {
          icons: [],
          sexes: [],
        };
      },
      methods: {
        sign_up: function () {
          $.ajax({
            url: create_url('/sessions/sign_up'),
            data: JSON.stringify({
              name: this.name,
              icon_id: this.icon_id,
              sex_id: this.sex_id
            }),
          }).done(function (data) {
            setUser(data.data);
            router.go('/guchis');
          });
        }
      },
      created: function () {
        var self = this;
        MasterData.done(function (data) {
          self.icons = data.data.icons;
          self.sexes = data.data.sexes;
        });
      }
    })
  },
  '/guchis': {
    component: Vue.extend({
      template: '#guchis',
      data: function () {
        return {
          user: getUser(),
          guchis: [],
          guchi_text: "", // 愚痴る為のテキスト
        };
      },
      created: function () {
        this.fetch_guchis();
      },
      methods: {
        fetch_guchis: function () {
          var self = this;
          $.ajax({
            url: create_url('/guchis')
          }).done(function (data) {
            self.guchis = data;
          }).fail(function () {
            // XXX: セッション切れてる？
          });
        },
        guchiru: function () {
          var self = this;
          $.ajax({
            url: create_url('/guchis/create'),
            data: JSON.stringify({
              content: self.guchi_text,
            }),
          }).done(function (data, status, xhr) {
            self.guchis.unshift(data);
          });
        },
      },
    }),
    auth: true
  },
  '/guchis/:guchi_id': {
    name: 'guchi',
    component: Vue.extend({
      template: '#guchi',
      data: function () {
        return {
          guchi: {}
        };
      },
      created: function () {
        var guchi_id = this.$route.params.guchi_id;
        $.ajax({
          url: create_url('/guchis/' + guchi_id)
        }).done(function (data) {
          // TODO: なぜか表示されない
          console.log(data);
          self.guchi = data.data;
        });
      }
    }),
    auth: true
  },
  '/guchis/:guchi_id/replies': {
    name: 'replies',
    component: Vue.extend({
      template: '#replies'
    }),
    auth: true
  },
});

router.beforeEach(function (transition) {
  var authenticated = getUser();
  if (transition.to.auth && !authenticated) {
    transition.redirect('/sign_in');
  }
  else {
    transition.next();
  }
});

router.start(App, '#app');




// Save user object into localstorage
function getUser() {
  var user = localStorage.getItem('user');
  if (!user) {
    return null;
  }
  try {
    return JSON.parse(user);
  } catch (e) {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}
