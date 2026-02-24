module.exports = {
 name: '010_testimonial_images',
 async up(connection) {
  await connection.execute(`
      ALTER TABLE testimonials
      ADD COLUMN images JSON DEFAULT NULL
      AFTER avatar
    `);
 },
};
