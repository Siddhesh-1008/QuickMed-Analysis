export default {
  dialect: "postgresql",
  schema: "./src/utils/schema.jsx",
  out: "./drizzle",
  dbCredentials: {
    url: "ADD UR DRIZZLE ORM URL",
    connectionString:
      "ADD UR DRIZZLE ORM  CONNECTION STRING",
  },
};
