const {
  listAdminActivity,
  listDistinctActions,
  listDistinctResources,
  listActivityActors,
} = require('../services/adminActivityLog');

async function listActivityLogs(req, res, next) {
  try {
    const result = await listAdminActivity({
      adminId: req.query.admin_id || undefined,
      action: req.query.action || undefined,
      resource: req.query.resource || undefined,
      search: req.query.search || undefined,
      dateFrom: req.query.date_from || undefined,
      dateTo: req.query.date_to || undefined,
      page: req.query.page,
      limit: req.query.limit,
    });
    const actors = await listActivityActors();
    res.json({ ...result, actors });
  } catch (error) {
    next(error);
  }
}

async function listActivityActions(req, res, next) {
  try {
    res.json({ actions: await listDistinctActions() });
  } catch (error) {
    next(error);
  }
}

async function listActivityResources(req, res, next) {
  try {
    res.json({ resources: await listDistinctResources() });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listActivityLogs,
  listActivityActions,
  listActivityResources,
};
