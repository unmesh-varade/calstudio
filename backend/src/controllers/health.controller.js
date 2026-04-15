function getHealth(req, res) {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getHealth,
};
