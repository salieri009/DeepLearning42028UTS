# React Native — sample client for Java API

1. Copy `analyzeFrame.ts` into your RN / Expo app (e.g. `src/api/analyzeFrame.ts`).
2. At startup, call `configureCrowdNavApi("http://<LAN-IP>:8080")` so the client reaches the machine running [`backend/crowdnav-api`](../backend/crowdnav-api).
3. Call `analyzeFrameMock()` from a screen or effect; the backend returns mock JSON per TechSpec §7.

Android emulator: use `http://10.0.2.2:8080` to reach the host loopback.
