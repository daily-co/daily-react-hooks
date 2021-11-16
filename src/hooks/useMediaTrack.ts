import {
  DailyEventObjectParticipant,
  DailyEventObjectParticipants,
  DailyParticipant,
  DailyTrackState,
} from '@daily-co/daily-js';
import { useEffect, useMemo } from 'react';
import { atomFamily, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

type MediaType = keyof DailyParticipant['tracks'];

const mediaTrackState = atomFamily<DailyTrackState, string>({
  key: 'media-track',
  default: {
    state: 'loading',
    subscribed: false,
  },
});

export const useMediaTrack = (
  participantId: string,
  type: MediaType = 'video'
) => {
  const daily = useDaily();
  const key = useMemo(() => `${participantId}-${type}`, [participantId, type]);
  const trackState = useRecoilValue(mediaTrackState(key));

  const handleNewParticipantState = useRecoilCallback(
    ({ set, reset }) =>
      (ev: DailyEventObjectParticipant) => {
        if (ev.participant.session_id !== participantId) return;
        switch (ev.action) {
          case 'participant-joined':
          case 'participant-updated':
            set(mediaTrackState(key), ev.participant.tracks[type]);
            break;
          case 'participant-left':
            reset(mediaTrackState(key));
            break;
        }
      },
    [key, participantId, type]
  );

  useDailyEvent('participant-joined', handleNewParticipantState);
  useDailyEvent('participant-updated', handleNewParticipantState);
  useDailyEvent('participant-left', handleNewParticipantState);

  useDailyEvent(
    'joined-meeting',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectParticipants) => {
          set(mediaTrackState(key), ev.participants.local.tracks[type]);
        },
      [key, type]
    )
  );

  const setLocalState = useRecoilCallback(
    ({ set }) =>
      () => {
        const participants = daily?.participants();
        if (!participants?.local) return;
        set(mediaTrackState(key), participants.local.tracks[type]);
      },
    [daily, key, type]
  );
  useEffect(() => {
    if (!daily) return;
    const localParticipant = daily.participants().local;
    if (localParticipant.session_id !== participantId) return;
    setLocalState();
  }, [daily, participantId, setLocalState]);

  return {
    ...trackState,
    isOff:
      trackState.state === 'blocked' ||
      trackState.state === 'off' ||
      trackState.state === 'interrupted',
  };
};