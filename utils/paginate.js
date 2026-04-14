/**
 * Build pagination meta and SQL LIMIT/OFFSET
 */
const paginate = (query) => {
  const page  = Math.max(parseInt(query.page)  || 1, 1);
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    buildMeta: (total) => ({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    }),
  };
};

module.exports = { paginate };
