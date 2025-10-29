index-B8WuHN2B.js:212 🔧 DeviceDetection getAdaptiveSettings: {deviceType: 'mobile', performance: 'low', forceVirtualization: null, virtualizationEnabled: false}
index-B8WuHN2B.js:212 📱 [Device Detection] Type: mobile | Performance: low | Virtual Scroll: OFF
index-B8WuHN2B.js:212 💾 Chat store rehydrated: {messagesCount: 200, lastReadMessageIds: {…}}
index-B8WuHN2B.js:212 🔌 WebSocket: Creating new connection...
index-B8WuHN2B.js:212 WebSocket connection to 'wss://mellchat-production.up.railway.app/' failed: 
x @ index-B8WuHN2B.js:212
(anonymous) @ index-B8WuHN2B.js:212
ol @ react-vendor-CJBOjUNh.js:32
Xt @ react-vendor-CJBOjUNh.js:32
(anonymous) @ react-vendor-CJBOjUNh.js:32
E @ react-vendor-CJBOjUNh.js:17
un @ react-vendor-CJBOjUNh.js:17
index-B8WuHN2B.js:212 🔌 WebSocket: Connection closed {code: 1006, reason: '', wasClean: false, currentSubscriptions: 0}
index-B8WuHN2B.js:212 🔄 WebSocket: Reconnecting... attempt 1
Access to fetch at 'https://mellchat-production.up.railway.app/api/v1/health' from origin 'https://www.mellchat.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
The FetchEvent for "https://mellchat-production.up.railway.app/api/v1/health" resulted in a network error response: the promise was rejected.
Promise.then
(anonymous) @ workbox-629f8be9.js:1
workbox-629f8be9.js:1 Uncaught (in promise) no-response: no-response :: [{"url":"https://mellchat-production.up.railway.app/api/v1/health"}]
    at F.P (workbox-629f8be9.js:1:20987)
    at async F.T (workbox-629f8be9.js:1:12697)
P @ workbox-629f8be9.js:1
await in P
T @ workbox-629f8be9.js:1
await in T
handleAll @ workbox-629f8be9.js:1
handle @ workbox-629f8be9.js:1
handleRequest @ workbox-629f8be9.js:1
(anonymous) @ workbox-629f8be9.js:1
index-B8WuHN2B.js:212  GET https://mellchat-production.up.railway.app/api/v1/health net::ERR_FAILED
checkHealth @ index-B8WuHN2B.js:212
startAutoCheck @ index-B8WuHN2B.js:212
(anonymous) @ index-B8WuHN2B.js:212
ol @ react-vendor-CJBOjUNh.js:32
Xt @ react-vendor-CJBOjUNh.js:32
(anonymous) @ react-vendor-CJBOjUNh.js:32
E @ react-vendor-CJBOjUNh.js:17
un @ react-vendor-CJBOjUNh.js:17
Access to fetch at 'https://mellchat-production.up.railway.app/api/v1/health' from origin 'https://www.mellchat.live' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
The FetchEvent for "https://mellchat-production.up.railway.app/api/v1/health" resulted in a network error response: the promise was rejected.
Promise.then
(anonymous) @ workbox-629f8be9.js:1
index-B8WuHN2B.js:212  GET https://mellchat-production.up.railway.app/api/v1/health net::ERR_FAILED
checkHealth @ index-B8WuHN2B.js:212
startAutoCheck @ index-B8WuHN2B.js:212
(anonymous) @ index-B8WuHN2B.js:212
ol @ react-vendor-CJBOjUNh.js:32
Xt @ react-vendor-CJBOjUNh.js:32
(anonymous) @ react-vendor-CJBOjUNh.js:32
E @ react-vendor-CJBOjUNh.js:17
un @ react-vendor-CJBOjUNh.js:17
workbox-629f8be9.js:1 Uncaught (in promise) no-response: no-response :: [{"url":"https://mellchat-production.up.railway.app/api/v1/health"}]
    at F.P (workbox-629f8be9.js:1:20987)
    at async F.T (workbox-629f8be9.js:1:12697)
P @ workbox-629f8be9.js:1
await in P
T @ workbox-629f8be9.js:1
await in T
handleAll @ workbox-629f8be9.js:1
handle @ workbox-629f8be9.js:1
handleRequest @ workbox-629f8be9.js:1
(anonymous) @ workbox-629f8be9.js:1
index-B8WuHN2B.js:217 WebSocket connection to 'wss://www.mellchat.live/' failed: 
connectWebSocket @ index-B8WuHN2B.js:217
(anonymous) @ index-B8WuHN2B.js:234
ol @ react-vendor-CJBOjUNh.js:32
Xt @ react-vendor-CJBOjUNh.js:32
(anonymous) @ react-vendor-CJBOjUNh.js:32
E @ react-vendor-CJBOjUNh.js:17
un @ react-vendor-CJBOjUNh.js:17
index-B8WuHN2B.js:217 Admin WebSocket error: Event {isTrusted: true, type: 'error', target: WebSocket, currentTarget: WebSocket, eventPhase: 2, …}
a.onerror @ index-B8WuHN2B.js:217
index-B8WuHN2B.js:217 Admin WebSocket disconnected
index-B8WuHN2B.js:217  GET https://www.mellchat.live/api/v1/admin/ai/insights 502 (Bad Gateway)
fetchAIInsights @ index-B8WuHN2B.js:217
(anonymous) @ index-B8WuHN2B.js:234
(anonymous) @ index-B8WuHN2B.js:234
ol @ react-vendor-CJBOjUNh.js:32
Xt @ react-vendor-CJBOjUNh.js:32
(anonymous) @ react-vendor-CJBOjUNh.js:32
E @ react-vendor-CJBOjUNh.js:17
un @ react-vendor-CJBOjUNh.js:17
index-B8WuHN2B.js:217  GET https://www.mellchat.live/api/v1/admin/dashboard/charts?range=24h 502 (Bad Gateway)
fetchCharts @ index-B8WuHN2B.js:217
(anonymous) @ index-B8WuHN2B.js:234
(anonymous) @ index-B8WuHN2B.js:234
ol @ react-vendor-CJBOjUNh.js:32
Xt @ react-vendor-CJBOjUNh.js:32
(anonymous) @ react-vendor-CJBOjUNh.js:32
E @ react-vendor-CJBOjUNh.js:17
un @ react-vendor-CJBOjUNh.js:17
index-B8WuHN2B.js:217  GET https://www.mellchat.live/api/v1/admin/dashboard/metrics 502 (Bad Gateway)
fetchMetrics @ index-B8WuHN2B.js:217
(anonymous) @ index-B8WuHN2B.js:234
(anonymous) @ index-B8WuHN2B.js:234
ol @ react-vendor-CJBOjUNh.js:32
Xt @ react-vendor-CJBOjUNh.js:32
(anonymous) @ react-vendor-CJBOjUNh.js:32
E @ react-vendor-CJBOjUNh.js:17
un @ react-vendor-CJBOjUNh.js:17
index-B8WuHN2B.js:212 🔌 WebSocket: Creating new connection...
index-B8WuHN2B.js:212 WebSocket connection to 'wss://mellchat-production.up.railway.app/' failed: 
x @ index-B8WuHN2B.js:212
(anonymous) @ index-B8WuHN2B.js:212
index-B8WuHN2B.js:212 🔌 WebSocket: Connection closed {code: 1006, reason: '', wasClean: false, currentSubscriptions: 0}
index-B8WuHN2B.js:212 🔄 WebSocket: Reconnecting... attempt 2
index-B8WuHN2B.js:217 WebSocket is already in CLOSING or CLOSED state.
disconnectWebSocket @ index-B8WuHN2B.js:217
connectWebSocket @ index-B8WuHN2B.js:217
(anonymous) @ index-B8WuHN2B.js:217
setTimeout
a.onclose @ index-B8WuHN2B.js:217
index-B8WuHN2B.js:217 WebSocket connection to 'wss://www.mellchat.live/' failed: 
connectWebSocket @ index-B8WuHN2B.js:217
(anonymous) @ index-B8WuHN2B.js:217
index-B8WuHN2B.js:217 Admin WebSocket error: Event {isTrusted: true, type: 'error', target: WebSocket, currentTarget: WebSocket, eventPhase: 2, …}
a.onerror @ index-B8WuHN2B.js:217
index-B8WuHN2B.js:217 Admin WebSocket disconnected
index-B8WuHN2B.js:212 🔌 WebSocket: Creating new connection...
index-B8WuHN2B.js:212 WebSocket connection to 'wss://mellchat-production.up.railway.app/' failed: 
x @ index-B8WuHN2B.js:212
(anonymous) @ index-B8WuHN2B.js:212
index-B8WuHN2B.js:212 🔌 WebSocket: Connection closed {code: 1006, reason: '', wasClean: false, currentSubscriptions: 0}
index-B8WuHN2B.js:212 🔄 WebSocket: Reconnecting... attempt 3
