export function getHealth(req, res) {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
}

export default {
  getHealth,
};
