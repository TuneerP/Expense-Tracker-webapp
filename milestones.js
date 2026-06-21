import { getSessionFromReq } from "../../../lib/auth";

export default async function handler(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(200).json({ user: null });
  }
  return res.status(200).json({ user: { id: session.sub, username: session.username } });
}
