function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function pollOnce({ bridge, channel }) {
  const event = await channel.next();
  if (!event) return { ok: true, idle: true };
  const result = await bridge.handle(event);
  await channel.acknowledge(event.eventId, result.ok ? 'completed' : 'rejected');
  return result;
}

export async function pollForever({ bridge, channel, intervalMs = 2_000, signal, onResult = () => {} }) {
  while (!signal?.aborted) {
    try {
      onResult(await pollOnce({ bridge, channel }));
    } catch (error) {
      onResult({ ok: false, error: error.message });
    }
    if (!signal?.aborted) await delay(intervalMs);
  }
}
