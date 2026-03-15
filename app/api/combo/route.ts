interface ComboState {
  count: number;
  lastTapTime: number;
  effects: string[];
}

const COMBO_TIMEOUT = 500;
const THRESHOLDS: [number, string][] = [
  [100, "golden_light"],
  [50, "lotus_bloom"],
  [10, "golden_ring"],
];

const sessions = new Map<string, { count: number; lastTapTime: number }>();

export async function POST(request: Request) {
  const body = await request.json();
  const sessionId: string = body.sessionId || "default";
  const tapTime: number = body.timestamp || Date.now();

  let session = sessions.get(sessionId);

  if (!session || (tapTime - session.lastTapTime) > COMBO_TIMEOUT) {
    session = { count: 0, lastTapTime: tapTime };
  }

  session.count += 1;
  session.lastTapTime = tapTime;
  sessions.set(sessionId, session);

  const effects: string[] = [];
  for (const [threshold, effect] of THRESHOLDS) {
    if (session.count >= threshold) {
      effects.push(effect);
      break;
    }
  }

  const result: ComboState = {
    count: session.count,
    lastTapTime: session.lastTapTime,
    effects,
  };

  return Response.json(result);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") || "default";
  const session = sessions.get(sessionId);

  if (!session) {
    return Response.json({ count: 0, lastTapTime: 0, effects: [] });
  }

  const now = Date.now();
  if ((now - session.lastTapTime) > COMBO_TIMEOUT) {
    sessions.delete(sessionId);
    return Response.json({ count: 0, lastTapTime: session.lastTapTime, effects: [], reset: true });
  }

  const effects: string[] = [];
  for (const [threshold, effect] of THRESHOLDS) {
    if (session.count >= threshold) {
      effects.push(effect);
      break;
    }
  }

  return Response.json({ count: session.count, lastTapTime: session.lastTapTime, effects });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId") || "default";
  sessions.delete(sessionId);
  return Response.json({ count: 0, lastTapTime: 0, effects: [], reset: true });
}
