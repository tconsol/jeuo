import { createSlice } from '@reduxjs/toolkit';

const matchSlice = createSlice({
  name: 'match',
  initialState: {
    liveScore: null,
    scoreVersion: 0,
    events: [],
    isConnected: false,
  },
  reducers: {
    setLiveScore: (state, action) => {
      state.liveScore = action.payload.score;
      state.scoreVersion = action.payload.scoreVersion;
    },
    addEvent: (state, action) => {
      state.events.push(action.payload);
    },
    setEvents: (state, action) => {
      state.events = action.payload;
    },
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    resetMatch: (state) => {
      state.liveScore = null;
      state.scoreVersion = 0;
      state.events = [];
      state.isConnected = false;
    },
  },
});

export const { setLiveScore, addEvent, setEvents, setConnected, resetMatch } = matchSlice.actions;
export default matchSlice.reducer;
