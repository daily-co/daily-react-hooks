import { useMediaTrack } from './useMediaTrack';

/**
 * Returns a participant's video track and state.
 * @param participantId The participant's session_id.
 */
export const useVideoTrack = (participantId: string) =>
  useMediaTrack(participantId, 'video');
