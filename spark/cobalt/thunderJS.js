"use strict";
function _interopDefault(e) {
    return e && "object" == typeof e && "default"in e ? e.default : e
}
var WebSocket;
function _typeof(e) {
    return (_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
        return typeof e
    }
    : function(e) {
        return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
    }
    )(e)
}
function _defineProperty(e, t, n) {
    return t in e ? Object.defineProperty(e, t, {
        value: n,
        enumerable: !0,
        configurable: !0,
        writable: !0
    }) : e[t] = n,
    e
}
function ownKeys(t, e) {
    var n = Object.keys(t);
    if (Object.getOwnPropertySymbols) {
        var r = Object.getOwnPropertySymbols(t);
        e && (r = r.filter(function(e) {
            return Object.getOwnPropertyDescriptor(t, e).enumerable
        })),
        n.push.apply(n, r)
    }
    return n
}
function _objectSpread2(t) {
    for (var e = 1; e < arguments.length; e++) {
        var n = null != arguments[e] ? arguments[e] : {};
        e % 2 ? ownKeys(n, !0).forEach(function(e) {
            _defineProperty(t, e, n[e])
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : ownKeys(n).forEach(function(e) {
            Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(n, e))
        })
    }
    return t
}
var requestsQueue = {}
  , listeners = {}
  , requestQueueResolver = function(e) {
    if ("string" == typeof e && (e = JSON.parse(e.normalize().replace(/\\x([0-9A-Fa-f]{2})/g, ""))),
    e.id) {
        var t = requestsQueue[e.id];
        t ? ("result"in e ? t.resolve(e.result) : t.reject(e.error),
        delete requestsQueue[e.id]) : console.log("no pending request found with id " + e.id)
    }
}
  , notificationListener = function(t) {
    if ("string" == typeof t && (t = JSON.parse(t.normalize().replace(/\\x([0-9A-Fa-f]{2})/g, ""))),
    !t.id && t.method) {
        var e = listeners[t.method];
        e && Array.isArray(e) && e.length ? e.forEach(function(e) {
            e(t.params)
        }) : console.log("no callbacks for " + t.method)
    }
}
  , protocol = "ws://"
  , host = "localhost"
  , endpoint = "/jsonrpc"
  , port = 80
  , makeWebsocketAddress = function(e) {
    return [e && e.protocol || protocol, e && e.host || host, ":" + (e && e.port || port), e && e.endpoint || endpoint].join("")
}
  , protocols = "notification"
  , connection = null
  , socket = null
  , connect = function(n) {
    return new Promise(function(e, t) {
        if (connection)
            e(connection);
        else
            try {
                socket || ((socket = new WebSocket(makeWebsocketAddress(n),protocols)).addEventListener("message", function(e) {
                    requestQueueResolver(e.data)
                }),
                socket.addEventListener("message", function(e) {
                    notificationListener(e.data)
                })),
                socket.addEventListener("open", function() {
                    e(connection = socket)
                })
            } catch (e) {
                t(e)
            }
    }
    )
}
  , makeBody = function(e, t, n, r, o) {
    r && delete r.version;
    var i = {
        jsonrpc: "2.0",
        id: e,
        method: [t, o, n].join(".")
    };
    return !r && !1 !== r || "object" === _typeof(r) && 0 === Object.keys(r).length || (i.params = r),
    i
}
  , getVersion = function(e, t, n) {
    var r;
    return (r = n && n.version) ? r : e && (e[t] || e.default) || 1
}
  , id = 0
  , makeId = function() {
    return id += 1
}
  , execRequest = function(e, t) {
    connect(e).then(function(e) {
        e.send(JSON.stringify(t))
    }).catch(console.error)
}
  , API = function(u) {
    return {
        request: function(i, s, c) {
            return new Promise(function(e, t) {
                var n = makeId()
                  , r = getVersion(u.versions, i, c)
                  , o = makeBody(n, i, s, c, r);
                u.debug && (console.log(" "),
                console.log("API REQUEST:"),
                console.log(JSON.stringify(o, null, 2)),
                console.log(" ")),
                requestsQueue[n] = {
                    body: o,
                    resolve: e,
                    reject: t
                },
                execRequest(u, o)
            }
            )
        }
    }
}
  , DeviceInfo = {
    freeRam: function(e) {
        return this.call("systeminfo", e).then(function(e) {
            return e.freeram
        })
    },
    version: function(e) {
        return this.call("systeminfo", e).then(function(e) {
            return e.version
        })
    }
}
  , plugins = {
    DeviceInfo: DeviceInfo
  };

function listener(t, n, e) {
    var r = this
      , o = register.call(this, t, n, e);
    return {
        dispose: function() {
            var e = makeListenerId(t, n);
            listeners[e].splice(o, 1),
            0 === listeners[e].length && unregister.call(r, t, n)
        }
    }
}

var api, makeListenerId = function(e, t) {
    return ["client", e, "events", t].join(".")
}

var register = function(e, t, n) {
    var r = makeListenerId(e, t);
    if (!listeners[r]) {
        listeners[r] = [];
        var o = {
            event: t,
            id: r.split(".").slice(0, -1).join(".")
        };
        this.api.request(e, "register", o).then().catch()
    }
    return listeners[r].push(n),
    listeners[r].length - 1
}

var unregister = function(e, t) {
    var n = makeListenerId(e, t);
    delete listeners[n];
    var r = {
        event: t,
        id: n.split(".").slice(0, -1).join(".")
    };
    this.api.request(e, "unregister", r)
}

var thunderJS = function(ws, e) {
    WebSocket = ws
    return api = API(e),
    wrapper(_objectSpread2({}, thunder(e), {}, plugins))
}

var resolve = function(n, e) {
    "object" === _typeof(n) && ("object" !== _typeof(n) || n.then && "function" == typeof n.then) || (n = new Promise(function(e, t) {
        n instanceof Error == !1 ? e(n) : t(n)
    }
    ));
    var t = "function" == typeof e[e.length - 1] ? e[e.length - 1] : null;
    if (!t)
        return n;
    n.then(function(e) {
        return t(null, e)
    }).catch(function(e) {
        return t(e)
    })
}

var thunder = function n(e) {
    return {
        options: e,
        plugin: !1,
        call: function() {
            var e = Array.prototype.slice.call(arguments);
            this.plugin && e[0] !== this.plugin && e.unshift(this.plugin);
            var t = e[0]
              , n = e[1];
            return "function" == typeof this[t][n] ? this[t][n](e[2]) : this.api.request.apply(this, e)
        },
        registerPlugin: function(e, t) {
            this[e] = wrapper(Object.assign(Object.create(n), t, {
                plugin: e
            }))
        },
        subscribe: function() {},
        on: function() {
            var e = Array.prototype.slice.call(arguments);
            return this.plugin && e[0] !== this.plugin && e.unshift(this.plugin),
            listener.apply(this, e)
        },
        once: function() {
            console.log("todo ...")
        }
    }
}

var wrapper = function e(t) {
    return new Proxy(t,{
        get: function(r, o) {
            var i = r[o];
            return "api" === o ? api : void 0 !== i ? "function" == typeof i ? -1 < ["on", "once", "subscribe"].indexOf(o) ? function() {
                for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
                    t[n] = arguments[n];
                return i.apply(this, t)
            }
            : function() {
                for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
                    t[n] = arguments[n];
                return resolve(i.apply(this, t), t)
            }
            : "object" === _typeof(i) ? e(Object.assign(Object.create(thunder(r.options)), i, {
                plugin: o
            })) : i : !1 === r.plugin ? e(Object.assign(Object.create(thunder(r.options)), {}, {
                plugin: o
            })) : function() {
                for (var e = arguments.length, t = new Array(e), n = 0; n < e; n++)
                    t[n] = arguments[n];
                return t.unshift(o),
                r.call.apply(this, t)
            }
        }
    })
};
module.exports = thunderJS;
