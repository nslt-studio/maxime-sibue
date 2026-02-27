export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return (
    String(mins).padStart(2, '0') + ':' +
    String(secs).padStart(2, '0') + ':' +
    String(ms).padStart(3, '0')
  );
}
