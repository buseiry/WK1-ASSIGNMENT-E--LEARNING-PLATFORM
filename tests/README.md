Tests roadmap

Unit tests (Cloud Functions):
- verifySessionV2 aggregation and award path
- deny duplicate awards when completed=true

Integration tests (Emulator):
- Start session (email verified) -> wait TEST_SESSION_MINUTES -> verify point +1
- Payment webhook simulation marks paymentStatus=true

Run:
- firebase emulators:start
- npm run test






