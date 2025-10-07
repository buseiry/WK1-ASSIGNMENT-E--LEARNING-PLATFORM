Test plan: session verification

- Arrange: create verified user; write minimal user doc
- Act: call startSessionV2; wait TEST_SESSION_MINUTES; trigger verifySessionV2
- Assert: session.completed==true; users.points incremented by 1; no duplicate award on rerun






